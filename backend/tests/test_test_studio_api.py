"""
Integration tests for the isolated TEST/server.py Backend Test Workbench.
Tests through the FastAPI HTTP seam without touching live volumes or PostgreSQL.
"""
import importlib.util
from pathlib import Path
import sys
import uuid

from httpx import ASGITransport, AsyncClient
import pytest

from ai_service.core.audio_store import LocalVolumeAudioStore
from ai_service.core.chunk_store import CompositeChunkStore, InMemoryChunkStore
from ai_service.core.telemetry_store import CompositeTelemetryStore, InMemoryTelemetryStore

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SERVER_PATH = PROJECT_ROOT / "TEST" / "server.py"


def _load_test_server_module():
    module_name = "lecturelens_test_studio_server"
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(module_name, SERVER_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def isolated_studio(tmp_path: Path, monkeypatch):
    server = _load_test_server_module()

    test_audio_store = LocalVolumeAudioStore(storage_root=tmp_path)
    test_chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    test_telemetry_store = CompositeTelemetryStore(
        memory_store=InMemoryTelemetryStore(),
        postgres_store=None,
        enable_pgvector=False,
    )

    monkeypatch.setattr(server, "STORAGE_ROOT", tmp_path)
    monkeypatch.setattr(server, "audio_store", test_audio_store)
    monkeypatch.setattr(server, "chunk_store", test_chunk_store)
    monkeypatch.setattr(server, "telemetry_store", test_telemetry_store)
    monkeypatch.setattr(server.rag_coordinator, "chunk_store", test_chunk_store)
    monkeypatch.setattr(server.rag_coordinator, "telemetry_store", test_telemetry_store)
    monkeypatch.setattr(server, "job_state_tracker", {})
    if hasattr(server, "job_trace_tracker"):
        monkeypatch.setattr(server, "job_trace_tracker", {})
    if hasattr(server, "recent_jobs"):
        monkeypatch.setattr(server, "recent_jobs", [])
    if hasattr(server, "recent_rag_runs"):
        monkeypatch.setattr(server, "recent_rag_runs", [])

    return server


@pytest.mark.asyncio
async def test_test_studio_ui_diagnostics_and_full_mock_flows(isolated_studio):
    server = isolated_studio
    transport = ASGITransport(app=server.app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. HTML Workbench renders cleanly without legacy PhoWhisper-Base UI text
        ui_res = await client.get("/")
        assert ui_res.status_code == 200
        assert "LectureLens" in ui_res.text
        assert "PhoWhisper-Base" not in ui_res.text

        # 2. System diagnostics reports runtime, BE config, 4 active models, and dual pipeline blueprint
        diag_res = await client.get("/api/system-diagnostics")
        assert diag_res.status_code == 200
        diag = diag_res.json()

        assert "runtime" in diag
        assert "python_version" in diag["runtime"]
        assert "transformers_version" in diag["runtime"]

        assert "be_config" in diag
        assert diag["be_config"]["semantic_cache_enabled"] is False
        assert "low_vram_mode" in diag["be_config"]
        assert "llm_engine_mode" in diag["be_config"]

        assert "models" in diag
        items = diag["models"]["items"]
        assert len(items) == 4
        assert [m["key"] for m in items] == [
            "phowhisper-medium",
            "bge-m3",
            "bge-reranker-v2-m3",
            "gemma-4-e2b",
        ]
        assert all(m["wiring_status"] == "ACTIVE" for m in items)

        assert "pipeline_blueprint" in diag
        assert "ingest" in diag["pipeline_blueprint"]
        assert "rag_query" in diag["pipeline_blueprint"]

        # 3. Run Stage 2 Sample (Mock) and inspect trace & artifacts
        s2_res = await client.post("/api/test-stage2-sample?mode=mock")
        assert s2_res.status_code == 200
        s2_data = s2_res.json()
        assert s2_data["status"] == "READY"
        job_id = s2_data["jobId"]
        lecture_id = s2_data["lectureId"]
        uuid.UUID(job_id)
        uuid.UUID(lecture_id)

        result_res = await client.get(f"/api/result/{job_id}")
        assert result_res.status_code == 200
        result_data = result_res.json()
        assert result_data["chunks"]["total_chunks"] >= 1
        assert "trace" in result_data
        trace = result_data["trace"]
        assert len(trace["steps"]) >= 6
        assert any(m["model_key"] == "fake-embedder" for m in trace["models_executed"])

        # 4. Recent jobs endpoint lists the completed run
        jobs_res = await client.get("/api/jobs")
        assert jobs_res.status_code == 200
        jobs = jobs_res.json()["jobs"]
        assert any(j["jobId"] == job_id for j in jobs)

        # 5. Hybrid RRF Search returns latency breakdown and expanded context
        search_res = await client.post(
            "/api/search",
            json={
                "lectureId": lecture_id,
                "query": "khong gian vector doc lap tuyen tinh",
                "topK": 3,
                "mode": "mock",
            },
        )
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["model_used"] == "fake-embedder"
        assert "latency_breakdown" in search_data
        for key in ("embed_ms", "rrf_ms", "context_ms", "total_ms"):
            assert key in search_data["latency_breakdown"]
        assert search_data["total_results"] >= 1

        # 6. Online 2-Pass Pre-RAG [Q1]-[Q6+] returns flow_trace, models_executed, and writes audit log
        rag_res = await client.post(
            "/api/rag/query",
            json={
                "lectureId": lecture_id,
                "query": "doc lap tuyen tinh la gi?",
                "topK": 3,
                "embedderMode": "mock",
                "rerankerMode": "mock",
                "llmEngine": "mock",
            },
        )
        assert rag_res.status_code == 200
        rag_data = rag_res.json()
        assert rag_data["prepared_query"]
        assert rag_data["answer"]
        assert len(rag_data["stage_outputs"]) >= 2
        assert "flow_trace" in rag_data
        assert len(rag_data["flow_trace"]) >= 6
        assert "models_executed" in rag_data
        assert len(rag_data["models_executed"]) >= 3

        telemetry_res = await client.get(f"/api/rag/telemetry?lecture_id={lecture_id}")
        assert telemetry_res.status_code == 200
        audit_logs = telemetry_res.json()["audit_logs"]
        assert len(audit_logs) == 1
        assert audit_logs[0]["query_text"] == "doc lap tuyen tinh la gi?"
