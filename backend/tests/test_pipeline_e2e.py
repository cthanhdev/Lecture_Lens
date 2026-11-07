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
from ai_service.core.job_reporter import RecordingJobReporter
from ai_service.core.preprocessing import FakeAudioPreprocessor
from ai_service.dependencies import (
    get_asr_engine,
    get_audio_preprocessor,
    get_audio_store,
    get_job_reporter,
    get_pipeline_coordinator,
)
from ai_service.main import app
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator


@pytest.fixture
def mock_dependencies(tmp_path: Path):
    audio_store = LocalVolumeAudioStore(storage_root=tmp_path)
    preprocessor = FakeAudioPreprocessor(synthetic_duration_seconds=5.0)
    asr_engine = FakeAsrEngine()
    reporter = RecordingJobReporter()
    coordinator = IngestPipelineCoordinator(
        audio_store=audio_store,
        preprocessor=preprocessor,
        asr_engine=asr_engine,
        job_reporter=reporter
    )

    app.dependency_overrides[get_audio_store] = lambda: audio_store
    app.dependency_overrides[get_audio_preprocessor] = lambda: preprocessor
    app.dependency_overrides[get_asr_engine] = lambda: asr_engine
    app.dependency_overrides[get_job_reporter] = lambda: reporter
    app.dependency_overrides[get_pipeline_coordinator] = lambda: coordinator

    yield {
        "audio_store": audio_store,
        "preprocessor": preprocessor,
        "asr_engine": asr_engine,
        "reporter": reporter,
        "coordinator": coordinator,
        "tmp_path": tmp_path
    }

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ingest_pipeline_e2e_full_success(mock_dependencies):
    audio_store: LocalVolumeAudioStore = mock_dependencies["audio_store"]
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
        await asyncio.sleep(0.1)

        # 3. Verify Manifest endpoint
        manifest_res = await client.get(
            f"/internal/v1/ai/audio/{job_id}/manifest",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}
        )
        assert manifest_res.status_code == 200
        manifest_data = manifest_res.json()
        assert manifest_data["stt"]["status"] == "COMPLETED"
        assert manifest_data["original"]["extension"] == "mp3"

    # 4. Verify Transcript Artifact exists on disk
    transcript_file = mock_dependencies["tmp_path"] / "transcripts" / str(job_id) / "transcript.json"
    assert transcript_file.exists()

    # 5. Verify status reporter captured correct progression
    statuses = [r["status"] for r in reporter.records]
    assert "PROCESSING_STT" in statuses
    assert "STT_COMPLETED" in statuses
    assert reporter.records[-1]["status"] == "STT_COMPLETED"
    assert reporter.records[-1]["progress"] == 100


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
