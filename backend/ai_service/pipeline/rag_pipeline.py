"""
Online RAG Pipeline Coordinator Deep Module ([Q1]–[Q6+], No Semantic Cache).
Orchestrates 2-Pass Pre-RAG flow:
  [Q1] Pass 1 Gemma 4 (default gemma4:e2b): Normalize & clarify student query -> prepared_query
  [Q2] BGE-M3 Query Encoding (prepared_query) + 3-Stream Hybrid RRF Retrieval (with Query Drift Guard)
  [Q3] 3-Way Context Expansion (PREVIOUS / CURRENT / NEXT)
  [Q4] Cross-Encoder Reranking (BGE-Reranker-v2-m3)
  [Q5] Pass 2 Gemma 4 + Top K RAG + System Prompt -> Standard Output
  [Q6+] Optional Pluggable Gemma 4 Extra Stages (`extraStages`)
  Audit: Persist latency & retrieval trace to `rag.rag_audit_logs` (no semantic cache).
Under GLOBAL_GPU_SEMAPHORE with Sequential VRAM Offloading (`LOW_VRAM_MODE`).
"""
import asyncio
import logging
import re
import time
import unicodedata
from uuid import UUID

from ai_service.core.chunk_store import ChunkStoreProtocol
from ai_service.core.embedder import EmbedderProtocol
from ai_service.core.llm_client import (
    CompositeLLMClient,
    EngineMode,
    LLMClientProtocol,
    OllamaGemmaClient,
)
from ai_service.core.prompt_builder import GroundedPromptBuilder
from ai_service.core.reranker import RerankerProtocol
from ai_service.core.schemas import (
    ExpandedContextItem,
    LlmGenerateRequest,
    LlmGenerateResponse,
    RagCitationItem,
    RagQueryRequest,
    RagQueryResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
    RagTelemetryMeta,
    StageOutputItem,
)
from ai_service.core.telemetry_store import TelemetryStoreProtocol
from ai_service.pipeline.ingest_pipeline import GLOBAL_GPU_SEMAPHORE

logger = logging.getLogger("ai_service.rag_pipeline")

_TOKEN_RE = re.compile(r"[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF_/\-.]+")


