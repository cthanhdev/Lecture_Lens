"""
Online RAG & Multi-Pass Gemma 4 Router ([Q1]–[Q6+]) for LectureLens AI Service.
Exposes Cách 2 unified endpoint (`POST /internal/v1/ai/rag/query`) plus modular
endpoints (`/rag/retrieve`, `/llm/generate`, `/rag/presets`) protected by X-Internal-Secret.
"""
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

router = APIRouter(
    prefix="/internal/v1/ai",
    tags=["Online RAG & Gemma 4"],
    dependencies=[Depends(verify_internal_secret)],
)


@router.get("/rag/presets", response_model=RagPresetsResponse)
async def get_rag_presets(
    prompt_builder: GroundedPromptBuilder = Depends(get_prompt_builder),
):
    """Returns built-in Pass 1 ([Q5]) and Pass 2 ([Q6]) system prompt presets."""
    return RagPresetsResponse(**prompt_builder.get_presets())


@router.post("/rag/retrieve", response_model=RagRetrieveResponse)
async def retrieve_rag_context(
    request: RagRetrieveRequest,
    coordinator: RagPipelineCoordinator = Depends(get_rag_pipeline_coordinator),
):
    """Executes [Q1]–[Q4]: BGE-M3 Query -> 3-Stream RRF -> 3-Way Expand -> Cross-Encoder Rerank."""
    return await coordinator.retrieve_only(request)


@router.post("/llm/generate", response_model=LlmGenerateResponse)
async def generate_multi_pass_llm(
    request: LlmGenerateRequest,
    coordinator: RagPipelineCoordinator = Depends(get_rag_pipeline_coordinator),
):
    """Executes [Q5]–[Q6+]: Gemma 4 Pass 1 Draft -> Pass 2 Custom System Prompt Refiner -> [Q7+] Extra."""
    try:
        return await coordinator.run_stage_chain(request)
    except RuntimeError as exc:
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
    Unified Cách 2 Online RAG endpoint executing [Q1] Semantic Cache -> [Q2] RRF -> [Q3] Expand
    -> [Q4] Reranker -> [Q5] Gemma 4 Pass 1 Draft -> [Q6] Gemma 4 Pass 2 Custom Refiner -> [Q7+].
    """
    try:
        return await coordinator.run_query(request)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
