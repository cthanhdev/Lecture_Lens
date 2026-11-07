"""
Main FastAPI entry point for LectureLens AI & RAG Engine.
Operates exclusively within the internal isolated Docker network.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from ai_service.routers import health, ingest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup model pre-warm and graceful shutdown.
    """
    logger.info("Initializing LectureLens AI Service (Internal Mesh)...")
    yield
    logger.info("Shutting down LectureLens AI Service. Releasing resources...")


app = FastAPI(
    title="LectureLens AI Service",
    description="Internal On-Premise Speech-to-Text & 2-Stage Neural RAG Engine",
    version="1.0.0",
    docs_url="/internal/docs",
    openapi_url="/internal/openapi.json",
    lifespan=lifespan
)

# Register routers
app.include_router(health.router)
app.include_router(ingest.router)
