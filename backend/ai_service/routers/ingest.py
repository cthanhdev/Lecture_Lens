"""
Ingest & RAG Chunk/Search Router for LectureLens AI Service.
Exposes internal endpoints for audio ingestion, manifest inspection,
Stage 2 chunking & embedding, chunks retrieval, hybrid RRF search, and context expansion.
"""
import asyncio
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from ai_service.core.audio_store import AudioStoreProtocol
from ai_service.core.chunk_store import ChunkStoreProtocol
from ai_service.core.embedder import EmbedderProtocol
from ai_service.core.schemas import (
    ChunkAndEmbedRequest,
    ChunkAndEmbedResponse,
    ChunksArtifactSchema,
    ExpandedContextItem,
    ExpandedContextResponse,
    HybridSearchRequest,
    HybridSearchResponse,
    HybridSearchResultItem,
    IngestRequest,
    IngestResponse,
    ManifestSchema,
)
from ai_service.dependencies import (
    get_audio_store,
    get_chunk_store,
    get_embedder,
    get_pipeline_coordinator,
)
from ai_service.pipeline.ingest_pipeline import GLOBAL_GPU_SEMAPHORE, IngestPipelineCoordinator
from ai_service.security import verify_internal_secret

router = APIRouter(
    prefix="/internal/v1/ai",
    tags=["Ingest Pipeline"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_ingest(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
    audio_store: AudioStoreProtocol = Depends(get_audio_store),
    coordinator: IngestPipelineCoordinator = Depends(get_pipeline_coordinator),
):
    """
    Triggers asynchronous audio ingestion (Stage 1 + Stage 2) for a pre-staged
    audio file in the shared volume. Returns HTTP 202 immediately.
    """
    incoming_path = audio_store.get_incoming_path(request.job_id, request.file_extension)
    if not incoming_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audio file '{request.job_id}.{request.file_extension}' not found in incoming volume.",
        )

    background_tasks.add_task(
        coordinator.run,
        request.job_id,
        request.lecture_id,
        request.file_extension,
    )

    return IngestResponse(
        status="ACCEPTED",
        message="Ingest pipeline background task spawned successfully.",
    )


@router.post(
    "/chunk-and-embed",
    response_model=ChunkAndEmbedResponse,
)
async def trigger_chunk_and_embed(
    request: ChunkAndEmbedRequest,
    audio_store: AudioStoreProtocol = Depends(get_audio_store),
    coordinator: IngestPipelineCoordinator = Depends(get_pipeline_coordinator),
):
    """
    Executes Stage 2 ([I5] Recursive Chunking + [I6] BGE-M3 Dual Embedding + ChunkStore sync)
    synchronously from an existing transcript.json artifact.
    """
    try:
        artifact = await coordinator.run_stage2(
            job_id=request.job_id,
            lecture_id=request.lecture_id,
            sync_to_db=request.sync_to_db,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    manifest = audio_store.resolve_manifest(request.job_id)
    if manifest:
        db_synced = manifest.chunking.db_synced
    elif coordinator.chunk_store is not None and hasattr(coordinator.chunk_store, "is_lecture_synced"):
        db_synced = bool(coordinator.chunk_store.is_lecture_synced(artifact.lecture_id))
    else:
        db_synced = False
    chunks_rel_path = (
        (manifest.chunking.chunks_rel_path if manifest else None)
        or f"chunks/{request.job_id}/chunks.json"
    )

    return ChunkAndEmbedResponse(
        status="COMPLETED",
        job_id=artifact.job_id,
        lecture_id=artifact.lecture_id,
        chunk_count=artifact.total_chunks,
        db_synced=db_synced,
        chunks_rel_path=chunks_rel_path,
    )


@router.get(
    "/audio/{job_id}/manifest",
    response_model=ManifestSchema,
)
async def get_audio_manifest(
    job_id: UUID,
    audio_store: AudioStoreProtocol = Depends(get_audio_store),
):
    """Retrieves the O(1) Manifest for a given job."""
    manifest = audio_store.resolve_manifest(job_id)
    if not manifest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manifest for job '{job_id}' not found.",
        )
    return manifest


@router.get(
    "/chunks/context/{chunk_id}",
    response_model=ExpandedContextResponse,
)
async def get_chunk_expanded_context(
    chunk_id: UUID,
    chunk_store: ChunkStoreProtocol = Depends(get_chunk_store),
):
    """Retrieves PREVIOUS, CURRENT, and NEXT linked chunks for a target chunk_id."""
    context_rows = chunk_store.get_expanded_context(chunk_id)
    if not context_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chunk '{chunk_id}' not found.",
        )
    return ExpandedContextResponse(
        chunk_id=chunk_id,
        context=[ExpandedContextItem(**item) for item in context_rows],
    )


@router.get(
    "/chunks/{job_id}",
    response_model=ChunksArtifactSchema,
)
async def get_job_chunks(
    job_id: UUID,
    audio_store: AudioStoreProtocol = Depends(get_audio_store),
):
    """Retrieves the Stage 2 chunks/{job_id}/chunks.json artifact."""
    artifact = audio_store.load_chunks(job_id)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chunks artifact for job '{job_id}' not found.",
        )
    return artifact


@router.post(
    "/search/hybrid",
    response_model=HybridSearchResponse,
)
async def search_hybrid_rrf(
    request: HybridSearchRequest,
    embedder: EmbedderProtocol = Depends(get_embedder),
    chunk_store: ChunkStoreProtocol = Depends(get_chunk_store),
):
    """
    Embeds a Vietnamese query with BGE-M3 and executes 3-stream Hybrid RRF search
    (Dense halfvec + Unaccented Lexical + Fuzzy Trigram) with optional context expansion.
    """
    if not request.lecture_ids or not request.query.strip():
        return HybridSearchResponse(
            query=request.query,
            lecture_ids=request.lecture_ids,
            total_results=0,
            results=[],
        )

    loop = asyncio.get_running_loop()
    async with GLOBAL_GPU_SEMAPHORE:
        query_embedding = await loop.run_in_executor(
            None,
            lambda: embedder.encode_query(request.query),
        )

    raw_hits = chunk_store.search_hybrid_rrf(
        lecture_ids=request.lecture_ids,
        query_embedding=query_embedding.dense_halfvec,
        query_text=request.query,
        top_k=request.top_k,
    )

    items: list[HybridSearchResultItem] = []
    for hit in raw_hits:
        expanded = []
        if request.include_context:
            ctx_rows = chunk_store.get_expanded_context(hit["chunk_id"])
            expanded = [ExpandedContextItem(**row) for row in ctx_rows]
        items.append(HybridSearchResultItem(**hit, expanded_context=expanded))

    return HybridSearchResponse(
        query=request.query,
        lecture_ids=request.lecture_ids,
        total_results=len(items),
        results=items,
    )
