"""
Automated Test Suite for 2-Pass Pre-RAG & Gemma 4 Pipeline ([Q1]–[Q6+], No Semantic Cache).
Tests Reranker, GroundedPromptBuilder, LLMClient (gemma4:e2b default), TelemetryStore (Audit Logs only),
RagPipelineCoordinator (including Query Drift Guard), and FastAPI /internal/v1/ai/rag/* endpoints.
"""
import json
from pathlib import Path
from unittest.mock import MagicMock
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from ai_service.config import get_settings
from ai_service.core.chunk_store import CompositeChunkStore, InMemoryChunkStore
from ai_service.core.embedder import FakeEmbedder
from ai_service.core.llm_client import (
    CompositeLLMClient,
    FakeLLMClient,
    LLMGenerationResult,
    OllamaGemmaClient,
    TransformersGemmaClient,
)
from ai_service.core.prompt_builder import (
    BuiltPrompt,
    GroundedPromptBuilder,
    LLMStageConfig,
)
from ai_service.core.reranker import BgeRerankerV2M3, FakeReranker
from ai_service.core.schemas import (
    LectureChunkSchema,
    LlmGenerateRequest,
    RagQueryRequest,
    RagRetrieveRequest,
)
from ai_service.core.telemetry_store import (
    CompositeTelemetryStore,
    InMemoryTelemetryStore,
    PostgresTelemetryStore,
)
from ai_service.dependencies import get_rag_pipeline_coordinator
from ai_service.main import app
from ai_service.pipeline.rag_pipeline import RagPipelineCoordinator


class TrackingEmbedder(FakeEmbedder):
    def __init__(self) -> None:
        super().__init__()
        self.encode_calls: int = 0
        self.unload_calls: int = 0
        self.last_query: str | None = None

    def encode_query(self, text: str):
        self.encode_calls += 1
        self.last_query = text
        return super().encode_query(text)

    def unload(self) -> None:
        self.unload_calls += 1


class TrackingReranker(FakeReranker):
    def __init__(self) -> None:
        super().__init__()
        self.last_query: str | None = None

    def rerank(self, query: str, candidates: list[dict], top_n: int = 5) -> list[dict]:
        self.last_query = query
        return super().rerank(query, candidates, top_n=top_n)


class TrackingLLMClient:
    """Test adapter recording every BuiltPrompt passed across [Q1], [Q5], and [Q6+]."""

    def __init__(self) -> None:
        self.prompts: list[BuiltPrompt] = []
        self.unload_calls: int = 0

    def generate(
        self,
        built_prompt: BuiltPrompt,
        *,
        query: str = "",
        contexts: list[dict] | None = None,
        temperature: float = 0.2,
        max_new_tokens: int = 512,
    ) -> LLMGenerationResult:
        self.prompts.append(built_prompt)
        if built_prompt.stage_id == "q1_query_prep":
            text = f"Giải thích chi tiết về {query.strip()}"
        elif built_prompt.stage_id == "q5_rag_answer":
            if built_prompt.response_format == "json":
                text = json.dumps(
                    {"stage": built_prompt.stage_id, "answer": "JSON_OK [00:12]"},
                    ensure_ascii=False,
                )
            elif not contexts:
                text = "Bài giảng không đề cập đến nội dung này."
            else:
                ts = contexts[0].get("start_timestamp_display", "00:00")
                text = f"ANSWER_WITH_RAG({built_prompt.system_prompt[:30]}): Gradient Descent [{ts}]."
        else:
            text = f"EXTRA_{built_prompt.stage_id}_OK"
        return LLMGenerationResult(
            text=text,
            model="gemma4:e2b-test",
            engine="mock",
            latency_ms=1.2,
        )

    def unload(self) -> None:
        self.unload_calls += 1


