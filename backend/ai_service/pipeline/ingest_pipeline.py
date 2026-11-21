"""
Ingest Pipeline Coordinator Deep Module.
Orchestrates Stage 1 (AudioStore, Preprocessor, AsrEngine) and Stage 2
([I5] RecursiveTokenChunker, [I6] BgeM3Embedder, ChunkStore) with sequential
VRAM offloading and a global asyncio.Semaphore(1) to prevent CUDA OOM.
"""
import asyncio
from datetime import datetime, timezone
import logging
import time
from typing import Literal, Protocol, runtime_checkable
from uuid import UUID

from pydantic import BaseModel, Field

from ai_service.core.asr import AsrEngineProtocol
from ai_service.core.audio_store import AudioStoreProtocol
from ai_service.core.chunk_store import ChunkStoreProtocol, CompositeChunkStore
from ai_service.core.embedder import EmbedderProtocol, EmbeddingResult
from ai_service.core.job_reporter import JobReporterProtocol
from ai_service.core.preprocessing import AudioPreprocessorProtocol
from ai_service.core.schemas import (
    ChunksArtifactSchema,
    LectureChunkSchema,
    NormalizedAudioMeta,
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
)
from ai_service.core.text_chunker import ChunkDraft, TextChunkerProtocol

logger = logging.getLogger("ai_service.pipeline")

# Global GPU concurrency lock: strictly 1 GPU inference stage at a time per AI worker
GLOBAL_GPU_SEMAPHORE = asyncio.Semaphore(1)


class PipelineTraceEvent(BaseModel):
    """Structured telemetry event emitted at each pipeline stage seam."""

    step_id: str
    label: str
    stage: str
    status: Literal["running", "done", "skipped", "failed"]
    model_used: str | None = None
    adapter: str | None = None
    device: str | None = None
    dtype: str | None = None
    duration_ms: float | None = None
    in_summary: str | None = None
    out_summary: str | None = None
    notes: str | None = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@runtime_checkable
class PipelineObserverProtocol(Protocol):
    """Seam for observing pipeline step transitions, model invocations, and timings."""

    def emit(self, event: PipelineTraceEvent) -> None: ...


