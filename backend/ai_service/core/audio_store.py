"""
AudioStore Deep Module: Shared Volume Storage, Checksum, Manifest and Artifact Management.
"""
import hashlib
import json
import logging
import os
from pathlib import Path
import tempfile
from typing import Protocol
from uuid import UUID

from ai_service.core.schemas import (
    ManifestSchema,
    OriginalAudioMeta,
    SttMeta,
    TranscriptSchema,
)

logger = logging.getLogger("ai_service.audio_store")


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

        # Ensure root subdirectories exist
        self.incoming_dir.mkdir(parents=True, exist_ok=True)
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.transcripts_dir.mkdir(parents=True, exist_ok=True)

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
        manifest_path = self._get_manifest_path(job_id)
        if not manifest_path.exists():
            return None
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return ManifestSchema.model_validate(data)

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

    def mark_failed(self, job_id: UUID, error_message: str) -> None:
        manifest = self.resolve_manifest(job_id)
        if manifest:
            manifest.stt.status = "FAILED"
            manifest.stt.last_error = error_message
            self.update_manifest(job_id, manifest)
            logger.warning("Marked job %s as FAILED: %s", job_id, error_message)