def _seed_sample_chunks(embedder: FakeEmbedder, lecture_id: uuid.UUID) -> list[LectureChunkSchema]:
    c1_id = uuid.uuid4()
    c2_id = uuid.uuid4()
    c3_id = uuid.uuid4()

    texts = [
        "Trong chương mở đầu, giảng viên ôn tập mô hình OSI bảy lớp, AGDLP và học phần CS301.",
        "Thuật toán Gradient Descent cực tiểu hóa hàm mất mát bằng cách đi ngược hướng đạo hàm gradient.",
        "Hệ số tốc độ học learning rate ký hiệu alpha quyết định độ dài bước nhảy khi hội tụ.",
    ]
    embs = embedder.encode_passages(texts)
    return [
        LectureChunkSchema(
            id=c1_id,
            lecture_id=lecture_id,
            chunk_index=0,
            start_time_seconds=0.0,
            end_time_seconds=12.0,
            start_timestamp_display="00:00",
            end_timestamp_display="00:12",
            content=texts[0],
            token_count=20,
            embedding_half=embs[0].dense_halfvec,
            lexical_weights=embs[0].lexical_weights,
            prev_chunk_id=None,
            next_chunk_id=c2_id,
        ),
        LectureChunkSchema(
            id=c2_id,
            lecture_id=lecture_id,
            chunk_index=1,
            start_time_seconds=12.0,
            end_time_seconds=28.0,
            start_timestamp_display="00:12",
            end_timestamp_display="00:28",
            content=texts[1],
            token_count=22,
            embedding_half=embs[1].dense_halfvec,
            lexical_weights=embs[1].lexical_weights,
            prev_chunk_id=c1_id,
            next_chunk_id=c3_id,
        ),
        LectureChunkSchema(
            id=c3_id,
            lecture_id=lecture_id,
            chunk_index=2,
            start_time_seconds=28.0,
            end_time_seconds=45.0,
            start_timestamp_display="00:28",
            end_timestamp_display="00:45",
            content=texts[2],
            token_count=21,
            embedding_half=embs[2].dense_halfvec,
            lexical_weights=embs[2].lexical_weights,
            prev_chunk_id=c2_id,
            next_chunk_id=None,
        ),
    ]


# =========================================================================
# 1. Reranker Tests ([Q4])
# =========================================================================


def test_fake_reranker_scores_and_unloads():
    rr = FakeReranker()
    assert rr.rerank("gradient descent", [], top_n=3) == []
    candidates = [
        {"chunk_index": 0, "content": "Mạng máy tính và giao thức TCP/IP", "rrf_total_score": 0.03, "dense_score": 0.5},
        {"chunk_index": 1, "content": "Thuật toán Gradient Descent và hàm mất mát", "rrf_total_score": 0.02, "dense_score": 0.6},
    ]
    ranked = rr.rerank("thuat toan gradient descent", candidates, top_n=1)
    assert len(ranked) == 1
    assert ranked[0]["chunk_index"] == 1
    assert 0.0 <= ranked[0]["rerank_score"] <= 1.0
    rr.unload()
    assert rr.unload_calls == 1


def test_bge_reranker_lazy_load_and_missing_path_error(tmp_path: Path):
    rr = BgeRerankerV2M3(model_path=tmp_path / "missing-reranker", device="cpu")
    assert rr.rerank("query", [], top_n=3) == []
    with pytest.raises(FileNotFoundError):
        rr.rerank("query", [{"content": "hello"}], top_n=1)


# =========================================================================
# 2. Prompt Builder Tests ([Q1], [Q5], [Q6+])
# =========================================================================


def test_prompt_builder_query_prep_and_rag_answer_prompts():
    builder = GroundedPromptBuilder()
    assert not hasattr(builder, "compute_pipeline_prompt_hash")

    q1 = builder.build_query_prep_prompt(query="ad gpo AGDLP dung lam gi")
    assert q1.stage_id == "q1_query_prep"
    assert q1.profile == "query_prep"
    assert q1.response_format == "text"
    assert "BẢO TOÀN 100%" in q1.system_prompt
    assert "ad gpo AGDLP dung lam gi" in q1.user_prompt

    contexts = [
        {
            "start_timestamp_display": "00:12",
            "end_timestamp_display": "00:28",
            "rerank_score": 0.912,
            "content": "Thuật toán Gradient Descent cực tiểu hóa hàm mất mát.",
        }
    ]
    for profile, expected_fmt in [
        ("qa_refine", "text"),
        ("cornell_notes", "text"),
        ("quiz_json", "json"),
        ("custom", "text"),
    ]:
        q5 = builder.build_rag_answer_prompt(
            query="gd la gi",
            prepared_query="Thuật toán Gradient Descent là gì?",
            contexts=contexts,
            custom_system_prompt="Trả lời ngắn gọn." if profile == "custom" else None,
            profile=profile,  # type: ignore[arg-type]
        )
        assert q5.stage_id == "q5_rag_answer"
        assert q5.response_format == expected_fmt
        assert "gd la gi" in q5.user_prompt
        assert "Thuật toán Gradient Descent là gì?" in q5.user_prompt
        assert "[00:12 - 00:28]" in q5.user_prompt

    extra = builder.build_custom_stage_prompt(
        stage=LLMStageConfig(stageId="q6_polish", systemPrompt="Thêm summary", responseFormat="text"),
        previous_output="Câu trả lời gốc [00:12]",
        query="gd la gi",
        contexts=contexts,
    )
    assert extra.stage_id == "q6_polish"
    assert "Câu trả lời gốc [00:12]" in extra.user_prompt

    presets = builder.get_presets()
    assert "default_query_system_prompt" in presets
    assert "default_draft_system_prompt" not in presets
    assert len(presets["presets"]) == 4


