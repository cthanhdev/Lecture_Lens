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


class ChunkingMeta(BaseModel):
    """Metadata tracking Stage 2 ([I5] Chunking & [I6] BGE-M3 Embedding) progress."""
    status: Literal["PENDING", "CHUNKING", "EMBEDDING", "COMPLETED", "FAILED"] = "PENDING"
    model: str = "bge-m3"
    chunk_count: int = 0
    chunks_rel_path: str | None = None
    db_synced: bool = False
    last_error: str | None = None


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
    chunking: ChunkingMeta = Field(default_factory=ChunkingMeta)


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


class LectureChunkSchema(BaseModel):
    """
    Embedded lecture chunk contract matching rag.lecture_chunks.
    """
    id: UUID
    lecture_id: UUID
    chunk_index: int
    start_time_seconds: float
    end_time_seconds: float
    start_timestamp_display: str
    end_timestamp_display: str
    speaker_label: str = "LECTURER"
    content: str
    token_count: int
    embedding_half: list[float]
    lexical_weights: dict[str, float] = Field(default_factory=dict)
    prev_chunk_id: UUID | None = None
    next_chunk_id: UUID | None = None
    metadata: dict = Field(default_factory=dict)


class ChunksArtifactSchema(BaseModel):
    """
    Data contract for Phase 2 output artifact (chunks/{job_id}/chunks.json).
    """
    schema_version: int = 1
    job_id: UUID
    lecture_id: UUID
    model: str = "bge-m3"
    max_tokens: int = 512
    overlap_tokens: int = 64
    total_chunks: int
    processing_seconds: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    chunks: list[LectureChunkSchema]


class ChunkAndEmbedRequest(BaseModel):
    """
    Request payload to trigger Stage 2 ([I5] Chunking + [I6] BGE-M3 Embedding)
    from an existing Stage 1 transcript.json artifact.
    """
    model_config = ConfigDict(populate_by_name=True)

    job_id: UUID = Field(..., alias="jobId")
    lecture_id: UUID | None = Field(default=None, alias="lectureId")
    sync_to_db: bool = Field(default=True, alias="syncToDb")


class ChunkAndEmbedResponse(BaseModel):
    """Response payload returned after Stage 2 chunking & embedding completes."""
    status: Literal["COMPLETED", "FAILED"] = "COMPLETED"
    job_id: UUID
    lecture_id: UUID
    chunk_count: int
    db_synced: bool
    chunks_rel_path: str


class HybridSearchRequest(BaseModel):
    """Request payload for 3-stream Vietnamese hybrid RRF search."""
    model_config = ConfigDict(populate_by_name=True)

    lecture_ids: list[UUID] = Field(..., alias="lectureIds")
    query: str
    top_k: int = Field(default=10, alias="topK", ge=1, le=50)
    include_context: bool = Field(default=True, alias="includeContext")


class ExpandedContextItem(BaseModel):
    """Single neighbor or center chunk returned by 3-way context expansion."""
    position: Literal["PREVIOUS", "CURRENT", "NEXT"]
    chunk_id: UUID
    start_timestamp_display: str
    end_timestamp_display: str
    speaker_label: str = "LECTURER"
    content: str


class HybridSearchResultItem(BaseModel):
    """Ranked candidate chunk from 3-stream RRF hybrid retrieval."""
    chunk_id: UUID
    lecture_id: UUID
    chunk_index: int
    start_time_seconds: float
    end_time_seconds: float
    start_timestamp_display: str
    end_timestamp_display: str
    speaker_label: str = "LECTURER"
    content: str
    prev_chunk_id: UUID | None = None
    next_chunk_id: UUID | None = None
    dense_score: float = 0.0
    lexical_rank: int | None = None
    fuzzy_rank: int | None = None
    rrf_total_score: float = 0.0
    lexical_weights: dict[str, float] = Field(default_factory=dict)
    expanded_context: list[ExpandedContextItem] = Field(default_factory=list)


class HybridSearchResponse(BaseModel):
    """Response payload for hybrid RRF search."""
    query: str
    lecture_ids: list[UUID]
    total_results: int
    results: list[HybridSearchResultItem]


class ExpandedContextResponse(BaseModel):
    """Response payload for GET /internal/v1/ai/chunks/context/{chunk_id}."""
    chunk_id: UUID
    context: list[ExpandedContextItem]
