"""
AudioStore Deep Module: Shared Volume Storage, Checksum, Manifest and Artifact Management.
"""
import hashlib
import json
import logging
import os
from pathlib import Path
import tempfile
from typing import Protocol, TypeVar
from uuid import UUID

from pydantic import BaseModel

from ai_service.core.schemas import (
    ChunksArtifactSchema,
    ManifestSchema,
    OriginalAudioMeta,
    SttMeta,
    TranscriptSchema,
)

logger = logging.getLogger("ai_service.audio_store")

_SchemaT = TypeVar("_SchemaT", bound=BaseModel)


class AudioStoreProtocol(Protocol):
    """
    Seam for Audio Storage operations.
    """
    def get_incoming_path(self, job_id: UUID, ext: str) -> Path: ...
    def get_normalized_path(self, job_id: UUID) -> Path: ...
    def register(self, job_id: UUID, lecture_id: UUID, ext: str) -> ManifestSchema: ...
    def resolve_manifest(self, job_id: UUID) -> ManifestSchema | None: ...
    def update_manifest(self, job_id: UUID, manifest: ManifestSchema) -> None: ...
    def save_transcript(self, job_id: UUID, transcript: TranscriptSchema) -> Path: ...
    def load_transcript(self, job_id: UUID) -> TranscriptSchema | None: ...
    def save_chunks(self, job_id: UUID, artifact: ChunksArtifactSchema, db_synced: bool = False) -> Path: ...
    def load_chunks(self, job_id: UUID) -> ChunksArtifactSchema | None: ...
    def mark_failed(self, job_id: UUID, error_message: str) -> None: ...


