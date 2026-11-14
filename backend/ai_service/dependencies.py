"""
Dependency Injection wiring for LectureLens AI Service components.
"""
from functools import lru_cache

from ai_service.config import get_settings
from ai_service.core.asr import AsrEngineProtocol, PhoWhisperEngine
from ai_service.core.audio_store import AudioStoreProtocol, LocalVolumeAudioStore
from ai_service.core.chunk_store import (
    ChunkStoreProtocol,
    CompositeChunkStore,
    InMemoryChunkStore,
    PostgresPgVectorChunkStore,
)
from ai_service.core.embedder import BgeM3Embedder, EmbedderProtocol
from ai_service.core.job_reporter import JobReporterProtocol, SpringJobReporter
from ai_service.core.preprocessing import AudioPreprocessorProtocol, FFmpegAudioPreprocessor
from ai_service.core.text_chunker import (
    BgeM3TokenizerAdapter,
    RecursiveTokenChunker,
    TextChunkerProtocol,
    TokenizerProtocol,
)
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator


def _resolve_runtime_device(configured_device: str) -> str:
    return "cuda" if configured_device == "auto" else configured_device


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
        device=_resolve_runtime_device(settings.DEVICE),
    )


@lru_cache
def get_job_reporter() -> JobReporterProtocol:
    settings = get_settings()
    return SpringJobReporter(
        spring_base_url=settings.SPRING_BASE_URL,
        internal_secret=settings.INTERNAL_API_SECRET_KEY,
    )


@lru_cache
def get_tokenizer() -> TokenizerProtocol:
    settings = get_settings()
    return BgeM3TokenizerAdapter(model_path=settings.MODEL_PATH_BGE_M3)


@lru_cache
def get_text_chunker() -> TextChunkerProtocol:
    settings = get_settings()
    return RecursiveTokenChunker(
        tokenizer=get_tokenizer(),
        max_tokens=settings.CHUNK_MAX_TOKENS,
        overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
    )


@lru_cache
def get_embedder() -> EmbedderProtocol:
    settings = get_settings()
    return BgeM3Embedder(
        model_path=settings.MODEL_PATH_BGE_M3,
        device=_resolve_runtime_device(settings.DEVICE),
        max_length=settings.CHUNK_MAX_TOKENS,
    )


@lru_cache
def get_chunk_store() -> ChunkStoreProtocol:
    settings = get_settings()
    postgres_store = (
        PostgresPgVectorChunkStore(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
        )
        if settings.ENABLE_PGVECTOR_SYNC
        else None
    )
    return CompositeChunkStore(
        memory_store=InMemoryChunkStore(),
        postgres_store=postgres_store,
        enable_pgvector=settings.ENABLE_PGVECTOR_SYNC,
    )


def get_pipeline_coordinator() -> IngestPipelineCoordinator:
    settings = get_settings()
    return IngestPipelineCoordinator(
        audio_store=get_audio_store(),
        preprocessor=get_audio_preprocessor(),
        asr_engine=get_asr_engine(),
        job_reporter=get_job_reporter(),
        text_chunker=get_text_chunker(),
        embedder=get_embedder(),
        chunk_store=get_chunk_store(),
        low_vram_mode=settings.LOW_VRAM_MODE,
    )