def _strip_vietnamese_diacritics(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return without_marks.replace("đ", "d").replace("Đ", "D")


def _merge_preserved_keywords(original_query: str, prepared_query: str) -> str:
    """
    Query Drift Guard: appends any original keywords/acronyms/codes (>=2 chars)
    dropped by Pass 1 query rewriting so Lexical TSVector & Fuzzy Trigram streams
    never lose exact domain terms.
    """
    clean_prep = (prepared_query or "").strip()
    clean_orig = (original_query or "").strip()
    if not clean_prep:
        return clean_orig
    if not clean_orig:
        return clean_prep

    prep_tokens = {
        _strip_vietnamese_diacritics(tok.strip("./-")).lower()
        for tok in _TOKEN_RE.findall(clean_prep)
    }
    prep_tokens.discard("")

    missing_tokens: list[str] = []
    seen_folded: set[str] = set()
    for raw_tok in _TOKEN_RE.findall(clean_orig):
        tok = raw_tok.strip("./-")
        if not tok:
            continue
        folded = _strip_vietnamese_diacritics(tok).lower()
        if len(folded) < 2:
            continue
        if folded not in prep_tokens and folded not in seen_folded:
            seen_folded.add(folded)
            missing_tokens.append(tok)

    if not missing_tokens:
        return clean_prep
    return f"{clean_prep} {' '.join(missing_tokens)}"


def _to_citation_item(row: dict) -> RagCitationItem:
    content = str(row.get("content", ""))
    snippet = content[:280].strip()
    if len(content) > 280:
        snippet += "..."
    expanded = [
        ExpandedContextItem(**ctx) if not isinstance(ctx, ExpandedContextItem) else ctx
        for ctx in (row.get("expanded_context") or [])
    ]
    return RagCitationItem(
        chunk_id=row["chunk_id"],
        lecture_id=row["lecture_id"],
        chunk_index=int(row["chunk_index"]),
        start_time_seconds=float(row["start_time_seconds"]),
        end_time_seconds=float(row["end_time_seconds"]),
        start_timestamp_display=str(row["start_timestamp_display"]),
        end_timestamp_display=str(row["end_timestamp_display"]),
        speaker_label=str(row.get("speaker_label") or "LECTURER"),
        text_snippet=snippet,
        content=content,
        dense_score=float(row.get("dense_score", 0.0) or 0.0),
        lexical_rank=row.get("lexical_rank"),
        fuzzy_rank=row.get("fuzzy_rank"),
        rrf_total_score=float(row.get("rrf_total_score", 0.0) or 0.0),
        rerank_logit=float(row.get("rerank_logit", 0.0) or 0.0),
        rerank_score=float(row.get("rerank_score", 0.0) or 0.0),
        expanded_context=expanded,
    )


def _invoke_llm(
    active_llm: LLMClientProtocol,
    built_prompt,
    *,
    query: str,
    contexts: list[dict] | None,
    temperature: float,
    max_new_tokens: int,
    engine_override: EngineMode | None = None,
    model_override: str | None = None,
):
    kwargs: dict = {
        "query": query,
        "contexts": contexts,
        "temperature": temperature,
        "max_new_tokens": max_new_tokens,
    }
    if isinstance(active_llm, CompositeLLMClient):
        if engine_override is not None:
            kwargs["engine_override"] = engine_override
        if model_override is not None:
            kwargs["model_override"] = model_override
    elif isinstance(active_llm, OllamaGemmaClient) and model_override is not None:
        kwargs["model_override"] = model_override
    return active_llm.generate(built_prompt, **kwargs)


class RagPipelineCoordinator:
    """
    Coordinates the modular 2-Pass Pre-RAG Online Pipeline ([Q1]–[Q6+], without Semantic Cache).
    Exposes unified `run_query` plus composable sub-flows (`retrieve_only`, `run_stage_chain`).
    """

    def __init__(
        self,
        *,
        embedder: EmbedderProtocol,
        chunk_store: ChunkStoreProtocol,
        reranker: RerankerProtocol,
        prompt_builder: GroundedPromptBuilder,
        llm_client: LLMClientProtocol,
        telemetry_store: TelemetryStoreProtocol,
        gpu_semaphore: asyncio.Semaphore | None = None,
        low_vram_mode: bool = True,
        default_retrieval_top_k: int = 25,
        query_prep_model: str | None = None,
    ) -> None:
        self.embedder = embedder
        self.chunk_store = chunk_store
        self.reranker = reranker
        self.prompt_builder = prompt_builder
        self.llm_client = llm_client
        self.telemetry_store = telemetry_store
        self.gpu_semaphore = gpu_semaphore or GLOBAL_GPU_SEMAPHORE
        self.low_vram_mode = low_vram_mode
        self.default_retrieval_top_k = default_retrieval_top_k
        self.query_prep_model = query_prep_model

    async def _prepare_query(
        self,
        *,
        query: str,
        query_system_prompt: str | None,
        temperature: float,
        max_new_tokens: int,
        active_llm: LLMClientProtocol,
        engine_override: EngineMode | None = None,
    ) -> tuple[str, StageOutputItem, float]:
        """[Q1] Pass 1 Gemma 4: Question + System Prompt -> normalized search query."""
        t0 = time.perf_counter()
        q1_prompt = self.prompt_builder.build_query_prep_prompt(
            query=query,
            custom_system_prompt=query_system_prompt,
        )
        loop = asyncio.get_running_loop()
        async with self.gpu_semaphore:
            try:
                q1_res = await loop.run_in_executor(
                    None,
                    lambda: _invoke_llm(
                        active_llm,
                        q1_prompt,
                        query=query,
                        contexts=None,
                        temperature=min(float(temperature), 0.2),
                        max_new_tokens=min(int(max_new_tokens), 256),
                        engine_override=engine_override,
                        model_override=self.query_prep_model,
                    ),
                )
            finally:
                if self.low_vram_mode and hasattr(active_llm, "unload"):
                    active_llm.unload()

        prepared_query = q1_res.text.strip() or query.strip()
        stage_item = StageOutputItem(
            stage_id=q1_prompt.stage_id,
            profile=q1_prompt.profile,
            system_prompt=q1_prompt.system_prompt,
            user_prompt=q1_prompt.user_prompt,
            response_format=q1_prompt.response_format,
            output=prepared_query,
            model=q1_res.model,
            engine=q1_res.engine,
            latency_ms=q1_res.latency_ms,
        )
        return prepared_query, stage_item, round((time.perf_counter() - t0) * 1000, 2)

    async def _encode_query(
        self,
        query: str,
        embedder: EmbedderProtocol,
    ) -> tuple[list[float], float]:
        t0 = time.perf_counter()
        loop = asyncio.get_running_loop()
        async with self.gpu_semaphore:
            try:
                emb = await loop.run_in_executor(None, lambda: embedder.encode_query(query))
            finally:
                if self.low_vram_mode and hasattr(embedder, "unload"):
                    embedder.unload()
        return emb.dense_halfvec, round((time.perf_counter() - t0) * 1000, 2)

    async def _retrieve_and_rerank(
        self,
        *,
        lecture_ids: list[UUID],
        query: str,
        lexical_query: str | None = None,
        query_embedding: list[float],
        top_k: int,
        retrieval_top_k: int,
        include_context: bool,
        reranker: RerankerProtocol,
    ) -> dict:
        loop = asyncio.get_running_loop()

        # [Q2] 3-Stream Hybrid RRF Retrieval (lexical stream includes preserved original keywords)
        t_ret = time.perf_counter()
        candidates = self.chunk_store.search_hybrid_rrf(
            lecture_ids=lecture_ids,
            query_embedding=query_embedding,
            query_text=lexical_query or query,
            top_k=retrieval_top_k,
        )
        retrieval_ms = round((time.perf_counter() - t_ret) * 1000, 2)

        # [Q3] 3-Way Context Expansion (PREVIOUS / CURRENT / NEXT)
        t_exp = time.perf_counter()
        if include_context and candidates:
            for cand in candidates:
                cand["expanded_context"] = self.chunk_store.get_expanded_context(cand["chunk_id"])
        else:
            for cand in candidates:
                cand["expanded_context"] = []
        expand_ms = round((time.perf_counter() - t_exp) * 1000, 2)

        # [Q4] Cross-Encoder Reranking (BGE-Reranker-v2-m3)
        t_rr = time.perf_counter()
        if candidates:
            async with self.gpu_semaphore:
                try:
                    reranked = await loop.run_in_executor(
                        None,
                        lambda: reranker.rerank(query, candidates, top_n=top_k),
                    )
                finally:
                    if self.low_vram_mode and hasattr(reranker, "unload"):
                        reranker.unload()
        else:
            reranked = []
        rerank_ms = round((time.perf_counter() - t_rr) * 1000, 2)

        return {
            "candidates_retrieved": len(candidates),
            "reranked": reranked,
            "retrieval_ms": retrieval_ms,
            "expand_ms": expand_ms,
            "rerank_ms": rerank_ms,
        }

    async def retrieve_only(
        self,
        request: RagRetrieveRequest,
        *,
        embedder_override: EmbedderProtocol | None = None,
        reranker_override: RerankerProtocol | None = None,
    ) -> RagRetrieveResponse:
        """Executes [Q2] encode -> RRF -> [Q3] expand -> [Q4] rerank without calling LLM."""
        t_total = time.perf_counter()
        if not request.lecture_ids or not request.query.strip():
            return RagRetrieveResponse(
                query=request.query,
                lecture_ids=request.lecture_ids,
                total_candidates=0,
                total_reranked=0,
                results=[],
                telemetry=RagTelemetryMeta(total_ms=round((time.perf_counter() - t_total) * 1000, 2)),
            )

        active_embedder = embedder_override or self.embedder
        active_reranker = reranker_override or self.reranker
        query_vec, embed_ms = await self._encode_query(request.query, active_embedder)

        rr_out = await self._retrieve_and_rerank(
            lecture_ids=request.lecture_ids,
            query=request.query,
            query_embedding=query_vec,
            top_k=request.top_k,
            retrieval_top_k=max(request.top_k, request.retrieval_top_k),
            include_context=request.include_context,
            reranker=active_reranker,
        )
        citations = [_to_citation_item(row) for row in rr_out["reranked"]]
        return RagRetrieveResponse(
            query=request.query,
            lecture_ids=request.lecture_ids,
            total_candidates=rr_out["candidates_retrieved"],
            total_reranked=len(citations),
            results=citations,
            telemetry=RagTelemetryMeta(
                candidates_retrieved=rr_out["candidates_retrieved"],
                reranked_count=len(citations),
                embed_ms=embed_ms,
                retrieval_ms=rr_out["retrieval_ms"],
                expand_ms=rr_out["expand_ms"],
                rerank_ms=rr_out["rerank_ms"],
                total_ms=round((time.perf_counter() - t_total) * 1000, 2),
            ),
        )

    async def run_stage_chain(
        self,
        request: LlmGenerateRequest,
        *,
        llm_client_override: LLMClientProtocol | None = None,
        engine_override: EngineMode | None = None,
    ) -> LlmGenerateResponse:
        """
        Executes Gemma 4 + RAG Generation Chain:
          [Q5] Pass 2 Gemma 4 + RAG + System Prompt -> [Q6+] Optional Extra Stages
        """
        t_llm = time.perf_counter()
        active_llm = llm_client_override or self.llm_client
        effective_prepared = (request.prepared_query or "").strip() or request.query.strip()

        loop = asyncio.get_running_loop()
        stage_outputs: list[StageOutputItem] = []

        async with self.gpu_semaphore:
            try:
                # [Q5] Pass 2: Gemma 4 + RAG + System Prompt -> Standard Output
                q5_prompt = self.prompt_builder.build_rag_answer_prompt(
                    query=request.query,
                    prepared_query=effective_prepared,
                    contexts=request.contexts,
                    custom_system_prompt=request.system_prompt,
                    profile=request.prompt_profile,
                    response_format=request.response_format,
                    use_expanded_context=request.use_expanded_context,
                )
                q5_res = await loop.run_in_executor(
                    None,
                    lambda: _invoke_llm(
                        active_llm,
                        q5_prompt,
                        query=request.query,
                        contexts=request.contexts,
                        temperature=request.temperature,
                        max_new_tokens=request.max_new_tokens,
                        engine_override=engine_override,
                    ),
                )
                current_output = q5_res.text
                stage_outputs.append(
                    StageOutputItem(
                        stage_id=q5_prompt.stage_id,
                        profile=q5_prompt.profile,
                        system_prompt=q5_prompt.system_prompt,
                        user_prompt=q5_prompt.user_prompt,
                        response_format=q5_prompt.response_format,
                        output=current_output,
                        model=q5_res.model,
                        engine=q5_res.engine,
                        latency_ms=q5_res.latency_ms,
                    )
                )

                # [Q6+] Optional Extensible Gemma 4 Stages
                for extra_stage in request.extra_stages:
                    if not extra_stage.enabled:
                        continue
                    extra_prompt = self.prompt_builder.build_custom_stage_prompt(
                        stage=extra_stage,
                        previous_output=current_output,
                        query=request.query,
                        contexts=request.contexts,
                        use_expanded_context=request.use_expanded_context,
                    )
                    extra_res = await loop.run_in_executor(
                        None,
                        lambda ep=extra_prompt, st=extra_stage: _invoke_llm(
                            active_llm,
                            ep,
                            query=request.query,
                            contexts=request.contexts,
                            temperature=st.temperature,
                            max_new_tokens=st.max_new_tokens,
                            engine_override=engine_override,
                        ),
                    )
                    current_output = extra_res.text
                    stage_outputs.append(
                        StageOutputItem(
                            stage_id=extra_prompt.stage_id,
                            profile=extra_prompt.profile,
                            system_prompt=extra_prompt.system_prompt,
                            user_prompt=extra_prompt.user_prompt,
                            response_format=extra_prompt.response_format,
                            output=current_output,
                            model=extra_res.model,
                            engine=extra_res.engine,
                            latency_ms=extra_res.latency_ms,
                        )
                    )
            finally:
                if self.low_vram_mode and hasattr(active_llm, "unload"):
                    active_llm.unload()

        return LlmGenerateResponse(
            query=request.query,
            prepared_query=effective_prepared,
            answer=current_output,
            stage_outputs=stage_outputs,
            llm_ms=round((time.perf_counter() - t_llm) * 1000, 2),
        )

    async def run_query(
        self,
        request: RagQueryRequest,
        *,
        embedder_override: EmbedderProtocol | None = None,
        reranker_override: RerankerProtocol | None = None,
        llm_client_override: LLMClientProtocol | None = None,
        engine_override: EngineMode | None = None,
    ) -> RagQueryResponse:
        """
        Unified 2-Pass Pre-RAG Online Query handler ([Q1] -> [Q2] -> [Q3] -> [Q4] -> [Q5] -> [Q6+])
        without Semantic Query Cache.
        """
        t_total = time.perf_counter()

        if not request.lecture_ids or not request.query.strip():
            return RagQueryResponse(
                query=request.query,
                prepared_query="",
                lecture_ids=request.lecture_ids,
                answer="Bài giảng không đề cập đến nội dung này.",
                stage_outputs=[],
                citations=[],
                telemetry=RagTelemetryMeta(
                    total_ms=round((time.perf_counter() - t_total) * 1000, 2),
                ),
            )

        active_embedder = embedder_override or self.embedder
        active_reranker = reranker_override or self.reranker
        active_llm = llm_client_override or self.llm_client

        # [Q1] Pass 1 Gemma 4: Question + System Prompt -> prepared_query
        prepared_query, q1_stage, query_prep_ms = await self._prepare_query(
            query=request.query,
            query_system_prompt=request.query_system_prompt,
            temperature=request.temperature,
            max_new_tokens=request.max_new_tokens,
            active_llm=active_llm,
            engine_override=engine_override,
        )

        # [Q2] BGE-M3 Encode prepared_query
        query_vec, embed_ms = await self._encode_query(prepared_query, active_embedder)

        # Preserve any original keywords/acronyms dropped during Pass 1 for Lexical/Fuzzy RRF
        lexical_query = _merge_preserved_keywords(request.query, prepared_query)

        # [Q2] 3-Stream Hybrid RRF + [Q3] 3-Way Context Expansion + [Q4] Cross-Encoder Rerank
        retrieval_top_k = max(request.top_k, request.retrieval_top_k or self.default_retrieval_top_k)
        rr_out = await self._retrieve_and_rerank(
            lecture_ids=request.lecture_ids,
            query=prepared_query,
            lexical_query=lexical_query,
            query_embedding=query_vec,
            top_k=request.top_k,
            retrieval_top_k=retrieval_top_k,
            include_context=request.use_expanded_context,
            reranker=active_reranker,
        )
        reranked = rr_out["reranked"]
        citations = [_to_citation_item(row) for row in reranked]

        # [Q5] Pass 2 Gemma 4 + RAG + System Prompt -> [Q6+] Extra Stages
        gen_res = await self.run_stage_chain(
            LlmGenerateRequest(
                query=request.query,
                prepared_query=prepared_query,
                contexts=reranked,
                system_prompt=request.system_prompt,
                prompt_profile=request.prompt_profile,
                response_format=request.response_format,
                use_expanded_context=request.use_expanded_context,
                temperature=request.temperature,
                max_new_tokens=request.max_new_tokens,
                extra_stages=request.extra_stages,
            ),
            llm_client_override=active_llm,
            engine_override=engine_override,
        )

        # Persist RAG Audit Logs (No Semantic Query Cache)
        self.telemetry_store.log_rag_audit(
            lecture_id=request.lecture_ids[0],
            query_text=request.query,
            top_chunk_ids=[c.chunk_id for c in citations],
            rerank_scores=[c.rerank_score for c in citations],
            latency_retrieval_ms=int(round(rr_out["retrieval_ms"] + rr_out["expand_ms"])),
            latency_rerank_ms=int(round(rr_out["rerank_ms"])),
            latency_llm_ms=int(round(query_prep_ms + gen_res.llm_ms)),
        )

        return RagQueryResponse(
            query=request.query,
            prepared_query=prepared_query,
            lecture_ids=request.lecture_ids,
            answer=gen_res.answer,
            stage_outputs=[q1_stage, *gen_res.stage_outputs],
            citations=citations,
            telemetry=RagTelemetryMeta(
                candidates_retrieved=rr_out["candidates_retrieved"],
                reranked_count=len(citations),
                query_prep_ms=query_prep_ms,
                embed_ms=embed_ms,
                retrieval_ms=rr_out["retrieval_ms"],
                expand_ms=rr_out["expand_ms"],
                rerank_ms=rr_out["rerank_ms"],
                llm_ms=gen_res.llm_ms,
                total_ms=round((time.perf_counter() - t_total) * 1000, 2),
            ),
        )