# =========================================================================
# 3. LLM Client Tests (Ollama gemma4:e2b / Transformers / Composite / Fake)
# =========================================================================


def test_composite_llm_client_routing_and_missing_runtime_error():
    prompt = BuiltPrompt(
        stage_id="q5_rag_answer",
        profile="qa_refine",
        system_prompt="Sys",
        user_prompt="User",
        formatted_context="Ctx",
        response_format="json",
    )

    mock_ollama = MagicMock(spec=OllamaGemmaClient)
    mock_ollama.is_available.return_value = True
    mock_ollama.generate.return_value = LLMGenerationResult(
        text='{"ok": true}', model="gemma4:e2b", engine="ollama", latency_ms=10.0
    )
    mock_tf = MagicMock(spec=TransformersGemmaClient)
    mock_tf.is_model_present.return_value = False

    comp = CompositeLLMClient(mode="auto", ollama_client=mock_ollama, transformers_client=mock_tf)
    res = comp.generate(prompt, model_override="gemma4:e2b")
    assert res.engine == "ollama"
    assert res.model == "gemma4:e2b"
    mock_ollama.generate.assert_called_once()
    assert mock_ollama.generate.call_args.kwargs["model_override"] == "gemma4:e2b"

    # When Ollama offline and local weights missing -> raises RuntimeError (no silent fake)
    mock_ollama.is_available.return_value = False
    with pytest.raises(RuntimeError):
        comp.generate(prompt)

    # Explicit mock override succeeds
    res_mock = comp.generate(prompt, engine_override="mock")
    assert res_mock.engine == "mock"
    assert "questions" in json.loads(res_mock.text)


def test_transformers_gemma_missing_path_raises(tmp_path: Path):
    client = TransformersGemmaClient(model_path=tmp_path / "missing-gemma", device="cpu")
    assert client.is_model_present() is False
    prompt = BuiltPrompt(
        stage_id="q5_rag_answer",
        profile="qa_refine",
        system_prompt="Sys",
        user_prompt="User",
        formatted_context="Ctx",
    )
    with pytest.raises(FileNotFoundError):
        client.generate(prompt)
    client.unload()


# =========================================================================
# 4. Telemetry Store Tests (Audit Logs Only — Semantic Cache Removed)
# =========================================================================


def test_in_memory_and_postgres_audit_telemetry_store():
    store = InMemoryTelemetryStore()
    assert not hasattr(store, "lookup_semantic_cache")
    assert not hasattr(store, "save_semantic_cache")
    assert not hasattr(store, "list_cache_entries")
    assert not hasattr(store, "clear_cache")

    lid = uuid.uuid4()
    c1 = uuid.uuid4()
    audit_id = store.log_rag_audit(lid, "Gradient Descent là gì?", [c1], [0.92], 12, 8, 45)
    assert isinstance(audit_id, uuid.UUID)
    logs = store.list_audit_logs(lid)
    assert len(logs) == 1
    assert logs[0]["query_text"] == "Gradient Descent là gì?"
    assert logs[0]["rerank_scores"] == [0.92]

    # PostgresTelemetryStore SQL verification for audit logs only
    executed: list[tuple[str, tuple | None]] = []
    fake_cursor = MagicMock()
    fake_conn = MagicMock()
    fake_cursor.execute.side_effect = lambda sql, params=None: executed.append((sql, params))
    pg_audit_id = uuid.uuid4()
    fake_cursor.fetchone.side_effect = [(str(pg_audit_id),)]
    fake_cursor.fetchall.side_effect = [
        [
            (
                str(pg_audit_id),
                str(lid),
                "gd query",
                [str(c1)],
                [0.91],
                12,
                25,
                140,
                "2026-11-19T10:05:00",
            )
        ]
    ]
    fake_conn.cursor.return_value = fake_cursor

    pg_store = PostgresTelemetryStore(connection_factory=lambda: fake_conn)
    assert not hasattr(pg_store, "lookup_semantic_cache")
    logged_id = pg_store.log_rag_audit(lid, "gd query", [c1], [0.91], 12, 25, 140)
    assert logged_id == pg_audit_id
    assert "INSERT INTO rag.rag_audit_logs" in executed[0][0]

    audits = pg_store.list_audit_logs(lecture_id=lid, limit=10)
    assert len(audits) == 1
    assert audits[0]["rerank_scores"] == [0.91]

    # Composite falls back transparently when Postgres is offline
    pg_offline = PostgresTelemetryStore(
        connection_factory=lambda: (_ for _ in ()).throw(ConnectionError("offline"))
    )
    comp = CompositeTelemetryStore(memory_store=store, postgres_store=pg_offline, enable_pgvector=True)
    comp.log_rag_audit(lid, "fallback test", [c1], [0.85], 10, 5, 20)
    assert len(comp.list_audit_logs(lid)) == 2


