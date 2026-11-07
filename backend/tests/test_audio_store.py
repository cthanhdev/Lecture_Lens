"""
Tests for AudioStore Deep Module.
Verifies registration, streaming checksums, O(1) manifest resolution, and atomic artifact persistence.
"""
from pathlib import Path
import uuid
import pytest
from ai_service.core.audio_store import LocalVolumeAudioStore
from ai_service.core.schemas import (
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
    TranscriptSegment,
)


@pytest.fixture
def audio_store(tmp_path: Path) -> LocalVolumeAudioStore:
    return LocalVolumeAudioStore(storage_root=tmp_path)


def test_register_success(audio_store: LocalVolumeAudioStore):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming_file = audio_store.get_incoming_path(job_id, "mp3")

    # Create dummy audio content
    sample_content = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00audio_data_stream_payload"
    incoming_file.write_bytes(sample_content)

    manifest = audio_store.register(job_id, lecture_id, "mp3")
    assert manifest.job_id == job_id
    assert manifest.lecture_id == lecture_id
    assert manifest.original.extension == "mp3"
    assert manifest.original.size_bytes == len(sample_content)
    assert len(manifest.original.sha256) == 64
    assert manifest.stt.status == "PENDING"

    # Verify O(1) retrieval
    resolved = audio_store.resolve_manifest(job_id)
    assert resolved is not None
    assert resolved.job_id == job_id
    assert resolved.original.sha256 == manifest.original.sha256


def test_register_missing_file_raises_filenotfound(audio_store: LocalVolumeAudioStore):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    with pytest.raises(FileNotFoundError, match="Incoming audio file not found"):
        audio_store.register(job_id, lecture_id, "mp3")


def test_register_empty_file_raises_valueerror(audio_store: LocalVolumeAudioStore):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming_file = audio_store.get_incoming_path(job_id, "mp3")
    incoming_file.write_bytes(b"")

    with pytest.raises(ValueError, match="Incoming audio file is empty"):
        audio_store.register(job_id, lecture_id, "mp3")


def test_save_transcript_updates_manifest(audio_store: LocalVolumeAudioStore):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming_file = audio_store.get_incoming_path(job_id, "wav")
    incoming_file.write_bytes(b"sample_audio_payload")

    audio_store.register(job_id, lecture_id, "wav")

    # Create sample Transcript
    transcript = TranscriptSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        generated=TranscriptGeneratedMeta(
            model="phowhisper-base",
            language="vi",
            device="cuda:0",
            processing_seconds=12.5
        ),
        audio=TranscriptAudioMeta(
            duration_seconds=180.0,
            sample_rate_hz=16000
        ),
        full_text="Xin chào các bạn học sinh, hôm nay chúng ta học môn Đại Số.",
        segments=[
            TranscriptSegment(
                id=0,
                start_time_seconds=0.0,
                end_time_seconds=5.2,
                timestamp_label="00:00",
                text="Xin chào các bạn học sinh,"
            ),
            TranscriptSegment(
                id=1,
                start_time_seconds=5.2,
                end_time_seconds=10.5,
                timestamp_label="00:05",
                text="hôm nay chúng ta học môn Đại Số."
            )
        ]
    )

    transcript_path = audio_store.save_transcript(job_id, transcript)
    assert transcript_path.exists()

    # Verify manifest was updated to COMPLETED
    updated_manifest = audio_store.resolve_manifest(job_id)
    assert updated_manifest is not None
    assert updated_manifest.stt.status == "COMPLETED"
    assert updated_manifest.stt.transcript_rel_path == f"transcripts/{job_id}/transcript.json"


def test_mark_failed(audio_store: LocalVolumeAudioStore):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    incoming_file = audio_store.get_incoming_path(job_id, "m4a")
    incoming_file.write_bytes(b"some_audio_bytes")

    audio_store.register(job_id, lecture_id, "m4a")
    audio_store.mark_failed(job_id, "CUDA Out Of Memory encountered")

    failed_manifest = audio_store.resolve_manifest(job_id)
    assert failed_manifest is not None
    assert failed_manifest.stt.status == "FAILED"
    assert failed_manifest.stt.last_error == "CUDA Out Of Memory encountered"
