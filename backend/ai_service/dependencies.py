"""
Dependency Injection wiring for LectureLens AI Service components.
"""
from functools import lru_cache
from ai_service.config import get_settings
from ai_service.core.asr import AsrEngineProtocol, PhoWhisperEngine
from ai_service.core.audio_store import AudioStoreProtocol, LocalVolumeAudioStore
from ai_service.core.job_reporter import JobReporterProtocol, SpringJobReporter
from ai_service.core.preprocessing import AudioPreprocessorProtocol, FFmpegAudioPreprocessor
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator


@lru_cache
def get_audio_store() -> AudioStoreProtocol:
    settings = get_settings()
    return LocalVolumeAudioStore(storage_root=settings.STORAGE_ROOT)


@lru_cache
def get_audio_preprocessor() -> AudioPreprocessorProtocol:
    return FFmpegAudioPreprocessor()


@lru_cache
def get_asr_engine() -> AsrEngineProtocol:
    settings = get_settings()
    return PhoWhisperEngine(
        model_path=settings.MODEL_PATH_PHOWHISPER,
        device=settings.DEVICE
    )


@lru_cache
def get_job_reporter() -> JobReporterProtocol:
    settings = get_settings()
    return SpringJobReporter(
        spring_base_url=settings.SPRING_BASE_URL,
        internal_secret=settings.INTERNAL_API_SECRET_KEY
    )


def get_pipeline_coordinator() -> IngestPipelineCoordinator:
    return IngestPipelineCoordinator(
        audio_store=get_audio_store(),
        preprocessor=get_audio_preprocessor(),
        asr_engine=get_asr_engine(),
        job_reporter=get_job_reporter()
    )
