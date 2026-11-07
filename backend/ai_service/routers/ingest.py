"""
Ingest Router for LectureLens AI Service.
Exposes endpoints to trigger audio ingestion and inspect manifests.
"""
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from ai_service.core.audio_store import AudioStoreProtocol
from ai_service.core.schemas import IngestRequest, IngestResponse, ManifestSchema
from ai_service.dependencies import get_audio_store, get_pipeline_coordinator
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator
from ai_service.security import verify_internal_secret

router = APIRouter(
    prefix="/internal/v1/ai",
    tags=["Ingest Pipeline"],
    dependencies=[Depends(verify_internal_secret)]
)


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED
)
async def trigger_ingest(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
    audio_store: AudioStoreProtocol = Depends(get_audio_store),
    coordinator: IngestPipelineCoordinator = Depends(get_pipeline_coordinator)
):
    """
    Triggers asynchronous audio ingestion for a pre-staged audio file in the shared volume.
    Returns HTTP 202 immediately.
    """
    # Verify pre-staged file exists before spawning background worker
    incoming_path = audio_store.get_incoming_path(request.job_id, request.file_extension)
    if not incoming_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio file '{request.job_id}.{request.file_extension}' not found in incoming volume."
        )

    # Spawn background ingestion pipeline
    background_tasks.add_task(
        coordinator.run,
        request.job_id,
        request.lecture_id,
        request.file_extension
    )

    return IngestResponse(
        status="ACCEPTED",
        message="Ingest pipeline background task spawned successfully."
    )


@router.get(
    "/audio/{job_id}/manifest",
    response_model=ManifestSchema
)
async def get_audio_manifest(
    job_id: UUID,
    audio_store: AudioStoreProtocol = Depends(get_audio_store)
):
    """
    Retrieves the O(1) Manifest for a given job.
    """
    manifest = audio_store.resolve_manifest(job_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manifest for job '{job_id}' not found."
        )
    return manifest
