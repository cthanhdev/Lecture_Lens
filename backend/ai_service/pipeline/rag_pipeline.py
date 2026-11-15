"""
Online RAG Pipeline Coordinator Deep Module ([Q1]–[Q6+]).
Orchestrates:
  [Q1] BGE-M3 Query Encoding + Semantic Query Cache Lookup (with prompt_hash partitioning)
  [Q2] 3-Stream Hybrid RRF Retrieval (Dense halfvec + Lexical TSVECTOR + Fuzzy pg_trgm)
  [Q3] 3-Way Context Expansion (PREVIOUS / CURRENT / NEXT)
  [Q4] Cross-Encoder Reranking (BGE-Reranker-v2-m3)
  [Q5] Gemma 4 Pass 1: Grounded RAG Draft (`draft_answer`)
  [Q6] Gemma 4 Pass 2: Custom System Prompt Refiner (`answer`)
  [Q7+] Optional Pluggable Gemma 4 Extra Stages (`extraStages`)
Under GLOBAL_GPU_SEMAPHORE with Sequential VRAM Offloading (`LOW_VRAM_MODE`).
"""
import asyncio
import logging
import time
from uuid import UUID

from ai_service.core.chunk_store import ChunkStoreProtocol
from ai_service.core.embedder import EmbedderProtocol
from ai_service.core.llm_client import CompositeLLMClient, EngineMode, LLMClientProtocol
from ai_service.core.prompt_builder import (
    GroundedPromptBuilder,
    LLMStageConfig,
    PromptProfile,
    ResponseFormat,
)
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