# =========================================================================
# 5. 2-Pass Pre-RAG Coordinator Tests ([Q1]–[Q6+], No Cache, Drift Guard)
# =========================================================================


@pytest.mark.asyncio
async def test_rag_pipeline_two_pass_pre_rag_flow_and_no_cache():
    embedder = TrackingEmbedder()
    chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    reranker = TrackingReranker()
    encode_calls_after_seed = embedder.encode_calls
    llm = TrackingLLMClient()
    telemetry = InMemoryTelemetryStore()

    coordinator = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=reranker,
        prompt_builder=GroundedPromptBuilder(),
        llm_client=llm,
        telemetry_store=telemetry,
        low_vram_mode=True,
    )

    custom_q1_prompt = "Chuẩn hóa dấu tiếng Việt và giữ nguyên thuật ngữ gốc."
    custom_q5_prompt = "Hãy viết lại thật súc tích theo văn phong giáo trình đại học và giữ [MM:SS]."
    req1 = RagQueryRequest(
        lectureIds=[lecture_id],
        query="thuat toan gradient descent hoat dong nhu the nao",
        topK=2,
        querySystemPrompt=custom_q1_prompt,
        systemPrompt=custom_q5_prompt,
        promptProfile="custom",
        extraStages=[
            LLMStageConfig(
                stageId="q6_bullet_polish",
                systemPrompt="Tóm tắt thêm 1 dòng takeaway.",
                responseFormat="text",
                enabled=True,
            ),
            LLMStageConfig(
                stageId="q7_disabled",
                systemPrompt="Should not execute",
                enabled=False,
            ),
        ],
    )

    # Call 1: Full 2-Pass Pre-RAG flow
    res1 = await coordinator.run_query(req1)
    assert not hasattr(res1, "cache_hit")
    assert res1.prepared_query == "Giải thích chi tiết về thuat toan gradient descent hoat dong nhu the nao"
    assert embedder.last_query == res1.prepared_query
    assert reranker.last_query == res1.prepared_query
    assert len(res1.citations) == 2
    assert [s.stage_id for s in res1.stage_outputs] == [
        "q1_query_prep",
        "q5_rag_answer",
        "q6_bullet_polish",
    ]
    # Pass 1 ([Q1]) used custom querySystemPrompt
    assert llm.prompts[0].system_prompt == custom_q1_prompt
    # Pass 2 ([Q5]) received original query, prepared_query, RAG contexts & custom systemPrompt
    q5_prompt = llm.prompts[1]
    assert q5_prompt.system_prompt == custom_q5_prompt
    assert req1.query in q5_prompt.user_prompt
    assert res1.prepared_query in q5_prompt.user_prompt
    assert "[NGỮ CẢNH BÀI GIẢNG]" in q5_prompt.user_prompt
    # Pass 3 ([Q6+]) received Pass 2 output
    assert res1.stage_outputs[1].output in llm.prompts[2].user_prompt
    assert res1.answer == "EXTRA_q6_bullet_polish_OK"

    # Sequential VRAM Offloading executed across Pass 1 LLM, Embedder, Reranker, Pass 2+ LLM
    assert llm.unload_calls == 2
    assert embedder.unload_calls == 1
    assert reranker.unload_calls == 1

    # Call 2 with identical query: Semantic Cache is gone, so full pipeline executes again
    res2 = await coordinator.run_query(req1)
    assert not hasattr(res2, "cache_hit")
    assert len(llm.prompts) == 6
    assert embedder.encode_calls == encode_calls_after_seed + 2
    assert len(telemetry.list_audit_logs(lecture_id)) == 2


