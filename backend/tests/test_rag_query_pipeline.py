"""
Automated Test Suite for Online RAG & Multi-Pass Gemma 4 Pipeline ([Q1]–[Q6+]).
Tests Reranker, GroundedPromptBuilder, LLMClient, TelemetryStore, RagPipelineCoordinator,
and FastAPI /internal/v1/ai/rag/* endpoints through Protocol Seams.
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

    def encode_query(self, text: str):
        self.encode_calls += 1
        return super().encode_query(text)

    def unload(self) -> None:
        self.unload_calls += 1


class TrackingLLMClient:
    """Test adapter recording every BuiltPrompt passed across [Q5], [Q6], [Q7+]."""

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
        if built_prompt.stage_id == "q5_rag_draft":
            ts = (contexts or [{}])[0].get("start_timestamp_display", "00:00")
            text = f"DRAFT_FACTS: Gradient Descent cập nhật tham số ngược hướng gradient [{ts}]."
        elif built_prompt.stage_id == "q6_custom_refine":
            if built_prompt.response_format == "json":
                text = json.dumps(
                    {"refined_from": built_prompt.stage_id, "answer": "JSON_OK [00:12]"},
                    ensure_ascii=False,
                )
            else:
                text = f"REFINED_BY_CUSTOM_PROMPT({built_prompt.system_prompt[:30]}): {built_prompt.user_prompt.splitlines()[4]}"
        else:
            text = f"EXTRA_{built_prompt.stage_id}_OK"
        return LLMGenerationResult(
            text=text,
            model="gemma-4-e4b-test",
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
        "Trong chương mở đầu, giảng viên ôn tập mô hình OSI bảy lớp và bắt tay ba bước TCP.",
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
# 2. Prompt Builder Tests ([Q5], [Q6], [Q7+])
# =========================================================================


def test_prompt_builder_hash_invalidates_on_prompt_or_stage_change():
    builder = GroundedPromptBuilder()
    base_hash = builder.compute_pipeline_prompt_hash(
        draft_system_prompt=None,
        refiner_system_prompt="Hãy trả lời ngắn gọn.",
        profile="custom",
        response_format="text",
    )
    changed_refiner = builder.compute_pipeline_prompt_hash(
        draft_system_prompt=None,
        refiner_system_prompt="Hãy trả lời chi tiết dạng gạch đầu dòng.",
        profile="custom",
        response_format="text",
    )
    changed_format = builder.compute_pipeline_prompt_hash(
        draft_system_prompt=None,
        refiner_system_prompt="Hãy trả lời ngắn gọn.",
        profile="custom",
        response_format="json",
    )
    with_disabled_extra = builder.compute_pipeline_prompt_hash(
        draft_system_prompt=None,
        refiner_system_prompt="Hãy trả lời ngắn gọn.",
        profile="custom",
        response_format="text",
        extra_stages=[
            LLMStageConfig(stageId="q7_check", systemPrompt="Check tone", enabled=False)
        ],
    )
    with_enabled_extra = builder.compute_pipeline_prompt_hash(
        draft_system_prompt=None,
        refiner_system_prompt="Hãy trả lời ngắn gọn.",
        profile="custom",
        response_format="text",
        extra_stages=[
            LLMStageConfig(stageId="q7_check", systemPrompt="Check tone", enabled=True)
        ],
    )

    assert base_hash != changed_refiner
    assert base_hash != changed_format
    assert base_hash == with_disabled_extra
    assert base_hash != with_enabled_extra


# =========================================================================
# 3. LLM Client Tests (Ollama / Transformers / Composite / Fake)
# =========================================================================


def test_composite_llm_client_routing_and_missing_runtime_error(tmp_path: Path):
    prompt = BuiltPrompt(
        stage_id="q5_rag_draft",
        profile="rag_draft",
        system_prompt="Sys",
        user_prompt="User",
        formatted_context="Ctx",
        response_format="json",
    )

    mock_ollama = MagicMock(spec=OllamaGemmaClient)
    mock_ollama.is_available.return_value = True
    mock_ollama.generate.return_value = LLMGenerationResult(
        text='{"ok": true}', model="gemma-4-e4b", engine="ollama", latency_ms=10.0
    )
    mock_tf = MagicMock(spec=TransformersGemmaClient)
    mock_tf.is_model_present.return_value = False

    comp = CompositeLLMClient(mode="auto", ollama_client=mock_ollama, transformers_client=mock_tf)
    res = comp.generate(prompt)
    assert res.engine == "ollama"
    assert res.text == '{"ok": true}'

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
        stage_id="q5_rag_draft",
        profile="rag_draft",
        system_prompt="Sys",
        user_prompt="User",
        formatted_context="Ctx",
    )
    with pytest.raises(FileNotFoundError):
        client.generate(prompt)
    client.unload()


# =========================================================================
# 4. Telemetry Store Tests ([Q1] Semantic Cache & Audit Logs)
# =========================================================================


def test_in_memory_and_postgres_telemetry_store():
    store = InMemoryTelemetryStore()
    lid = uuid.uuid4()
    vec = [1.0] + [0.0] * 1023

    store.save_semantic_cache(
        lecture_ids=[lid],
        query_text="Gradient Descent là gì?",
        query_embedding=vec,
        prompt_hash="hash_a",
        answer="Final answer",
        draft_answer="Draft answer",
        stage_outputs=[],
        citations=[],
    )

    assert store.lookup_semantic_cache([lid], vec, "hash_b") is None
    assert store.lookup_semantic_cache([uuid.uuid4()], vec, "hash_a") is None
    hit = store.lookup_semantic_cache([lid], vec, "hash_a", similarity_threshold=0.95)
    assert hit is not None
    assert hit["answer"] == "Final answer"
    assert hit["hit_count"] == 2
    assert len(store.list_cache_entries(lid)) == 1
    assert store.clear_cache(lid) == 1
    assert store.list_cache_entries(lid) == []

    # Composite falls back when Postgres unreachable
    pg_offline = PostgresTelemetryStore(
        connection_factory=lambda: (_ for _ in ()).throw(ConnectionError("offline"))
    )
    comp = CompositeTelemetryStore(memory_store=store, postgres_store=pg_offline, enable_pgvector=True)
    comp.log_rag_audit(lid, "test", [uuid.uuid4()], [0.9], 10, 5, 20)
    assert len(comp.list_audit_logs(lid)) == 1


# =========================================================================
# 5. Multi-Pass RagPipelineCoordinator Tests ([Q1]–[Q7+])
# =========================================================================


@pytest.mark.asyncio
async def test_rag_pipeline_multi_pass_flow_extra_stages_and_cache_invalidation():
    embedder = TrackingEmbedder()
    chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    lecture_id = uuid.uuid4()
    chunk_store.save_lecture_chunks(lecture_id, _seed_sample_chunks(embedder, lecture_id))

    reranker = FakeReranker()
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

    custom_prompt_1 = "Hãy viết lại thật súc tích theo văn phong giáo trình đại học và giữ [MM:SS]."
    req1 = RagQueryRequest(
        lectureIds=[lecture_id],
        query="thuat toan gradient descent hoat dong nhu the nao",
        topK=2,
        systemPrompt=custom_prompt_1,
        promptProfile="custom",
        extraStages=[
            LLMStageConfig(
                stageId="q7_bullet_polish",
                systemPrompt="Tóm tắt thêm 1 dòng takeaway.",
                responseFormat="text",
                enabled=True,
            ),
            LLMStageConfig(
                stageId="q8_disabled",
                systemPrompt="Should not execute",
                enabled=False,
            ),
        ],
    )

    # Call 1: Cache Miss -> [Q1]..[Q7+] full flow
    res1 = await coordinator.run_query(req1)
    assert res1.cache_hit is False
    assert len(res1.citations) == 2
    assert len(res1.stage_outputs) == 3  # q5_rag_draft, q6_custom_refine, q7_bullet_polish
    assert [s.stage_id for s in res1.stage_outputs] == [
        "q5_rag_draft",
        "q6_custom_refine",
        "q7_bullet_polish",
    ]
    assert res1.draft_answer.startswith("DRAFT_FACTS:")
    # Pass 2 ([Q6]) received Pass 1's draft_answer AND user's custom systemPrompt
    q6_prompt = llm.prompts[1]
    assert q6_prompt.system_prompt == custom_prompt_1
    assert res1.draft_answer in q6_prompt.user_prompt
    # Pass 3 ([Q7+]) received Pass 2's output
    q7_prompt = llm.prompts[2]
    assert res1.stage_outputs[1].output in q7_prompt.user_prompt
    assert res1.answer == "EXTRA_q7_bullet_polish_OK"

    # Sequential VRAM Offloading executed across all 3 model families
    assert embedder.unload_calls == 1
    assert reranker.unload_calls == 1
    assert llm.unload_calls == 1

    # Call 2 with identical query + identical System Prompt -> [Q1] Semantic Cache Hit
    prompts_before_hit = len(llm.prompts)
    res2 = await coordinator.run_query(req1)
    assert res2.cache_hit is True
    assert res2.answer == res1.answer
    assert res2.draft_answer == res1.draft_answer
    assert len(llm.prompts) == prompts_before_hit  # LLM NOT called on cache hit
    assert reranker.unload_calls == 1  # Reranker NOT called on cache hit

    # Call 3 with same query but DIFFERENT System Prompt -> prompt_hash changes -> Cache Miss!
    req3 = req1.model_copy(
        update={
            "system_prompt": "Xuất kết quả dạng JSON trắc nghiệm.",
            "response_format": "json",
        }
    )
    res3 = await coordinator.run_query(req3)
    assert res3.cache_hit is False
    assert res3.telemetry.prompt_hash != res1.telemetry.prompt_hash
    assert len(llm.prompts) == prompts_before_hit + 3


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
            # Unauthorized without X-Internal-Secret
            unauth = await client.get("/internal/v1/ai/rag/presets")
            assert unauth.status_code == 401
            unauth_q = await client.post(
                "/internal/v1/ai/rag/query",
                headers={"X-Internal-Secret": "wrong-secret"},
                json={"lectureIds": [str(lecture_id)], "query": "gradient"},
            )
            assert unauth_q.status_code == 401

            headers = {"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}

            # Health reports reranker + gemma4 availability
            health_res = await client.get("/internal/v1/ai/health", headers=headers)
            assert health_res.status_code == 200
            models = health_res.json()["models"]
            assert "bge_reranker_path_exists" in models
            assert "gemma4_path_exists" in models

            # Presets endpoint
            presets_res = await client.get("/internal/v1/ai/rag/presets", headers=headers)
            assert presets_res.status_code == 200
            assert len(presets_res.json()["presets"]) >= 3

            # Retrieve-only endpoint ([Q1]-[Q4])
            ret_res = await client.post(
                "/internal/v1/ai/rag/retrieve",
                headers=headers,
                json={"lectureIds": [str(lecture_id)], "query": "gradient descent", "topK": 2},
            )
            assert ret_res.status_code == 200
            ret_data = ret_res.json()
            assert ret_data["total_reranked"] == 2

            # Generate-only endpoint ([Q5]-[Q6+])
            gen_res = await client.post(
                "/internal/v1/ai/llm/generate",
                headers=headers,
                json={
                    "query": "gradient descent",
                    "contexts": ret_data["results"],
                    "promptProfile": "quiz_json",
                    "responseFormat": "json",
                },
            )
            assert gen_res.status_code == 200
            gen_data = gen_res.json()
            parsed = json.loads(gen_data["answer"])
            assert "questions" in parsed

            # Unified Cách 2 endpoint ([Q1]-[Q6+])
            q_res = await client.post(
                "/internal/v1/ai/rag/query",
                headers=headers,
                json={
                    "lectureIds": [str(lecture_id)],
                    "query": "gradient descent la gi",
                    "topK": 2,
                    "systemPrompt": "Biên tập lại câu trả lời chuẩn học thuật và giữ [MM:SS].",
                    "promptProfile": "custom",
                    "useCache": True,
                },
            )
            assert q_res.status_code == 200
            q_data = q_res.json()
            assert q_data["cache_hit"] is False
            assert q_data["draft_answer"]
            assert q_data["answer"]
            assert len(q_data["stage_outputs"]) == 2
            assert len(q_data["citations"]) == 2
    finally:
        app.dependency_overrides.clear()


# =========================================================================
# 7. Regression Tests: Postgres SQL, Gemma 4 Client & Edge Cases
# =========================================================================


def test_postgres_telemetry_store_sql_and_multilecture_cache():
    lec_a = uuid.UUID("00000000-0000-0000-0000-000000000001")
    lec_b = uuid.UUID("00000000-0000-0000-0000-000000000002")
    cache_id = uuid.uuid4()
    audit_id = uuid.uuid4()
    executed: list[tuple[str, tuple | None]] = []

    fake_cursor = MagicMock()
    fake_conn = MagicMock()

    def _exec(sql: str, params=None):
        executed.append((sql, params))

    fake_cursor.execute.side_effect = _exec
    fake_cursor.fetchone.side_effect = [
        (str(cache_id),),  # save_semantic_cache RETURNING id
        (str(audit_id),),  # log_rag_audit RETURNING id
    ]
    fake_cursor.fetchall.side_effect = [
        # lookup_semantic_cache: first row mismatches lecture_ids, second row hits
        [
            (
                str(uuid.uuid4()),
                "other query",
                "other ans",
                {"prompt_hash": "ph1", "lecture_ids": [str(lec_a)]},
                1,
                0.98,
            ),
            (
                str(cache_id),
                "gd query",
                "cached ans",
                {
                    "prompt_hash": "ph1",
                    "lecture_ids": [str(lec_a), str(lec_b)],
                    "draft_answer": "draft",
                    "stage_outputs": [{"stage_id": "q5_rag_draft"}],
                    "citations": [{"chunk_id": "c1"}],
                },
                2,
                0.99,
            ),
        ],
        # list_cache_entries
        [
            (
                str(cache_id),
                str(lec_a),
                "gd query",
                "cached ans",
                {"prompt_hash": "ph1", "lecture_ids": [str(lec_a), str(lec_b)]},
                3,
                "2026-11-15T10:00:00",
                "2026-11-15T10:05:00",
            )
        ],
        # list_audit_logs
        [
            (
                str(audit_id),
                str(lec_a),
                "gd query",
                ["c1"],
                [0.91],
                12,
                25,
                140,
                "2026-11-15T10:05:00",
            )
        ],
    ]
    fake_cursor.rowcount = 1
    fake_conn.cursor.return_value = fake_cursor

    store = PostgresTelemetryStore(connection_factory=lambda: fake_conn)

    saved_id = store.save_semantic_cache(
        lecture_ids=[lec_b, lec_a],  # intentionally unsorted to verify sorting
        query_text="gd query",
        query_embedding=[0.1] * 1024,
        prompt_hash="ph1",
        answer="cached ans",
        draft_answer="draft",
        stage_outputs=[{"stage_id": "q5_rag_draft"}],
        citations=[{"chunk_id": "c1"}],
    )
    assert saved_id == cache_id
    assert "INSERT INTO rag.semantic_query_cache" in executed[0][0]
    assert executed[0][1][0] == str(lec_a)  # sorted primary lecture

    hit = store.lookup_semantic_cache(
        lecture_ids=[lec_a, lec_b],
        query_embedding=[0.1] * 1024,
        prompt_hash="ph1",
        similarity_threshold=0.95,
    )
    assert hit is not None
    assert hit["cache_id"] == cache_id
    assert hit["hit_count"] == 3
    assert "UPDATE rag.semantic_query_cache" in executed[2][0]

    logged_id = store.log_rag_audit(
        lecture_id=lec_a,
        query_text="gd query",
        top_chunk_ids=[uuid.uuid4()],
        rerank_scores=[0.91],
        latency_retrieval_ms=12,
        latency_rerank_ms=25,
        latency_llm_ms=140,
    )
    assert logged_id == audit_id
    assert "INSERT INTO rag.rag_audit_logs" in executed[3][0]

    # Non-primary lec_b must query cached_citations->'lecture_ids' @> '["..."]'
    entries = store.list_cache_entries(lecture_id=lec_b, limit=10)
    assert len(entries) == 1
    assert entries[0]["prompt_hash"] == "ph1"
    assert "cached_citations->'lecture_ids' @>" in executed[4][0].replace("(", "").replace(")", "")
    assert executed[4][1][1] == json.dumps([str(lec_b)])

    audits = store.list_audit_logs(lecture_id=lec_a, limit=10)
    assert len(audits) == 1
    assert audits[0]["rerank_scores"] == [0.91]

    cleared = store.clear_cache(lecture_id=lec_b)
    assert cleared == 1
    assert "cached_citations->'lecture_ids'" in executed[6][0]
    assert executed[6][1][1] == json.dumps([str(lec_b)])


def test_transformers_gemma_client_preserves_eos_and_strips_thinking_block():
    import torch
    from transformers import AutoTokenizer

    model_dir = Path("backend/models/gemma-4-e4b")
    if not model_dir.exists():
        pytest.skip("Gemma 4 weights/tokenizer directory not present")

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir), local_files_only=True)
    # Build output tokens = prompt + <|channel>thought\nreasoning<channel|>Final answer [01:10].<turn|>
    built = BuiltPrompt(
        stage_id="q5_rag_draft",
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
    # Must preserve all Gemma 4 stop tokens [1, 106, 50] instead of overwriting with single 1
    assert captured_kwargs["eos_token_id"] == [1, 106, 50]
    assert captured_kwargs["do_sample"] is False

    client.unload()
    assert client._model is None
    assert client._tokenizer is None


def test_ollama_gemma_client_json_format_and_thinking_strip(monkeypatch):
    captured: dict = {}

    class _FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "message": {
                    "content": '<|channel>thought\nplan json<channel|>{"questions": [{"q": "Test"}]}'
                },
                "prompt_eval_count": 42,
                "eval_count": 18,
            }

    class _FakeHttpClient:
        def __init__(self, timeout=None):
            captured["timeout"] = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, url, json=None):
            captured["url"] = url
            captured["payload"] = json
            return _FakeResponse()

    monkeypatch.setattr("ai_service.core.llm_client.httpx.Client", _FakeHttpClient)

    client = OllamaGemmaClient(base_url="http://localhost:11434/", model="gemma-4-e4b")
    built = BuiltPrompt(
        stage_id="q6_custom_refine",
        profile="quiz_json",
        system_prompt="Return JSON",
        user_prompt="Make quiz",
        formatted_context="[00:10] Quiz context",
        response_format="json",
    )
    res = client.generate(built, temperature=0.1, max_new_tokens=256)
    assert captured["url"] == "http://localhost:11434/api/chat"
    assert captured["payload"]["format"] == "json"
    assert res.engine == "ollama"
    assert res.prompt_tokens == 42
    assert res.completion_tokens == 18
    assert json.loads(res.text) == {"questions": [{"q": "Test"}]}


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

    # Edge case: top_k > retrieval_top_k should clamp retrieval_top_k to top_k
    ret = await coordinator.retrieve_only(
        RagRetrieveRequest(
            lecture_ids=[lecture_id],
            query="gradient descent",
            top_k=3,
            retrieval_top_k=1,
        )
    )
    assert ret.total_reranked == 3

    # Edge case: unknown lecture_id yields 0 retrieved candidates but still runs Pass 1 & 2 safely
    empty_res = await coordinator.run_query(
        RagQueryRequest(
            lecture_ids=[uuid.uuid4()],
            query="nội dung không tồn tại",
            use_cache=False,
        )
    )
    assert empty_res.telemetry.candidates_retrieved == 0
    assert empty_res.citations == []
    assert "không đề cập" in empty_res.answer.lower()

    # Router returns 503 when LLM runtime fails
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
                json={"lectureIds": [str(lecture_id)], "query": "gradient", "useCache": False},
            )
            assert res.status_code == 503
    finally:
        app.dependency_overrides.clear()
