"""
Pydantic Schemas for Ingest Pipeline, Manifest and Transcript Artifacts.
"""
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class IngestRequest(BaseModel):
    """
    Request payload sent by Spring Boot Gateway to trigger ingestion.
    Only passes discrete identifiers and extension - no arbitrary file paths.
    """
    model_config = ConfigDict(populate_by_name=True)

    job_id: UUID = Field(..., alias="jobId", description="Job UUID v4 issued by Spring Boot")
    lecture_id: UUID = Field(..., alias="lectureId", description="Lecture UUID v4")
    file_extension: str = Field(
        ...,
        alias="fileExtension",
        pattern=r"^(mp3|wav|m4a|aac|flac)$",
        description="Audio extension without dot, must match whitelist"
    )


class IngestResponse(BaseModel):
    status: Literal["ACCEPTED", "REJECTED"] = "ACCEPTED"
    message: str = "Ingest pipeline background task spawned."


class OriginalAudioMeta(BaseModel):
    filename: str
    extension: str
    size_bytes: int
    sha256: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class NormalizedAudioMeta(BaseModel):
    rel_path: str
    sample_rate_hz: int = 16000
    channels: int = 1
    bits_per_sample: int = 16
    duration_seconds: float = 0.0


class SttMeta(BaseModel):
    status: Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED"] = "PENDING"
    model: str = "phowhisper-base"
    device: str = "cuda:0"
    attempts: int = 1
    last_error: str | None = None
    transcript_rel_path: str | None = None


class ManifestSchema(BaseModel):
    """
    Per-job manifest representing the O(1) truth source for a given jobId.
    """
    schema_version: int = 1
    job_id: UUID
    lecture_id: UUID
    original: OriginalAudioMeta
    normalized: NormalizedAudioMeta | None = None
    stt: SttMeta = Field(default_factory=SttMeta)


class TranscriptSegment(BaseModel):
    """
    Individual time-stamped spoken segment.
    """
    id: int
    start_time_seconds: float
    end_time_seconds: float
    timestamp_label: str  # e.g., "00:00", "01:45"
    text: str


class TranscriptGeneratedMeta(BaseModel):
    model: str = "phowhisper-base"
    language: str = "vi"
    device: str = "cuda:0"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    processing_seconds: float = 0.0


class TranscriptAudioMeta(BaseModel):
    duration_seconds: float
    sample_rate_hz: int = 16000


class TranscriptSchema(BaseModel):
    """
    Data contract for Phase 1 output artifact.
    Handshake contract with Phase 2 (BGE-M3 Chunking & Embedding).
    """
    schema_version: int = 1
    job_id: UUID
    lecture_id: UUID
    generated: TranscriptGeneratedMeta
    audio: TranscriptAudioMeta
    full_text: str
    segments: list[TranscriptSegment]
