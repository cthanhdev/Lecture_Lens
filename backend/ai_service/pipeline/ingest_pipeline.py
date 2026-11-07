"""
Ingest Pipeline Coordinator Deep Module.
Orchestrates AudioStore, Preprocessor, AsrEngine, and JobReporter.
Guarded by a global asyncio.Semaphore(1) to strictly prevent GPU CUDA OOM.
"""
import asyncio
import logging
import time
from uuid import UUID

from ai_service.core.asr import AsrEngineProtocol
from ai_service.core.audio_store import AudioStoreProtocol
from ai_service.core.preprocessing import AudioPreprocessorProtocol
from ai_service.core.job_reporter import JobReporterProtocol
from ai_service.core.schemas import (
    NormalizedAudioMeta,
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
)

logger = logging.getLogger("ai_service.pipeline")

# Global GPU concurrency lock: strictly 1 transcription at a time per AI worker
GLOBAL_GPU_SEMAPHORE = asyncio.Semaphore(1)


class IngestPipelineCoordinator:
    """
    Coordinates the full Stage 1 pipeline:
    Verify -> Register -> Normalize -> Acquire GPU -> Transcribe -> Save Artifact -> Report.
    """

    def __init__(
        self,
        audio_store: AudioStoreProtocol,
        preprocessor: AudioPreprocessorProtocol,
        asr_engine: AsrEngineProtocol,
        job_reporter: JobReporterProtocol,
        gpu_semaphore: asyncio.Semaphore | None = None
    ):
        self.audio_store = audio_store
        self.preprocessor = preprocessor
        self.asr_engine = asr_engine
        self.job_reporter = job_reporter
        self.gpu_semaphore = gpu_semaphore or GLOBAL_GPU_SEMAPHORE

    async def run(self, job_id: UUID, lecture_id: UUID, file_extension: str) -> None:
        start_time = time.time()
        logger.info("Starting Audio Ingest Pipeline for job %s (lecture %s)...", job_id, lecture_id)

        try:
            # 1. Report Initial Progress
            await self.job_reporter.report(job_id, "PROCESSING_STT", 5)

            # 2. Register with AudioStore & Generate Manifest
            manifest = self.audio_store.register(job_id, lecture_id, file_extension)
            incoming_path = self.audio_store.get_incoming_path(job_id, file_extension)
            normalized_path = self.audio_store.get_normalized_path(job_id)

            # 3. Audio Normalization (16kHz Mono PCM)
            await self.job_reporter.report(job_id, "PROCESSING_STT", 15)
            logger.info("Normalizing incoming audio for job %s...", job_id)
            audio_meta = self.preprocessor.process(incoming_path, normalized_path)

            # Update manifest with normalized audio metadata
            manifest.normalized = NormalizedAudioMeta(
                rel_path=str(normalized_path.name),
                sample_rate_hz=audio_meta.sample_rate_hz,
                channels=audio_meta.channels,
                bits_per_sample=audio_meta.bits_per_sample,
                duration_seconds=audio_meta.duration_seconds
            )
            manifest.stt.status = "PROCESSING"
            self.audio_store.update_manifest(job_id, manifest)

            # 4. Speech-to-Text inference guarded by GPU Semaphore
            await self.job_reporter.report(job_id, "PROCESSING_STT", 25)
            logger.info("Acquiring GPU lock for job %s...", job_id)

            loop = asyncio.get_running_loop()

            def progress_callback(asr_pct: int):
                # Scale ASR percentage (0-100) to overall job percentage (25-85)
                scaled_pct = int(25 + (asr_pct * 0.60))
                # Schedule reporting in event loop safely from callback
                asyncio.run_coroutine_threadsafe(
                    self.job_reporter.report(job_id, "PROCESSING_STT", scaled_pct),
                    loop
                )

            async with self.gpu_semaphore:
                logger.info("GPU lock acquired for job %s. Transcribing audio...", job_id)
                # Run synchronous / CPU-bound / GPU-bound ASR in executor thread
                segments = await loop.run_in_executor(
                    None,
                    lambda: self.asr_engine.transcribe(normalized_path, on_progress=progress_callback)
                )

            # 5. Build and persist Transcript Artifact
            await self.job_reporter.report(job_id, "PROCESSING_STT", 90)
            full_text = " ".join(seg.text for seg in segments)
            processing_duration = round(time.time() - start_time, 2)

            transcript = TranscriptSchema(
                job_id=job_id,
                lecture_id=lecture_id,
                generated=TranscriptGeneratedMeta(
                    model="phowhisper-base",
                    language="vi",
                    device="cuda" if hasattr(self.asr_engine, "device") and self.asr_engine.device == "cuda" else "cpu",
                    processing_seconds=processing_duration
                ),
                audio=TranscriptAudioMeta(
                    duration_seconds=audio_meta.duration_seconds,
                    sample_rate_hz=audio_meta.sample_rate_hz
                ),
                full_text=full_text,
                segments=segments
            )

            self.audio_store.save_transcript(job_id, transcript)

            # 6. Report Completion to Spring Boot Gateway
            await self.job_reporter.report(job_id, "STT_COMPLETED", 100)
            logger.info(
                "Audio Ingest Pipeline for job %s COMPLETED in %.2fs. Persisted %d segments.",
                job_id, processing_duration, len(segments)
            )

        except Exception as exc:
            err_msg = str(exc)
            logger.error("Audio Ingest Pipeline for job %s FAILED: %s", job_id, err_msg, exc_info=True)
            self.audio_store.mark_failed(job_id, err_msg)
            await self.job_reporter.report(job_id, "FAILED", 0, err_msg)
