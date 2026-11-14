"""
End-to-End Pipeline Integration Tests for LectureLens AI Service.
Exercises the full ingestion lifecycle with fake adapters (no GPU required).
"""
import asyncio
from pathlib import Path
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from ai_service.config import get_settings
from ai_service.core.asr import FakeAsrEngine
from ai_service.core.audio_store import LocalVolumeAudioStore
from ai_service.core.chunk_store import CompositeChunkStore, InMemoryChunkStore
from ai_service.core.embedder import FakeEmbedder
from ai_service.core.job_reporter import RecordingJobReporter
from ai_service.core.preprocessing import FakeAudioPreprocessor
from ai_service.core.text_chunker import RecursiveTokenChunker, WhitespaceApproxTokenizer
from ai_service.dependencies import (
    get_asr_engine,
    get_audio_preprocessor,
    get_audio_store,
    get_chunk_store,
    get_embedder,
    get_job_reporter,
    get_pipeline_coordinator,
    get_text_chunker,
)
from ai_service.main import app
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator


@pytest.fixture
def mock_dependencies(tmp_path: Path):
    audio_store = LocalVolumeAudioStore(storage_root=tmp_path)
    preprocessor = FakeAudioPreprocessor(synthetic_duration_seconds=5.0)
    asr_engine = FakeAsrEngine()
    reporter = RecordingJobReporter()
    text_chunker = RecursiveTokenChunker(
        tokenizer=WhitespaceApproxTokenizer(),
        max_tokens=512,
        overlap_tokens=64,
    )
    embedder = FakeEmbedder()
    chunk_store = CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=None,
        enable_pgvector=False,
    )
    coordinator = IngestPipelineCoordinator(
        audio_store=audio_store,
        preprocessor=preprocessor,
        asr_engine=asr_engine,
        job_reporter=reporter,
        text_chunker=text_chunker,
        embedder=embedder,
        chunk_store=chunk_store,
        low_vram_mode=True,
    )

    app.dependency_overrides[get_audio_store] = lambda: audio_store
    app.dependency_overrides[get_audio_preprocessor] = lambda: preprocessor
    app.dependency_overrides[get_asr_engine] = lambda: asr_engine
    app.dependency_overrides[get_job_reporter] = lambda: reporter
    app.dependency_overrides[get_text_chunker] = lambda: text_chunker
    app.dependency_overrides[get_embedder] = lambda: embedder
    app.dependency_overrides[get_chunk_store] = lambda: chunk_store
    app.dependency_overrides[get_pipeline_coordinator] = lambda: coordinator

    yield {
        "audio_store": audio_store,
        "preprocessor": preprocessor,
        "asr_engine": asr_engine,
        "reporter": reporter,
        "text_chunker": text_chunker,
        "embedder": embedder,
        "chunk_store": chunk_store,
        "coordinator": coordinator,
        "tmp_path": tmp_path
    }

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ingest_pipeline_e2e_full_success(mock_dependencies):
    audio_store: LocalVolumeAudioStore = mock_dependencies["audio_store"]
    asr_engine: FakeAsrEngine = mock_dependencies["asr_engine"]
    reporter: RecordingJobReporter = mock_dependencies["reporter"]
    settings = get_settings()

    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    # 1. Pre-stage incoming audio file
    incoming_file = audio_store.get_incoming_path(job_id, "mp3")
    incoming_file.write_bytes(b"mock_mp3_payload_for_e2e_test")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 2. Trigger Ingestion via REST API
        response = await client.post(
            "/internal/v1/ai/ingest",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={
                "jobId": str(job_id),
                "lectureId": str(lecture_id),
                "fileExtension": "mp3"
            }
        )
        assert response.status_code == 202
        assert response.json()["status"] == "ACCEPTED"

        # Give BackgroundTask a short moment to finish in event loop
        await asyncio.sleep(0.15)

        # 3. Verify Manifest endpoint
        manifest_res = await client.get(
            f"/internal/v1/ai/audio/{job_id}/manifest",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}
        )
        assert manifest_res.status_code == 200
        manifest_data = manifest_res.json()
        assert manifest_data["stt"]["status"] == "COMPLETED"
        assert manifest_data["original"]["extension"] == "mp3"
        assert manifest_data["chunking"]["status"] == "COMPLETED"
        assert manifest_data["chunking"]["chunk_count"] >= 1
        assert manifest_data["chunking"]["chunks_rel_path"] == f"chunks/{job_id}/chunks.json"

        # 4. Verify Chunks API endpoint
        chunks_res = await client.get(
            f"/internal/v1/ai/chunks/{job_id}",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}
        )
        assert chunks_res.status_code == 200
        chunks_payload = chunks_res.json()
        assert chunks_payload["job_id"] == str(job_id)
        assert chunks_payload["lecture_id"] == str(lecture_id)
        assert chunks_payload["total_chunks"] >= 1
        first_chunk = chunks_payload["chunks"][0]
        assert len(first_chunk["embedding_half"]) == 1024
        assert first_chunk["token_count"] <= 512

        # 5. Verify Hybrid RRF Search API with unaccented Vietnamese query
        search_res = await client.post(
            "/internal/v1/ai/search/hybrid",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={
                "lectureIds": [str(lecture_id)],
                "query": "khong gian vector doc lap tuyen tinh",
                "topK": 5,
                "includeContext": True,
            },
        )
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["total_results"] >= 1
        top_hit = search_data["results"][0]
        assert top_hit["rrf_total_score"] > 0
        assert len(top_hit["expanded_context"]) >= 1

        # 6. Verify Context Expansion API endpoint
        ctx_res = await client.get(
            f"/internal/v1/ai/chunks/context/{first_chunk['id']}",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
        )
        assert ctx_res.status_code == 200
        ctx_data = ctx_res.json()
        assert ctx_data["chunk_id"] == first_chunk["id"]
        assert any(item["position"] == "CURRENT" for item in ctx_data["context"])

    # 7. Verify Transcript & Chunks Artifacts exist on disk and ASR unloaded in LOW_VRAM_MODE
    transcript_file = mock_dependencies["tmp_path"] / "transcripts" / str(job_id) / "transcript.json"
    chunks_file = mock_dependencies["tmp_path"] / "chunks" / str(job_id) / "chunks.json"
    assert transcript_file.exists()
    assert chunks_file.exists()
    assert asr_engine.unload_calls >= 1

    # 8. Verify full Stage 1 -> Stage 2 state machine progression
    statuses = [r["status"] for r in reporter.records]
    for expected in ("PROCESSING_STT", "STT_COMPLETED", "CHUNKING", "EMBEDDING", "READY"):
        assert expected in statuses
    assert statuses.index("STT_COMPLETED") < statuses.index("CHUNKING")
    assert statuses.index("CHUNKING") < statuses.index("EMBEDDING")
    assert statuses.index("EMBEDDING") < statuses.index("READY")
    assert reporter.records[-1]["status"] == "READY"
    assert reporter.records[-1]["progress"] == 100