@pytest.mark.asyncio
async def test_rag_pipeline_preserves_original_keywords_against_query_drift():
    embedder = TrackingEmbedder()
    chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    recorded_lexical_queries: list[str] = []
    orig_search = chunk_store.search_hybrid_rrf

    def _spy_search(*, lecture_ids, query_embedding, query_text, top_k=10):
        recorded_lexical_queries.append(query_text)
        return orig_search(
            lecture_ids=lecture_ids,
            query_embedding=query_embedding,
            query_text=query_text,
            top_k=top_k,
        )

    chunk_store.search_hybrid_rrf = _spy_search  # type: ignore[method-assign]

    class _DriftLLM:
        def generate(self, built_prompt: BuiltPrompt, **kwargs) -> LLMGenerationResult:
            if built_prompt.stage_id == "q1_query_prep":
                # Intentionally drops "AGDLP" and "CS301"
                return LLMGenerationResult(
                    text="Chính sách phân quyền trong bài giảng dùng để làm gì?",
                    model="gemma4:e2b",
                    engine="ollama",
                    latency_ms=2.0,
                )
            return LLMGenerationResult(
                text="Mô hình AGDLP được giảng ở [00:00].",
                model="gemma4:e2b",
                engine="ollama",
                latency_ms=3.0,
            )

        def unload(self) -> None:
            return None

    coordinator = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=FakeReranker(),
        prompt_builder=GroundedPromptBuilder(),
        llm_client=_DriftLLM(),
        telemetry_store=InMemoryTelemetryStore(),
        low_vram_mode=False,
    )

    res = await coordinator.run_query(
        RagQueryRequest(
            lectureIds=[lecture_id],
            query="AGDLP va CS301 dung lam gi?",
            topK=2,
        )
    )
    assert res.prepared_query == "Chính sách phân quyền trong bài giảng dùng để làm gì?"
    assert embedder.last_query == res.prepared_query
    assert len(recorded_lexical_queries) == 1
    assert "Chính sách phân quyền" in recorded_lexical_queries[0]
    assert "AGDLP" in recorded_lexical_queries[0]
    assert "CS301" in recorded_lexical_queries[0]


@pytest.mark.asyncio
async def test_rag_pipeline_empty_query_prep_falls_back_to_original_query():
    embedder = TrackingEmbedder()
    chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    class _BlankPrepLLM:
        def generate(self, built_prompt: BuiltPrompt, **kwargs) -> LLMGenerationResult:
            if built_prompt.stage_id == "q1_query_prep":
                return LLMGenerationResult(text="   \n  ", model="gemma4:e2b", engine="mock")
            return LLMGenerationResult(text="Fallback OK [00:12].", model="gemma4:e2b", engine="mock")

        def unload(self) -> None:
            return None

    coordinator = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=FakeReranker(),
        prompt_builder=GroundedPromptBuilder(),
        llm_client=_BlankPrepLLM(),
        telemetry_store=InMemoryTelemetryStore(),
        low_vram_mode=False,
    )

    res = await coordinator.run_query(
        RagQueryRequest(lectureIds=[lecture_id], query="  gradient descent là gì?  ")
    )
    assert res.prepared_query == "gradient descent là gì?"
    assert embedder.last_query == "gradient descent là gì?"
    assert res.answer == "Fallback OK [00:12]."


def test_real_bge_reranker_v2_m3_vietnamese_scoring():
    model_dir = Path(__file__).resolve().parent.parent / "models" / "bge-reranker-v2-m3"
    if not (model_dir / "model.safetensors").exists() and not (model_dir / "pytorch_model.bin").exists():
        pytest.skip("bge-reranker-v2-m3 weights not present locally")

    rr = BgeRerankerV2M3(model_path=model_dir, device="cpu", max_length=256, batch_size=2)
    candidates = [
        {"chunk_index": 0, "content": "Hôm nay trời nắng đẹp và lớp học đi dã ngoại.", "rrf_total_score": 0.02},
        {"chunk_index": 1, "content": "Thuật toán Gradient Descent cập nhật tham số ngược hướng đạo hàm gradient để tối thiểu hóa hàm mất mát.", "rrf_total_score": 0.01},
    ]
    ranked = rr.rerank("Gradient Descent hoạt động như thế nào?", candidates, top_n=2)
    assert len(ranked) == 2
    assert ranked[0]["chunk_index"] == 1
    assert ranked[0]["rerank_score"] > ranked[1]["rerank_score"]
    rr.unload()
    assert rr._model is None
    assert rr._tokenizer is None


