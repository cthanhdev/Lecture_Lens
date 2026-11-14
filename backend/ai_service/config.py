"""
Configuration module for LectureLens AI Service using pydantic-settings.
"""
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central application settings loaded from environment variables or .env file.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Storage paths
    STORAGE_ROOT: Path = Field(
        default=Path("./volumes/rag_data"),
        description="Path to shared volume root directory"
    )

    # Security
    INTERNAL_API_SECRET_KEY: str = Field(
        default="lecture_lens_internal_secret_token_xyz987",
        description="Shared internal token for service-to-service authentication"
    )

    # Spring Boot Integration
    SPRING_BASE_URL: str = Field(
        default="http://spring:8080",
        description="Base URL of Spring Boot Gateway"
    )

    # AI Runtime Hardware & Model Weights
    DEVICE: str = Field(
        default="cuda",
        description="Inference device: cuda or cpu"
    )
    MODEL_PATH_PHOWHISPER: Path = Field(
        default=Path("./backend/models/phowhisper-medium"),
        description="Local directory containing PhoWhisper model weights (medium or base)"
    )
    MODEL_PATH_BGE_M3: Path = Field(
        default=Path("./backend/models/bge-m3"),
        description="Local directory containing BGE-M3 embedding model weights"
    )

    # Chunking & VRAM Management (Stage 2)
    CHUNK_MAX_TOKENS: int = Field(
        default=512,
        description="Maximum BGE-M3 sequence tokens per chunk"
    )
    CHUNK_OVERLAP_TOKENS: int = Field(
        default=64,
        description="Token overlap retained across adjacent chunk boundaries"
    )
    LOW_VRAM_MODE: bool = Field(
        default=True,
        description="Sequentially unload PhoWhisper before loading BGE-M3 to stay under 4GB VRAM"
    )

    # PostgreSQL + pgvector RAG Store
    POSTGRES_HOST: str = Field(
        default="localhost",
        description="PostgreSQL host for pgvector RAG chunk store"
    )
    POSTGRES_PORT: int = Field(
        default=5432,
        description="PostgreSQL port"
    )
    POSTGRES_DB: str = Field(
        default="lecturelens_db",
        description="PostgreSQL database name"
    )
    POSTGRES_USER: str = Field(
        default="ll_admin",
        description="PostgreSQL user"
    )
    POSTGRES_PASSWORD: str = Field(
        default="ll_secure_password_2026",
        description="PostgreSQL password"
    )
    ENABLE_PGVECTOR_SYNC: bool = Field(
        default=True,
        description="Sync chunks to PostgreSQL pgvector when reachable"
    )

    # Audio Ingest constraints
    WHISPER_CHUNK_SECONDS: int = Field(
        default=30,
        description="Length in seconds for audio processing window"
    )
    WHISPER_STRIDE_SECONDS: int = Field(
        default=1,
        description="Overlap stride in seconds between adjacent windows"
    )
    MAX_AUDIO_DURATION_HOURS: float = Field(
        default=4.0,
        description="Maximum allowed audio duration in hours"
    )


# Singleton factory for dependency injection
_settings_instance: Settings | None = None


def get_settings() -> Settings:
    global _settings_instance
    if _settings_instance is None:
        _settings_instance = Settings()
    return _settings_instance
