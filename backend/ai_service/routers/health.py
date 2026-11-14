"""
Health check and telemetry endpoint for LectureLens AI Service.
"""
from fastapi import APIRouter, Depends

from ai_service.config import get_settings
from ai_service.core.chunk_store import ChunkStoreProtocol
from ai_service.dependencies import get_chunk_store
from ai_service.security import verify_internal_secret

router = APIRouter(prefix="/internal/v1/ai", tags=["Health"])


@router.get("/health", dependencies=[Depends(verify_internal_secret)])
async def get_health(chunk_store: ChunkStoreProtocol = Depends(get_chunk_store)):
    """
    Returns system, model weight availability, pgvector DB connectivity,
    and GPU telemetry for the AI Service. Protected by X-Internal-Secret.
    """
    settings = get_settings()

    cuda_available = False
    vram_stats = {}
    try:
        import torch

        cuda_available = torch.cuda.is_available()
        if cuda_available:
            vram_stats = {
                "device_name": torch.cuda.get_device_name(0),
                "allocated_mb": round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2),
                "reserved_mb": round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2),
            }
    except ImportError:
        pass

    return {
        "status": "HEALTHY",
        "service": "lecturelens-ai-service",
        "configured_device": settings.DEVICE,
        "low_vram_mode": settings.LOW_VRAM_MODE,
        "cuda_available": cuda_available,
        "vram": vram_stats,
        "pgvector_connected": chunk_store.is_postgres_connected(),
        "models": {
            "phowhisper_path_exists": settings.MODEL_PATH_PHOWHISPER.exists(),
            "bge_m3_path_exists": settings.MODEL_PATH_BGE_M3.exists(),
        },
    }