class RagPipelineCoordinator:
    """
    Coordinates the modular [Q1]–[Q6+] Online RAG + Multi-Pass Gemma 4 pipeline.
    Exposes unified Cách 2 (`run_query`) as well as composable sub-flows
    (`retrieve_only` for [Q1]–[Q4] and `run_stage_chain` for [Q5]–[Q7+]).
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
        cache_similarity_threshold: float = 0.95,
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
        self.cache_similarity_threshold = cache_similarity_threshold

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
        query_embedding: list[float],
        top_k: int,
        retrieval_top_k: int,
        include_context: bool,
        reranker: RerankerProtocol,
    ) -> dict:
        loop = asyncio.get_running_loop()

        # [Q2] 3-Stream Hybrid RRF Retrieval
        t_ret = time.perf_counter()
        candidates = self.chunk_store.search_hybrid_rrf(
            lecture_ids=lecture_ids,
            query_embedding=query_embedding,
            query_text=query,
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
        """Executes [Q1] encode -> [Q2] RRF -> [Q3] expand -> [Q4] rerank without calling LLM."""
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
        Executes Multi-Pass Gemma 4 Chain:
          [Q5] Pass 1 RAG Grounded Draft -> [Q6] Pass 2 Custom System Prompt Refiner -> [Q7+] Extra Stages
        """
        t_llm = time.perf_counter()
        active_llm = llm_client_override or self.llm_client
        prompt_hash = self.prompt_builder.compute_pipeline_prompt_hash(
            draft_system_prompt=request.draft_system_prompt,
            refiner_system_prompt=request.system_prompt,
            profile=request.prompt_profile,
            response_format=request.response_format,
            use_expanded_context=request.use_expanded_context,
            extra_stages=request.extra_stages,
        )

        loop = asyncio.get_running_loop()
        stage_outputs: list[StageOutputItem] = []

        def _invoke_llm(built_prompt, temperature: float, max_new_tokens: int):
            if engine_override is not None and isinstance(active_llm, CompositeLLMClient):
                return active_llm.generate(
                    built_prompt,
                    query=request.query,
                    contexts=request.contexts,
                    temperature=temperature,
                    max_new_tokens=max_new_tokens,
                    engine_override=engine_override,
                )
            return active_llm.generate(
                built_prompt,
                query=request.query,
                contexts=request.contexts,
                temperature=temperature,
                max_new_tokens=max_new_tokens,
            )

        async with self.gpu_semaphore:
            try:
                # [Q5] Pass 1: RAG Grounded Draft
                q5_prompt = self.prompt_builder.build_rag_draft_prompt(
                    query=request.query,
                    contexts=request.contexts,
                    custom_system_prompt=request.draft_system_prompt,
                    use_expanded_context=request.use_expanded_context,
                    prompt_hash=prompt_hash,
                )
                q5_res = await loop.run_in_executor(
                    None,
                    lambda: _invoke_llm(q5_prompt, request.temperature, request.max_new_tokens),
                )
                draft_answer = q5_res.text
                stage_outputs.append(
                    StageOutputItem(
                        stage_id=q5_prompt.stage_id,
                        profile=q5_prompt.profile,
                        system_prompt=q5_prompt.system_prompt,
                        user_prompt=q5_prompt.user_prompt,
                        response_format=q5_prompt.response_format,
                        output=draft_answer,
                        model=q5_res.model,
                        engine=q5_res.engine,
                        latency_ms=q5_res.latency_ms,
                    )
                )

                # [Q6] Pass 2: Custom System Prompt Refiner
                q6_prompt = self.prompt_builder.build_refinement_prompt(
                    query=request.query,
                    draft_answer=draft_answer,
                    contexts=request.contexts,
                    custom_refiner_system_prompt=request.system_prompt,
                    profile=request.prompt_profile,
                    response_format=request.response_format,
                    use_expanded_context=request.use_expanded_context,
                    prompt_hash=prompt_hash,
                )
                q6_res = await loop.run_in_executor(
                    None,
                    lambda: _invoke_llm(q6_prompt, request.temperature, request.max_new_tokens),
                )
                current_output = q6_res.text
                stage_outputs.append(
                    StageOutputItem(
                        stage_id=q6_prompt.stage_id,
                        profile=q6_prompt.profile,
                        system_prompt=q6_prompt.system_prompt,
                        user_prompt=q6_prompt.user_prompt,
                        response_format=q6_prompt.response_format,
                        output=current_output,
                        model=q6_res.model,
                        engine=q6_res.engine,
                        latency_ms=q6_res.latency_ms,
                    )
                )

                # [Q7+] Optional Extensible Gemma 4 Stages
                for extra_stage in request.extra_stages:
                    if not extra_stage.enabled:
                        continue
                    extra_prompt = self.prompt_builder.build_custom_stage_prompt(
                        stage=extra_stage,
                        previous_output=current_output,
                        query=request.query,
                        contexts=request.contexts,
                        use_expanded_context=request.use_expanded_context,
                        prompt_hash=prompt_hash,
                    )
                    extra_res = await loop.run_in_executor(
                        None,
                        lambda ep=extra_prompt, st=extra_stage: _invoke_llm(
                            ep, st.temperature, st.max_new_tokens
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
            prompt_hash=prompt_hash,
            draft_answer=draft_answer,
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
        Unified Cách 2 endpoint handler executing [Q1] -> [Q6+] sequentially.
        """
        t_total = time.perf_counter()
        prompt_hash = self.prompt_builder.compute_pipeline_prompt_hash(
            draft_system_prompt=request.draft_system_prompt,
            refiner_system_prompt=request.system_prompt,
            profile=request.prompt_profile,
            response_format=request.response_format,
            use_expanded_context=request.use_expanded_context,
            extra_stages=request.extra_stages,
        )

        if not request.lecture_ids or not request.query.strip():
            return RagQueryResponse(
                query=request.query,
                lecture_ids=request.lecture_ids,
                cache_hit=False,
                draft_answer="",
                answer="Bài giảng không đề cập đến nội dung này.",
                stage_outputs=[],
                citations=[],
                telemetry=RagTelemetryMeta(
                    prompt_hash=prompt_hash,
                    total_ms=round((time.perf_counter() - t_total) * 1000, 2),
                ),
            )

        active_embedder = embedder_override or self.embedder
        active_reranker = reranker_override or self.reranker
        active_llm = llm_client_override or self.llm_client

        # [Q1] Encode original query (NO Q0 rewriting) + Semantic Cache Lookup
        query_vec, embed_ms = await self._encode_query(request.query, active_embedder)

        cache_ms = 0.0
        if request.use_cache:
            t_cache = time.perf_counter()
            cached = self.telemetry_store.lookup_semantic_cache(
                lecture_ids=request.lecture_ids,
                query_embedding=query_vec,
                prompt_hash=prompt_hash,
                similarity_threshold=self.cache_similarity_threshold,
            )
            cache_ms = round((time.perf_counter() - t_cache) * 1000, 2)
            if cached is not None:
                citations = [RagCitationItem(**c) for c in cached.get("citations", [])]
                stage_outputs = [StageOutputItem(**s) for s in cached.get("stage_outputs", [])]
                return RagQueryResponse(
                    query=request.query,
                    lecture_ids=request.lecture_ids,
                    cache_hit=True,
                    draft_answer=str(cached.get("draft_answer", "")),
                    answer=str(cached.get("answer", "")),
                    stage_outputs=stage_outputs,
                    citations=citations,
                    telemetry=RagTelemetryMeta(
                        prompt_hash=prompt_hash,
                        candidates_retrieved=len(citations),
                        reranked_count=len(citations),
                        embed_ms=embed_ms,
                        cache_ms=cache_ms,
                        total_ms=round((time.perf_counter() - t_total) * 1000, 2),
                        similarity=cached.get("similarity"),
                    ),
                )

        # [Q2] 3-Stream Hybrid RRF + [Q3] 3-Way Context Expansion + [Q4] Cross-Encoder Rerank
        retrieval_top_k = max(request.top_k, request.retrieval_top_k or self.default_retrieval_top_k)
        rr_out = await self._retrieve_and_rerank(
            lecture_ids=request.lecture_ids,
            query=request.query,
            query_embedding=query_vec,
            top_k=request.top_k,
            retrieval_top_k=retrieval_top_k,
            include_context=request.use_expanded_context,
            reranker=active_reranker,
        )
        reranked = rr_out["reranked"]
        citations = [_to_citation_item(row) for row in reranked]

        # [Q5] Pass 1 Draft -> [Q6] Pass 2 Custom System Prompt Refiner -> [Q7+] Extra Stages
        gen_res = await self.run_stage_chain(
            LlmGenerateRequest(
                query=request.query,
                contexts=reranked,
                draft_system_prompt=request.draft_system_prompt,
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

        # Persist to Semantic Cache & RAG Audit Logs
        citations_json = [c.model_dump(mode="json") for c in citations]
        stages_json = [s.model_dump(mode="json") for s in gen_res.stage_outputs]

        if request.use_cache:
            self.telemetry_store.save_semantic_cache(
                lecture_ids=request.lecture_ids,
                query_text=request.query,
                query_embedding=query_vec,
                prompt_hash=prompt_hash,
                answer=gen_res.answer,
                draft_answer=gen_res.draft_answer,
                stage_outputs=stages_json,
                citations=citations_json,
            )

        self.telemetry_store.log_rag_audit(
            lecture_id=request.lecture_ids[0],
            query_text=request.query,
            top_chunk_ids=[c.chunk_id for c in citations],
            rerank_scores=[c.rerank_score for c in citations],
            latency_retrieval_ms=int(round(rr_out["retrieval_ms"] + rr_out["expand_ms"])),
            latency_rerank_ms=int(round(rr_out["rerank_ms"])),
            latency_llm_ms=int(round(gen_res.llm_ms)),
        )

        return RagQueryResponse(
            query=request.query,
            lecture_ids=request.lecture_ids,
            cache_hit=False,
            draft_answer=gen_res.draft_answer,
            answer=gen_res.answer,
            stage_outputs=gen_res.stage_outputs,
            citations=citations,
            telemetry=RagTelemetryMeta(
                prompt_hash=prompt_hash,
                candidates_retrieved=rr_out["candidates_retrieved"],
                reranked_count=len(citations),
                embed_ms=embed_ms,
                cache_ms=cache_ms,
                retrieval_ms=rr_out["retrieval_ms"],
                expand_ms=rr_out["expand_ms"],
                rerank_ms=rr_out["rerank_ms"],
                llm_ms=gen_res.llm_ms,
                total_ms=round((time.perf_counter() - t_total) * 1000, 2),
            ),
        )