class LocalVolumeAudioStore:
    """
    Concrete implementation of AudioStoreProtocol bound to a shared filesystem volume.
    Guarantees atomic file operations on the same mount-point to prevent Linux EXDEV errors.
    """

    def __init__(self, storage_root: Path):
        self.storage_root = Path(storage_root).resolve()
        self.incoming_dir = self.storage_root / "ingest" / "incoming"
        self.audio_dir = self.storage_root / "audio"
        self.transcripts_dir = self.storage_root / "transcripts"
        self.chunks_dir = self.storage_root / "chunks"

        # Ensure root subdirectories exist
        self.incoming_dir.mkdir(parents=True, exist_ok=True)
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.transcripts_dir.mkdir(parents=True, exist_ok=True)
        self.chunks_dir.mkdir(parents=True, exist_ok=True)

    def get_incoming_path(self, job_id: UUID, ext: str) -> Path:
        clean_ext = ext.lstrip(".")
        target_path = (self.incoming_dir / f"{job_id}.{clean_ext}").resolve()
        self._assert_within_storage_root(target_path)
        return target_path

    def get_normalized_path(self, job_id: UUID) -> Path:
        target_dir = self.audio_dir / str(job_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        return (target_dir / "normalized.wav").resolve()

    def _get_manifest_path(self, job_id: UUID) -> Path:
        target_dir = self.audio_dir / str(job_id)
        return target_dir / "manifest.json"

    def _get_transcript_path(self, job_id: UUID) -> Path:
        target_dir = self.transcripts_dir / str(job_id)
        return target_dir / "transcript.json"

    def _get_chunks_path(self, job_id: UUID) -> Path:
        target_dir = self.chunks_dir / str(job_id)
        return target_dir / "chunks.json"

    def _load_json_artifact(self, path: Path, schema_cls: type[_SchemaT]) -> _SchemaT | None:
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return schema_cls.model_validate(data)

    def _assert_within_storage_root(self, path: Path) -> None:
        try:
            path.resolve().relative_to(self.storage_root)
        except ValueError:
            raise PermissionError(f"Path traversal detected: {path} is outside {self.storage_root}")

    def _compute_sha256(self, file_path: Path) -> str:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _atomic_write_json(self, target_path: Path, payload: dict) -> None:
        """
        Atomically writes a JSON dictionary to target_path.
        Crucial: The temp file is created in target_path.parent to guarantee
        it stays on the same filesystem mount point, avoiding Linux EXDEV errors.
        """
        parent_dir = target_path.parent
        parent_dir.mkdir(parents=True, exist_ok=True)

        temp_fd, temp_path_str = tempfile.mkstemp(
            prefix=f"{target_path.stem}_",
            suffix=".tmp",
            dir=parent_dir
        )
        temp_path = Path(temp_path_str)

        try:
            with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())

            os.replace(temp_path, target_path)
        except Exception as e:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except OSError:
                    pass
            raise e

    def register(self, job_id: UUID, lecture_id: UUID, ext: str) -> ManifestSchema:
        """
        Registers an incoming audio file into the per-job manifest.
        Validates file existence, non-zero size, and computes SHA-256 hash.
        """
        incoming_file = self.get_incoming_path(job_id, ext)
        if not incoming_file.exists():
            raise FileNotFoundError(
                f"Incoming audio file not found on volume: {incoming_file}"
            )

        file_size = incoming_file.stat().st_size
        if file_size == 0:
            raise ValueError(
                f"Incoming audio file is empty (0 bytes): {incoming_file}"
            )

        manifest_path = self._get_manifest_path(job_id)
        if manifest_path.exists():
            # Idempotency: return existing manifest if already registered/completed
            existing = self.resolve_manifest(job_id)
            if existing and existing.stt.status == "COMPLETED":
                logger.info("Job %s manifest already COMPLETED. Re-using manifest.", job_id)
                return existing

        sha256 = self._compute_sha256(incoming_file)
        manifest = ManifestSchema(
            job_id=job_id,
            lecture_id=lecture_id,
            original=OriginalAudioMeta(
                filename=incoming_file.name,
                extension=ext.lstrip("."),
                size_bytes=file_size,
                sha256=sha256
            ),
            stt=SttMeta(status="PENDING")
        )

        self._atomic_write_json(manifest_path, manifest.model_dump(mode="json"))
        logger.info("Successfully registered job %s in AudioStore (SHA-256: %s)", job_id, sha256[:12])
        return manifest

    def resolve_manifest(self, job_id: UUID) -> ManifestSchema | None:
        """
        Deterministic O(1) manifest retrieval by jobId.
        """
        return self._load_json_artifact(self._get_manifest_path(job_id), ManifestSchema)

    def update_manifest(self, job_id: UUID, manifest: ManifestSchema) -> None:
        manifest_path = self._get_manifest_path(job_id)
        self._atomic_write_json(manifest_path, manifest.model_dump(mode="json"))

    def save_transcript(self, job_id: UUID, transcript: TranscriptSchema) -> Path:
        """
        Persists the final transcript.json artifact using atomic replace.
        Updates manifest stt status to COMPLETED.
        """
        transcript_path = self._get_transcript_path(job_id)
        self._atomic_write_json(transcript_path, transcript.model_dump(mode="json"))

        # Update manifest record
        manifest = self.resolve_manifest(job_id)
        if manifest:
            rel_path = str(transcript_path.relative_to(self.storage_root)).replace("\\", "/")
            manifest.stt.status = "COMPLETED"
            manifest.stt.transcript_rel_path = rel_path
            self.update_manifest(job_id, manifest)

        logger.info("Persisted transcript.json for job %s at %s", job_id, transcript_path)
        return transcript_path

    def load_transcript(self, job_id: UUID) -> TranscriptSchema | None:
        """
        Loads the persisted transcript.json artifact for Stage 2 chunking & embedding.
        """
        return self._load_json_artifact(self._get_transcript_path(job_id), TranscriptSchema)

    def save_chunks(self, job_id: UUID, artifact: ChunksArtifactSchema, db_synced: bool = False) -> Path:
        """
        Atomically persists chunks/{job_id}/chunks.json and updates manifest.chunking metadata.
        """
        chunks_path = self._get_chunks_path(job_id)
        self._atomic_write_json(chunks_path, artifact.model_dump(mode="json"))

        manifest = self.resolve_manifest(job_id)
        if manifest:
            rel_path = str(chunks_path.relative_to(self.storage_root)).replace("\\", "/")
            manifest.chunking.status = "COMPLETED"
            manifest.chunking.model = artifact.model
            manifest.chunking.chunk_count = artifact.total_chunks
            manifest.chunking.chunks_rel_path = rel_path
            manifest.chunking.db_synced = db_synced
            manifest.chunking.last_error = None
            self.update_manifest(job_id, manifest)

        logger.info("Persisted chunks.json for job %s at %s (%d chunks)", job_id, chunks_path, artifact.total_chunks)
        return chunks_path

    def load_chunks(self, job_id: UUID) -> ChunksArtifactSchema | None:
        """
        Loads the persisted chunks/{job_id}/chunks.json artifact if available.
        """
        return self._load_json_artifact(self._get_chunks_path(job_id), ChunksArtifactSchema)

    def mark_failed(self, job_id: UUID, error_message: str) -> None:
        manifest = self.resolve_manifest(job_id)
        if manifest:
            if manifest.stt.status == "COMPLETED":
                manifest.chunking.status = "FAILED"
                manifest.chunking.last_error = error_message
            else:
                manifest.stt.status = "FAILED"
                manifest.stt.last_error = error_message
            self.update_manifest(job_id, manifest)
            logger.warning("Marked job %s as FAILED: %s", job_id, error_message)
