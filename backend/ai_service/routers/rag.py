"""
Online RAG & 2-Pass Pre-RAG Gemma 4 Router ([Q1]–[Q6+], no Semantic Cache) for LectureLens AI Service.
Exposes unified endpoint (`POST /internal/v1/ai/rag/query`) plus modular
endpoints (`/rag/retrieve`, `/llm/generate`, `/rag/presets`) protected by X-Internal-Secret.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ai_service.core.prompt_builder import GroundedPromptBuilder
from ai_service.core.schemas import (
    LlmGenerateRequest,
    LlmGenerateResponse,
    RagPresetsResponse,
    RagQueryRequest,
    RagQueryResponse,
    RagRetrieveRequest,
    RagRetrieveResponse,
)
from ai_service.dependencies import get_prompt_builder, get_rag_pipeline_coordinator
from ai_service.pipeline.rag_pipeline import RagPipelineCoordinator
from ai_service.security import verify_internal_secret

logger = logging.getLogger("ai_service.rag_router")

router = APIRouter(
    prefix="/internal/v1/ai",
    tags=["Online RAG & Gemma 4"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.get("/rag/presets", response_model=RagPresetsResponse)
async def get_rag_presets(
    prompt_builder: GroundedPromptBuilder = Depends(get_prompt_builder),
):
    """Returns built-in Pass 1 ([Q1] query prep) and Pass 2 ([Q5] Gemma 4 + RAG) prompt presets."""
    return RagPresetsResponse(**prompt_builder.get_presets())


@router.post("/rag/retrieve", response_model=RagRetrieveResponse)
async def retrieve_rag_context(
    request: RagRetrieveRequest,
    coordinator: RagPipelineCoordinator = Depends(get_rag_pipeline_coordinator),
):
    """Executes [Q2]–[Q4]: BGE-M3 Query -> 3-Stream RRF -> 3-Way Expand -> Cross-Encoder Rerank."""
    return await coordinator.retrieve_only(request)


@router.post("/llm/generate", response_model=LlmGenerateResponse)
async def generate_multi_pass_llm(
    request: LlmGenerateRequest,
    coordinator: RagPipelineCoordinator = Depends(get_rag_pipeline_coordinator),
):
    """Executes [Q5]–[Q6+]: Gemma 4 + RAG -> [Q6+] Extra Custom System Prompt Stages."""
    try:
        return await coordinator.run_stage_chain(request)
    except RuntimeError as exc:
        logger.exception("Online RAG failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/rag/query", response_model=RagQueryResponse)
async def execute_rag_query(
    request: RagQueryRequest,
    coordinator: RagPipelineCoordinator = Depends(get_rag_pipeline_coordinator),
):
    """
    Unified 2-Pass Pre-RAG Online endpoint executing:
      [Q1] Gemma 4 Query Prep -> [Q2] BGE-M3 + RRF (with Query Drift Guard) -> [Q3] Expand
      -> [Q4] Reranker -> [Q5] Gemma 4 + RAG -> [Q6+] Extra Stages -> Audit Logs (no cache).
    """
    try:
        return await coordinator.run_query(request)
    except RuntimeError as exc:
        logger.exception("Online RAG failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