# =========================================================================
# 6. FastAPI Router & Security Tests
# =========================================================================


@pytest.mark.asyncio
async def test_rag_router_endpoints_and_security():
    settings = get_settings()
    embedder = FakeEmbedder()
    chunk_store = CompositeChunkStore(memory_store=InMemoryChunkStore(), postgres_store=None, enable_pgvector=False)
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    coordinator = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=FakeReranker(),
        prompt_builder=GroundedPromptBuilder(),
        llm_client=FakeLLMClient(),
        telemetry_store=InMemoryTelemetryStore(),
        low_vram_mode=True,
    )
    app.dependency_overrides[get_rag_pipeline_coordinator] = lambda: coordinator

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            unauth = await client.get("/internal/v1/ai/rag/presets")
            assert unauth.status_code == 401
            unauth_q = await client.post(
                "/internal/v1/ai/rag/query",
                headers={"X-Internal-Secret": "wrong-secret"},
                json={"lectureIds": [str(lecture_id)], "query": "gradient"},
            )
            assert unauth_q.status_code == 401

            headers = {"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}

            health_res = await client.get("/internal/v1/ai/health", headers=headers)
            assert health_res.status_code == 200
            models = health_res.json()["models"]
            assert "bge_reranker_path_exists" in models
            assert "gemma4_path_exists" in models

            presets_res = await client.get("/internal/v1/ai/rag/presets", headers=headers)
            assert presets_res.status_code == 200
            presets_json = presets_res.json()
            assert "default_query_system_prompt" in presets_json
            assert len(presets_json["presets"]) >= 3

            ret_res = await client.post(
                "/internal/v1/ai/rag/retrieve",
                headers=headers,
                json={"lectureIds": [str(lecture_id)], "query": "gradient descent", "topK": 2},
            )
            assert ret_res.status_code == 200
            ret_data = ret_res.json()
            assert ret_data["total_reranked"] == 2

            gen_res = await client.post(
                "/internal/v1/ai/llm/generate",
                headers=headers,
                json={
                    "query": "gradient descent",
                    "preparedQuery": "Giải thích Gradient Descent",
                    "contexts": ret_data["results"],
                    "promptProfile": "quiz_json",
                    "responseFormat": "json",
                },
            )
            assert gen_res.status_code == 200
            gen_data = gen_res.json()
            assert gen_data["prepared_query"] == "Giải thích Gradient Descent"
            parsed = json.loads(gen_data["answer"])
            assert "questions" in parsed

            q_res = await client.post(
                "/internal/v1/ai/rag/query",
                headers=headers,
                json={
                    "lectureIds": [str(lecture_id)],
                    "query": "gradient descent la gi",
                    "topK": 2,
                    "querySystemPrompt": "Chuẩn hóa dấu tiếng Việt cho câu hỏi này.",
                    "systemPrompt": "Trả lời chuẩn học thuật từ RAG và giữ [MM:SS].",
                    "promptProfile": "custom",
                },
            )
            assert q_res.status_code == 200
            q_data = q_res.json()
            assert "cache_hit" not in q_data
            assert q_data["prepared_query"]
            assert q_data["answer"]
            assert [s["stage_id"] for s in q_data["stage_outputs"]] == ["q1_query_prep", "q5_rag_answer"]
            assert len(q_data["citations"]) == 2
            assert q_data["telemetry"]["query_prep_ms"] >= 0.0
    finally:
        app.dependency_overrides.clear()


# =========================================================================
# 7. Gemma 4 Client Unit Tests (Transformers & Ollama gemma4:e2b)
# =========================================================================


def test_transformers_gemma_client_preserves_eos_and_strips_thinking_block():
    import torch
    from transformers import AutoTokenizer

    model_dir = Path("backend/models/gemma-4-e2b")
    if not model_dir.exists():
        model_dir = Path("backend/models/gemma-4-e4b")
    if not model_dir.exists():
        pytest.skip("Gemma 4 weights/tokenizer directory not present")

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir), local_files_only=True)
    built = BuiltPrompt(
        stage_id="q5_rag_answer",
        profile="qa_refine",
        system_prompt="System instruction",
        user_prompt="User question",
        formatted_context="[01:10] Sample context",
        response_format="text",
    )
    messages = [
        {"role": "system", "content": built.system_prompt},
        {"role": "user", "content": built.user_prompt},
    ]
    encoded = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True,
    )
    prompt_len = int(encoded["input_ids"].shape[-1])
    completion_ids = tokenizer.encode(
        "<|channel>thought\nInternal scratchpad<channel|>Câu trả lời chính xác [01:10].<turn|>",
        add_special_tokens=False,
    )
    full_ids = torch.cat(
        [encoded["input_ids"], torch.tensor([completion_ids], dtype=encoded["input_ids"].dtype)],
        dim=-1,
    )

    captured_kwargs: dict = {}

    class _StubModel:
        def __init__(self):
            self.generation_config = MagicMock(eos_token_id=[1, 106, 50])

        def generate(self, **kwargs):
            captured_kwargs.update(kwargs)
            return full_ids

    client = TransformersGemmaClient(model_path=model_dir, device="cpu")
    client._tokenizer = tokenizer
    client._model = _StubModel()
    client.device = "cpu"

    res = client.generate(built, temperature=0.0, max_new_tokens=128)
    assert res.engine == "transformers"
    assert res.text == "Câu trả lời chính xác [01:10]."
    assert "Internal scratchpad" not in res.text
    assert "<turn|>" not in res.text
    assert res.prompt_tokens == prompt_len
    assert res.completion_tokens == len(completion_ids)
    assert captured_kwargs["eos_token_id"] == [1, 106, 50]
    assert captured_kwargs["do_sample"] is False

    client.unload()
    assert client._model is None
    assert client._tokenizer is None