@pytest.mark.asyncio
async def test_chunk_and_embed_endpoint_runs_stage2_from_existing_transcript(mock_dependencies):
    from ai_service.core.schemas import (
        TranscriptAudioMeta,
        TranscriptGeneratedMeta,
        TranscriptSchema,
        TranscriptSegment,
    )

    audio_store: LocalVolumeAudioStore = mock_dependencies["audio_store"]
    reporter: RecordingJobReporter = mock_dependencies["reporter"]
    settings = get_settings()

    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming = audio_store.get_incoming_path(job_id, "wav")
    incoming.write_bytes(b"wav_bytes")
    audio_store.register(job_id, lecture_id, "wav")

    transcript = TranscriptSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        generated=TranscriptGeneratedMeta(model="phowhisper-base", device="cpu"),
        audio=TranscriptAudioMeta(duration_seconds=20.0),
        full_text="Bài giảng về Active Directory và Domain Controller trong Windows Server.",
        segments=[
            TranscriptSegment(
                id=0,
                start_time_seconds=0.0,
                end_time_seconds=10.0,
                timestamp_label="00:00",
                text="Bài giảng về Active Directory và Domain Controller trong Windows Server.",
            )
        ],
    )
    audio_store.save_transcript(job_id, transcript)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/internal/v1/ai/chunk-and-embed",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={"jobId": str(job_id), "syncToDb": False},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "COMPLETED"
        assert body["job_id"] == str(job_id)
        assert body["lecture_id"] == str(lecture_id)
        assert body["chunk_count"] >= 1
        assert body["db_synced"] is False
        assert body["chunks_rel_path"] == f"chunks/{job_id}/chunks.json"

        # Missing transcript returns 404
        missing_res = await client.post(
            "/internal/v1/ai/chunk-and-embed",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={"jobId": str(uuid.uuid4())},
        )
        assert missing_res.status_code == 404

    statuses = [r["status"] for r in reporter.records]
    assert statuses == ["CHUNKING", "EMBEDDING", "READY"]


@pytest.mark.asyncio
async def test_health_reports_bge_m3_and_pgvector_status(mock_dependencies):
    settings = get_settings()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(
            "/internal/v1/ai/health",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
        )
        assert res.status_code == 200
        data = res.json()
        assert "bge_m3_path_exists" in data["models"]
        assert "pgvector_connected" in data
        assert data["pgvector_connected"] is False


