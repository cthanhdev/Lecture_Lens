"""
Tests for dependency injection providers and coordinator edge cases.
"""
from pathlib import Path
import uuid
import pytest
from ai_service.config import Settings
from ai_service.core.schemas import IngestRequest
from ai_service.dependencies import (
    get_asr_engine,
    get_audio_preprocessor,
    get_audio_store,
    get_job_reporter,
    get_pipeline_coordinator,
)
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator


def test_dependency_providers(tmp_path: Path, monkeypatch):
    test_settings = Settings(
        STORAGE_ROOT=tmp_path,
        DEVICE="cpu",
        SPRING_BASE_URL="http://test-spring:8080"
    )
    monkeypatch.setattr("ai_service.dependencies.get_settings", lambda: test_settings)

    store = get_audio_store()
    assert store is not None

    preprocessor = get_audio_preprocessor()
    assert preprocessor is not None

    asr = get_asr_engine()
    assert asr is not None
    assert asr.device == "cpu"

    reporter = get_job_reporter()
    assert reporter is not None

    coord = get_pipeline_coordinator()
    assert isinstance(coord, IngestPipelineCoordinator)


@pytest.mark.asyncio
async def test_coordinator_handles_unexpected_error_and_marks_failed(tmp_path: Path):
    from ai_service.core.audio_store import LocalVolumeAudioStore
    from ai_service.core.job_reporter import RecordingJobReporter
    from ai_service.core.preprocessing import FakeAudioPreprocessor

    class BrokenAsrEngine:
        def transcribe(self, wav_path, on_progress=None):
            raise RuntimeError("Fatal CUDA Driver Failure during decoding")

    store = LocalVolumeAudioStore(storage_root=tmp_path)
    preprocessor = FakeAudioPreprocessor()
    broken_asr = BrokenAsrEngine()
    reporter = RecordingJobReporter()

    coord = IngestPipelineCoordinator(
        audio_store=store,
        preprocessor=preprocessor,
        asr_engine=broken_asr,
        job_reporter=reporter
    )

    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    incoming_file = store.get_incoming_path(job_id, "mp3")
    incoming_file.write_bytes(b"dummy_bytes")

    # Should catch error, mark manifest as FAILED, and report FAILED to reporter
    await coord.run(job_id, lecture_id, "mp3")

    manifest = store.resolve_manifest(job_id)
    assert manifest is not None
    assert manifest.stt.status == "FAILED"
    assert "Fatal CUDA Driver Failure" in manifest.stt.last_error

    assert any(r["status"] == "FAILED" for r in reporter.records)