def test_transformers_gemma_client_ensure_loaded_uses_auto_dtype_for_qat(tmp_path: Path, monkeypatch):
    import transformers
    from transformers.quantizers.auto import AUTO_QUANTIZER_MAPPING
    from transformers.utils.quantization_config import GemmaQuantizationConfig

    assert "gemma" in AUTO_QUANTIZER_MAPPING
    quantizer = AUTO_QUANTIZER_MAPPING["gemma"](GemmaQuantizationConfig(num_bits=4, quantize_embeddings=True))
    quantizer.validate_environment()

    model_dir = tmp_path / "gemma-4-e2b"
    model_dir.mkdir(parents=True)
    (model_dir / "config.json").write_text('{"model_type": "gemma4"}', encoding="utf-8")
    (model_dir / "model.safetensors").write_bytes(b"stub")

    captured: dict = {}

    class _FakeModel:
        def __init__(self) -> None:
            self.is_quantized = True
            self.to_calls: list[str] = []
            self.eval_called = False

        def to(self, device: str):
            self.to_calls.append(device)
            return self

        def eval(self):
            self.eval_called = True
            return self

    fake_model = _FakeModel()

    def _fake_tok_load(path, **kwargs):
        captured["tok_path"] = path
        captured["tok_kwargs"] = kwargs
        return object()

    def _fake_model_load(path, **kwargs):
        captured["model_path"] = path
        captured["model_kwargs"] = kwargs
        return fake_model

    monkeypatch.setattr(transformers.AutoTokenizer, "from_pretrained", _fake_tok_load)
    monkeypatch.setattr(transformers.AutoModelForCausalLM, "from_pretrained", _fake_model_load)

    client = TransformersGemmaClient(model_path=model_dir, device="cpu")
    assert client.is_model_present() is True
    client._ensure_loaded()

    assert captured["tok_kwargs"] == {"local_files_only": True}
    assert captured["model_kwargs"]["dtype"] == "auto"
    assert captured["model_kwargs"]["local_files_only"] is True
    assert "low_cpu_mem_usage" not in captured["model_kwargs"]
    assert fake_model.eval_called is True
    assert fake_model.to_calls == []


def test_download_models_gemma_e2b_qat_config_and_hf_v2_kwargs(monkeypatch):
    import download_models as dm

    info = dm.MODELS["gemma-4-e2b"]
    assert info["repo_id"] == "google/gemma-4-E2B-it-qat-mobile-transformers"
    assert info["local_dir"].name == "gemma-4-e2b"

    recorded: list[dict] = []

    def _fake_snapshot_download(**kwargs):
        recorded.append(kwargs)
        return str(kwargs["local_dir"])

    monkeypatch.setattr(dm, "snapshot_download", _fake_snapshot_download)
    out = dm.download_models(selected=["gemma-4-e2b"], token="hf_test_tok", force=False)

    assert "gemma-4-e2b" in out
    assert len(recorded) == 1
    call = recorded[0]
    assert call["repo_id"] == "google/gemma-4-E2B-it-qat-mobile-transformers"
    assert Path(call["local_dir"]).name == "gemma-4-e2b"
    assert call["token"] == "hf_test_tok"
    assert call["force_download"] is False
    assert "local_dir_use_symlinks" not in call
    assert "resume_download" not in call


