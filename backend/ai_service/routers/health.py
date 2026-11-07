"""
Health check and telemetry endpoint for LectureLens AI Service.
"""
from fastapi import APIRouter, Depends
from ai_service.security import verify_internal_secret
from ai_service.config import get_settings

router = APIRouter(prefix="/internal/v1/ai", tags=["Health"])


@router.get("/health", dependencies=[Depends(verify_internal_secret)])
async def get_health():
    """
    Returns system and GPU telemetry for the AI Service.
    Protected by X-Internal-Secret.
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
        "cuda_available": cuda_available,
        "vram": vram_stats,
        "models": {
            "phowhisper_path_exists": settings.MODEL_PATH_PHOWHISPER.exists()
        }
    }