class IngestPipelineCoordinator:
    """
    Coordinates the full LectureLens ingestion lifecycle:
    Stage 1: Verify -> Register -> Normalize -> Acquire GPU -> Transcribe -> transcript.json (STT_COMPLETED @ 75%)
    Stage 2: Unload ASR -> Chunk [I5] (CHUNKING @ 85%) -> Embed [I6] (EMBEDDING @ 92%) -> chunks.json & PgVector (READY @ 100%)
    """

    def __init__(
        self,
        audio_store: AudioStoreProtocol,
        preprocessor: AudioPreprocessorProtocol,
        asr_engine: AsrEngineProtocol,
        job_reporter: JobReporterProtocol,
        gpu_semaphore: asyncio.Semaphore | None = None,
        text_chunker: TextChunkerProtocol | None = None,
        embedder: EmbedderProtocol | None = None,
        chunk_store: ChunkStoreProtocol | None = None,
        low_vram_mode: bool = True,
        observer: PipelineObserverProtocol | None = None,
    ):
        self.audio_store = audio_store
        self.preprocessor = preprocessor
        self.asr_engine = asr_engine
        self.job_reporter = job_reporter
        self.gpu_semaphore = gpu_semaphore or GLOBAL_GPU_SEMAPHORE
        self.text_chunker = text_chunker
        self.embedder = embedder
        self.chunk_store = chunk_store
        self.low_vram_mode = low_vram_mode
        self.observer = observer

    def _emit(
        self,
        step_id: str,
        label: str,
        stage: str,
        status: Literal["running", "done", "skipped", "failed"],
        *,
        model_used: str | None = None,
        adapter: str | None = None,
        device: str | None = None,
        dtype: str | None = None,
        duration_ms: float | None = None,
        in_summary: str | None = None,
        out_summary: str | None = None,
        notes: str | None = None,
    ) -> None:
        if self.observer is None:
            return
        self.observer.emit(
            PipelineTraceEvent(
                step_id=step_id,
                label=label,
                stage=stage,
                status=status,
                model_used=model_used,
                adapter=adapter,
                device=device,
                dtype=dtype,
                duration_ms=duration_ms,
                in_summary=in_summary,
                out_summary=out_summary,
                notes=notes,
            )
        )

    def _update_chunking_status(
        self,
        job_id: UUID,
        status_name: str,
    ) -> None:
        manifest = self.audio_store.resolve_manifest(job_id)
        if manifest is not None:
            manifest.chunking.status = status_name  # type: ignore[assignment]
            self.audio_store.update_manifest(job_id, manifest)

    def _save_chunks_to_store(
        self,
        lecture_id: UUID,
        chunks: list[LectureChunkSchema],
        sync_to_db: bool,
    ) -> bool:
        if self.chunk_store is None:
            return False
        if isinstance(self.chunk_store, CompositeChunkStore):
            self.chunk_store.save_lecture_chunks(lecture_id, chunks, sync_to_db=sync_to_db)
            return bool(self.chunk_store.last_db_synced)
        if not sync_to_db and self.chunk_store.is_postgres_connected():
            return False
        self.chunk_store.save_lecture_chunks(lecture_id, chunks)
        return bool(self.chunk_store.is_postgres_connected())

    @staticmethod
    def _build_lecture_chunks(
        drafts: list[ChunkDraft],
        embeddings: list[EmbeddingResult],
        lecture_id: UUID,
    ) -> list[LectureChunkSchema]:
        return [
            LectureChunkSchema(
                id=draft.id,
                lecture_id=lecture_id,
                chunk_index=draft.chunk_index,
                start_time_seconds=draft.start_time_seconds,
                end_time_seconds=draft.end_time_seconds,
                start_timestamp_display=draft.start_timestamp_display,
                end_timestamp_display=draft.end_timestamp_display,
                speaker_label=draft.speaker_label,
                content=draft.content,
                token_count=draft.token_count,
                embedding_half=emb.dense_halfvec,
                lexical_weights=emb.lexical_weights,
                prev_chunk_id=draft.prev_chunk_id,
                next_chunk_id=draft.next_chunk_id,
                metadata=draft.metadata,
            )
            for draft, emb in zip(drafts, embeddings)
        ]

    async def _execute_stage2(
        self,
        job_id: UUID,
        transcript: TranscriptSchema,
        lecture_id: UUID | None = None,
        sync_to_db: bool = True,
    ) -> ChunksArtifactSchema:
        if self.text_chunker is None or self.embedder is None:
            raise RuntimeError("Stage 2 requires both text_chunker and embedder to be configured.")

        stage_start = time.time()
        target_lecture_id = lecture_id or transcript.lecture_id
        loop = asyncio.get_running_loop()
        asr_model_name = getattr(self.asr_engine, "model_name", "phowhisper-medium")
        embedder_model_name = getattr(self.embedder, "model_name", "bge-m3")
        embedder_adapter = type(self.embedder).__name__
        chunker_adapter = type(self.text_chunker).__name__
        store_adapter = type(self.chunk_store).__name__ if self.chunk_store is not None else "None"

        if self.low_vram_mode and hasattr(self.asr_engine, "unload"):
            t_offload = time.perf_counter()
            self.asr_engine.unload()
            self._emit(
                "vram_offload",
                "VRAM Offload",
                "Stage 1->2",
                "done",
                model_used=asr_model_name,
                adapter=type(self.asr_engine).__name__,
                duration_ms=round((time.perf_counter() - t_offload) * 1000, 2),
                notes="Unloaded ASR weights before loading BGE-M3 (LOW_VRAM_MODE=true)",
            )
        else:
            self._emit(
                "vram_offload",
                "VRAM Offload",
                "Stage 1->2",
                "skipped",
                model_used=asr_model_name,
                notes="Skipped (LOW_VRAM_MODE=false)",
            )

        # 1. [I5] Recursive Token Chunking
        self._update_chunking_status(job_id, "CHUNKING")
        await self.job_reporter.report(job_id, "CHUNKING", 85)
        self._emit(
            "chunking",
            "[I5] Recursive Chunking",
            "Stage 2",
            "running",
            adapter=chunker_adapter,
            in_summary=f"{len(transcript.segments)} segments",
        )
        t_chunk = time.perf_counter()
        logger.info("Running [I5] RecursiveTokenChunker for job %s...", job_id)
        drafts = await loop.run_in_executor(
            None,
            lambda: self.text_chunker.chunk_transcript(transcript),  # type: ignore[union-attr]
        )
        max_chunk_tok = max((d.token_count for d in drafts), default=0)
        self._emit(
            "chunking",
            "[I5] Recursive Chunking",
            "Stage 2",
            "done",
            adapter=chunker_adapter,
            duration_ms=round((time.perf_counter() - t_chunk) * 1000, 2),
            in_summary=f"{len(transcript.segments)} segments",
            out_summary=f"{len(drafts)} chunks (max {max_chunk_tok}/{getattr(self.text_chunker, 'max_tokens', 512)} tok)",
        )

        # 2. [I6] BGE-M3 Dual Embedding guarded by GPU Semaphore
        self._update_chunking_status(job_id, "EMBEDDING")
        await self.job_reporter.report(job_id, "EMBEDDING", 92)
        self._emit(
            "embedding",
            "[I6] Dual Embedding",
            "Stage 2",
            "running",
            model_used=embedder_model_name,
            adapter=embedder_adapter,
            device=getattr(self.embedder, "device", "cpu"),
            dtype=getattr(self.embedder, "dtype_label", None),
            in_summary=f"{len(drafts)} chunks",
        )
        t_embed = time.perf_counter()
        logger.info("Running [I6] BGE-M3 Embedder for job %s (%d chunks)...", job_id, len(drafts))

        if drafts:
            texts = [d.content for d in drafts]
            async with self.gpu_semaphore:
                embeddings = await loop.run_in_executor(
                    None,
                    lambda: self.embedder.encode_passages(texts),  # type: ignore[union-attr]
                )
        else:
            embeddings = []

        self._emit(
            "embedding",
            "[I6] Dual Embedding",
            "Stage 2",
            "done",
            model_used=embedder_model_name,
            adapter=embedder_adapter,
            device=getattr(self.embedder, "device", "cpu"),
            dtype=getattr(self.embedder, "dtype_label", None),
            duration_ms=round((time.perf_counter() - t_embed) * 1000, 2),
            in_summary=f"{len(drafts)} texts",
            out_summary=f"{len(embeddings)} x 1024-d halfvec + lexical",
        )

        lecture_chunks = self._build_lecture_chunks(drafts, embeddings, target_lecture_id)
        processing_seconds = round(time.time() - stage_start, 2)

        artifact = ChunksArtifactSchema(
            job_id=job_id,
            lecture_id=target_lecture_id,
            model=embedder_model_name,
            max_tokens=getattr(self.text_chunker, "max_tokens", 512),
            overlap_tokens=getattr(self.text_chunker, "overlap_tokens", 64),
            total_chunks=len(lecture_chunks),
            processing_seconds=processing_seconds,
            chunks=lecture_chunks,
        )

        # 3. Persist to ChunkStore (PgVector / InMemory) + chunks.json artifact
        self._emit(
            "store_sync",
            "Persist Chunks & Vector Index",
            "Stage 2",
            "running",
            adapter=store_adapter,
            in_summary=f"{len(lecture_chunks)} chunks",
        )
        t_store = time.perf_counter()
        db_synced = self._save_chunks_to_store(target_lecture_id, lecture_chunks, sync_to_db=sync_to_db)
        self.audio_store.save_chunks(job_id, artifact, db_synced=db_synced)
        backend_label = "pgvector" if db_synced else "in_memory"
        self._emit(
            "store_sync",
            "Persist Chunks & Vector Index",
            "Stage 2",
            "done",
            adapter=store_adapter,
            duration_ms=round((time.perf_counter() - t_store) * 1000, 2),
            in_summary=f"{len(lecture_chunks)} chunks",
            out_summary=f"chunks.json + {backend_label} ({len(lecture_chunks)} rows)",
        )

        await self.job_reporter.report(job_id, "READY", 100)
        logger.info(
            "Stage 2 for job %s READY in %.2fs (%d chunks, db_synced=%s).",
            job_id,
            processing_seconds,
            len(lecture_chunks),
            db_synced,
        )
        return artifact

    async def run_stage2(
        self,
        job_id: UUID,
        lecture_id: UUID | None = None,
        sync_to_db: bool = True,
    ) -> ChunksArtifactSchema:
        """
        Executes Stage 2 ([I5] Chunking + [I6] BGE-M3 Embedding + ChunkStore sync)
        independently from an existing transcript.json artifact.
        """
        transcript = self.audio_store.load_transcript(job_id)
        if transcript is None:
            raise FileNotFoundError(f"Transcript artifact not found for job '{job_id}'.")

        try:
            return await self._execute_stage2(
                job_id=job_id,
                transcript=transcript,
                lecture_id=lecture_id,
                sync_to_db=sync_to_db,
            )
        except Exception as exc:
            err_msg = str(exc)
            logger.error("Stage 2 pipeline for job %s FAILED: %s", job_id, err_msg, exc_info=True)
            self.audio_store.mark_failed(job_id, err_msg)
            await self.job_reporter.report(job_id, "FAILED", 0, err_msg)
            raise

    async def run(self, job_id: UUID, lecture_id: UUID, file_extension: str) -> None:
        start_time = time.time()
        logger.info("Starting Audio Ingest Pipeline for job %s (lecture %s)...", job_id, lecture_id)

        asr_model_name = getattr(self.asr_engine, "model_name", "phowhisper-medium")
        asr_device = getattr(self.asr_engine, "device", "cpu")
        asr_adapter = type(self.asr_engine).__name__
        store_adapter = type(self.audio_store).__name__
        prep_adapter = type(self.preprocessor).__name__

        try:
            # 1. Report Initial Progress
            await self.job_reporter.report(job_id, "PROCESSING_STT", 5)

            # 2. Register with AudioStore & Generate Manifest
            self._emit("register", "[I1] Audio Ingest", "Stage 1", "running", adapter=store_adapter)
            t_reg = time.perf_counter()
            manifest = self.audio_store.register(job_id, lecture_id, file_extension)
            incoming_path = self.audio_store.get_incoming_path(job_id, file_extension)
            normalized_path = self.audio_store.get_normalized_path(job_id)
            self._emit(
                "register",
                "[I1] Audio Ingest",
                "Stage 1",
                "done",
                adapter=store_adapter,
                duration_ms=round((time.perf_counter() - t_reg) * 1000, 2),
                in_summary=f"incoming/{job_id}.{file_extension}",
                out_summary=f"manifest.json ({manifest.original.size_bytes} B)",
            )

            # 3. Audio Normalization (16kHz Mono PCM)
            await self.job_reporter.report(job_id, "PROCESSING_STT", 15)
            self._emit(
                "normalize",
                "[I2] DSP Normalization",
                "Stage 1",
                "running",
                adapter=prep_adapter,
                in_summary=f"{file_extension.upper()} ({manifest.original.size_bytes} B)",
            )
            t_prep = time.perf_counter()
            logger.info("Normalizing incoming audio for job %s...", job_id)
            audio_meta = self.preprocessor.process(incoming_path, normalized_path)
            self._emit(
                "normalize",
                "[I2] DSP Normalization",
                "Stage 1",
                "done",
                adapter=prep_adapter,
                duration_ms=round((time.perf_counter() - t_prep) * 1000, 2),
                in_summary=f"{file_extension.upper()}",
                out_summary=f"16kHz Mono PCM ({audio_meta.duration_seconds:.1f}s)",
            )

            # Update manifest with normalized audio metadata and active ASR model
            manifest.normalized = NormalizedAudioMeta(
                rel_path=str(normalized_path.name),
                sample_rate_hz=audio_meta.sample_rate_hz,
                channels=audio_meta.channels,
                bits_per_sample=audio_meta.bits_per_sample,
                duration_seconds=audio_meta.duration_seconds,
            )
            manifest.stt.status = "PROCESSING"
            manifest.stt.model = asr_model_name
            manifest.stt.device = asr_device
            self.audio_store.update_manifest(job_id, manifest)

            # 4. Speech-to-Text inference guarded by GPU Semaphore
            await self.job_reporter.report(job_id, "PROCESSING_STT", 25)
            logger.info("Acquiring GPU lock for job %s...", job_id)

            loop = asyncio.get_running_loop()

            def progress_callback(asr_pct: int):
                # Scale ASR percentage (0-100) to Stage 1 range (25-70)
                scaled_pct = int(25 + (asr_pct * 0.45))
                asyncio.run_coroutine_threadsafe(
                    self.job_reporter.report(job_id, "PROCESSING_STT", scaled_pct),
                    loop,
                )

            self._emit(
                "asr",
                "[I4] Vietnamese ASR",
                "Stage 1",
                "running",
                model_used=asr_model_name,
                adapter=asr_adapter,
                device=asr_device,
                dtype=getattr(self.asr_engine, "dtype_label", None),
                in_summary=f"{audio_meta.duration_seconds:.1f}s WAV",
            )
            t_asr = time.perf_counter()
            async with self.gpu_semaphore:
                if (
                    self.low_vram_mode
                    and self.embedder is not None
                    and getattr(self.embedder, "_model", None) is not None
                ):
                    self.embedder.unload()

                logger.info("GPU lock acquired for job %s. Transcribing audio with %s...", job_id, asr_model_name)
                segments = await loop.run_in_executor(
                    None,
                    lambda: self.asr_engine.transcribe(normalized_path, on_progress=progress_callback),
                )

            actual_asr_device = getattr(self.asr_engine, "device", asr_device)
            self._emit(
                "asr",
                "[I4] Vietnamese ASR",
                "Stage 1",
                "done",
                model_used=asr_model_name,
                adapter=asr_adapter,
                device=actual_asr_device,
                dtype=getattr(self.asr_engine, "dtype_label", None),
                duration_ms=round((time.perf_counter() - t_asr) * 1000, 2),
                in_summary=f"{audio_meta.duration_seconds:.1f}s WAV",
                out_summary=f"{len(segments)} segments",
            )

            # 5. Build and persist Transcript Artifact
            await self.job_reporter.report(job_id, "PROCESSING_STT", 72)
            full_text = " ".join(seg.text for seg in segments)
            processing_duration = round(time.time() - start_time, 2)

            transcript = TranscriptSchema(
                job_id=job_id,
                lecture_id=lecture_id,
                generated=TranscriptGeneratedMeta(
                    model=asr_model_name,
                    language="vi",
                    device=actual_asr_device,
                    processing_seconds=processing_duration,
                ),
                audio=TranscriptAudioMeta(
                    duration_seconds=audio_meta.duration_seconds,
                    sample_rate_hz=audio_meta.sample_rate_hz,
                ),
                full_text=full_text,
                segments=segments,
            )

            self.audio_store.save_transcript(job_id, transcript)
            updated_manifest = self.audio_store.resolve_manifest(job_id)
            if updated_manifest is not None:
                updated_manifest.stt.model = asr_model_name
                updated_manifest.stt.device = actual_asr_device
                self.audio_store.update_manifest(job_id, updated_manifest)

            # 6. Hand off to Stage 2 if chunker & embedder are wired
            if self.text_chunker is not None and self.embedder is not None:
                await self.job_reporter.report(job_id, "STT_COMPLETED", 75)
                await self._execute_stage2(job_id, transcript, lecture_id=lecture_id, sync_to_db=True)
            else:
                await self.job_reporter.report(job_id, "STT_COMPLETED", 100)
                logger.info(
                    "Stage 1 Audio Ingest Pipeline for job %s COMPLETED in %.2fs. Persisted %d segments.",
                    job_id,
                    processing_duration,
                    len(segments),
                )

        except Exception as exc:
            err_msg = str(exc)
            logger.error("Audio Ingest Pipeline for job %s FAILED: %s", job_id, err_msg, exc_info=True)
            self.audio_store.mark_failed(job_id, err_msg)
            await self.job_reporter.report(job_id, "FAILED", 0, err_msg)