def test_ollama_gemma_client_default_e2b_model_override_and_json_format(monkeypatch):
    captured_calls: list[dict] = []

    class _FakeResponse:
        def __init__(self, content: str):
            self._content = content

        def raise_for_status(self):
            return None

        def json(self):
            return {
                "message": {"content": self._content},
                "prompt_eval_count": 42,
                "eval_count": 18,
            }

    class _FakeHttpClient:
        def __init__(self, timeout=None):
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json=None):
            captured_calls.append({"url": url, "payload": json})
            if json and json.get("format") == "json":
                return _FakeResponse('<|channel>thought\nplan json<channel|>{"questions": [{"q": "Test"}]}')
            return _FakeResponse("Câu hỏi đã chuẩn hóa")

    monkeypatch.setattr("ai_service.core.llm_client.httpx.Client", _FakeHttpClient)

    client = OllamaGemmaClient(base_url="http://localhost:11434/")
    assert client.model == "gemma4:e2b"

    q1_built = BuiltPrompt(
        stage_id="q1_query_prep",
        profile="query_prep",
        system_prompt="Normalize query",
        user_prompt="gd la gi",
        response_format="text",
    )
    res_q1 = client.generate(q1_built, temperature=0.1, max_new_tokens=128)
    assert captured_calls[0]["url"] == "http://localhost:11434/api/chat"
    assert captured_calls[0]["payload"]["model"] == "gemma4:e2b"
    assert res_q1.model == "gemma4:e2b"
    assert res_q1.text == "Câu hỏi đã chuẩn hóa"

    q5_built = BuiltPrompt(
        stage_id="q5_rag_answer",
        profile="quiz_json",
        system_prompt="Return JSON",
        user_prompt="Make quiz",
        formatted_context="[00:10] Quiz context",
        response_format="json",
    )
    res_q5 = client.generate(q5_built, temperature=0.1, max_new_tokens=256, model_override="gemma4:e4b")
    assert captured_calls[1]["payload"]["model"] == "gemma4:e4b"
    assert captured_calls[1]["payload"]["format"] == "json"
    assert res_q5.model == "gemma4:e4b"
    assert res_q5.engine == "ollama"
    assert res_q5.prompt_tokens == 42
    assert res_q5.completion_tokens == 18
    assert json.loads(res_q5.text) == {"questions": [{"q": "Test"}]}


@pytest.mark.asyncio
async def test_retrieve_only_clamps_top_k_and_query_handles_zero_candidates_and_503():
    embedder = FakeEmbedder()
    chunk_store = CompositeChunkStore(memory_store=InMemoryChunkStore(), postgres_store=None, enable_pgvector=False)
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    coordinator = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=FakeReranker(),
        prompt_builder=GroundedPromptBuilder(),
        llm_client=FakeLLMClient(),
        telemetry_store=InMemoryTelemetryStore(),
        low_vram_mode=False,
    )

    ret = await coordinator.retrieve_only(
        RagRetrieveRequest(
            lecture_ids=[lecture_id],
            query="gradient descent",
            top_k=3,
            retrieval_top_k=1,
        )
    )
    assert ret.total_reranked == 3

    empty_res = await coordinator.run_query(
        RagQueryRequest(
            lecture_ids=[uuid.uuid4()],
            query="nội dung không tồn tại",
        )
    )
    assert empty_res.telemetry.candidates_retrieved == 0
    assert empty_res.citations == []
    assert "không đề cập" in empty_res.answer.lower()

    class _FailingLLM:
        def generate(self, *args, **kwargs):
            raise RuntimeError("Ollama offline and Gemma 4 weights missing")

        def unload(self):
            return None

    failing_coord = RagPipelineCoordinator(
        embedder=embedder,
        chunk_store=chunk_store,
        reranker=FakeReranker(),
        prompt_builder=GroundedPromptBuilder(),
        llm_client=_FailingLLM(),
        telemetry_store=InMemoryTelemetryStore(),
        low_vram_mode=False,
    )
    app.dependency_overrides[get_rag_pipeline_coordinator] = lambda: failing_coord
    settings = get_settings()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.post(
                "/internal/v1/ai/rag/query",
                headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
                json={"lectureIds": [str(lecture_id)], "query": "gradient"},
            )
            assert res.status_code == 503
    finally:
        app.dependency_overrides.clear()