@pytest.mark.asyncio
async def test_chunks_and_search_edge_cases(mock_dependencies):
    settings = get_settings()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        missing_chunks = await client.get(
            f"/internal/v1/ai/chunks/{uuid.uuid4()}",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
        )
        assert missing_chunks.status_code == 404

        missing_ctx = await client.get(
            f"/internal/v1/ai/chunks/context/{uuid.uuid4()}",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
        )
        assert missing_ctx.status_code == 404

        empty_search = await client.post(
            "/internal/v1/ai/search/hybrid",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={"lectureIds": [], "query": "vector", "topK": 5, "includeContext": False},
        )
        assert empty_search.status_code == 200
        assert empty_search.json()["total_results"] == 0
        assert empty_search.json()["results"] == []


@pytest.mark.asyncio
async def test_ingest_missing_file_returns_404(mock_dependencies):
    settings = get_settings()
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/ai/ingest",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={
                "jobId": str(job_id),
                "lectureId": str(lecture_id),
                "fileExtension": "wav"
            }
        )
        assert response.status_code == 404
        assert "not found in incoming volume" in response.json()["detail"]


@pytest.mark.asyncio
async def test_ingest_disallowed_extension_returns_422(mock_dependencies):
    settings = get_settings()
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/internal/v1/ai/ingest",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY},
            json={
                "jobId": str(job_id),
                "lectureId": str(lecture_id),
                "fileExtension": "exe"  # Disallowed extension
            }
        )
        assert response.status_code == 422


def test_audio_store_stage2_artifacts_and_mark_failed_preserves_stt(tmp_path: Path):
    from ai_service.core.schemas import (
        ChunksArtifactSchema,
        LectureChunkSchema,
        TranscriptAudioMeta,
        TranscriptGeneratedMeta,
        TranscriptSchema,
        TranscriptSegment,
    )

    store = LocalVolumeAudioStore(storage_root=tmp_path)
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming = store.get_incoming_path(job_id, "mp3")
    incoming.write_bytes(b"audio_payload")
    store.register(job_id, lecture_id, "mp3")

    assert store.load_transcript(job_id) is None
    assert store.load_chunks(job_id) is None

    transcript = TranscriptSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        generated=TranscriptGeneratedMeta(model="phowhisper-base", device="cpu"),
        audio=TranscriptAudioMeta(duration_seconds=10.0),
        full_text="Nội dung bài giảng.",
        segments=[
            TranscriptSegment(
                id=0,
                start_time_seconds=0.0,
                end_time_seconds=5.0,
                timestamp_label="00:00",
                text="Nội dung bài giảng.",
            )
        ],
    )
    store.save_transcript(job_id, transcript)
    loaded_transcript = store.load_transcript(job_id)
    assert loaded_transcript is not None
    assert loaded_transcript.full_text == "Nội dung bài giảng."

    chunk_id = uuid.uuid4()
    artifact = ChunksArtifactSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        total_chunks=1,
        chunks=[
            LectureChunkSchema(
                id=chunk_id,
                lecture_id=lecture_id,
                chunk_index=0,
                start_time_seconds=0.0,
                end_time_seconds=5.0,
                start_timestamp_display="00:00",
                end_timestamp_display="00:05",
                content="Nội dung bài giảng.",
                token_count=5,
                embedding_half=[0.03125] * 1024,
            )
        ],
    )
    chunks_path = store.save_chunks(job_id, artifact, db_synced=True)
    assert chunks_path.exists()
    assert chunks_path == tmp_path.resolve() / "chunks" / str(job_id) / "chunks.json"

    loaded_chunks = store.load_chunks(job_id)
    assert loaded_chunks is not None
    assert loaded_chunks.total_chunks == 1
    assert loaded_chunks.chunks[0].id == chunk_id

    manifest = store.resolve_manifest(job_id)
    assert manifest is not None
    assert manifest.chunking.status == "COMPLETED"
    assert manifest.chunking.chunk_count == 1
    assert manifest.chunking.db_synced is True
    assert manifest.chunking.chunks_rel_path == f"chunks/{job_id}/chunks.json"

    # Marking failure after STT completed must NOT clobber stt.status
    store.mark_failed(job_id, "Embedding OOM")
    failed_manifest = store.resolve_manifest(job_id)
    assert failed_manifest is not None
    assert failed_manifest.stt.status == "COMPLETED"
    assert failed_manifest.chunking.status == "FAILED"
    assert failed_manifest.chunking.last_error == "Embedding OOM"


def test_asr_engine_unload_releases_resources():
    from ai_service.core.asr import PhoWhisperEngine

    fake = FakeAsrEngine()
    fake.unload()
    assert fake.unload_calls == 1

    engine = PhoWhisperEngine(model_path=Path("backend/models/phowhisper-base"), device="cpu")
    engine._model = object()
    engine._processor = object()
    engine._prompt_ids = object()
    engine.unload()
    assert engine._model is None
    assert engine._processor is None
    assert engine._prompt_ids is None

