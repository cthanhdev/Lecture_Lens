"""
JobReporter Deep Module: Resilient asynchronous progress & status callback to Spring Boot Gateway.
"""
import asyncio
import logging
from typing import Protocol
from uuid import UUID
import httpx

logger = logging.getLogger("ai_service.job_reporter")


class JobReporterProtocol(Protocol):
    """
    Seam for reporting job state transitions to the ingress gateway.
    """
    async def report(
        self,
        job_id: UUID,
        status: str,
        progress: int,
        error_message: str | None = None
    ) -> bool: ...


class SpringJobReporter:
    """
    Production Adapter: Calls Spring Boot Gateway internal webhook via HTTP PUT.
    Equipped with exponential backoff retry and fault-isolation (never crashes caller).
    """

    def __init__(
        self,
        spring_base_url: str,
        internal_secret: str,
        max_retries: int = 3,
        initial_backoff_sec: float = 0.5
    ):
        self.spring_base_url = spring_base_url.rstrip("/")
        self.internal_secret = internal_secret
        self.max_retries = max_retries
        self.initial_backoff_sec = initial_backoff_sec

    async def report(
        self,
        job_id: UUID,
        status: str,
        progress: int,
        error_message: str | None = None
    ) -> bool:
        url = f"{self.spring_base_url}/internal/v1/jobs/{job_id}/status"
        headers = {
            "Content-Type": "application/json",
            "X-Internal-Secret": self.internal_secret
        }
        payload = {
            "status": status,
            "progressPercentage": max(0, min(100, progress)),
            "errorMessage": error_message
        }

        backoff = self.initial_backoff_sec
        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.put(url, headers=headers, json=payload)
                    if response.status_code in (200, 204):
                        logger.info("Successfully reported job %s status=%s progress=%d%% to Spring", job_id, status, progress)
                        return True
                    else:
                        logger.warning(
                            "Spring Boot responded with status %d (attempt %d/%d): %s",
                            response.status_code, attempt, self.max_retries, response.text
                        )
            except Exception as exc:
                logger.warning(
                    "Network error connecting to Spring Boot at %s (attempt %d/%d): %s",
                    url, attempt, self.max_retries, exc
                )

            if attempt < self.max_retries:
                await asyncio.sleep(backoff)
                backoff *= 2

        logger.error(
            "Failed to report job %s status to Spring Boot after %d attempts. Pipeline proceeding.",
            job_id, self.max_retries
        )
        return False


class RecordingJobReporter:
    """
    Test Adapter: In-memory recorder for verifying status update sequences.
    """

    def __init__(self, should_succeed: bool = True):
        self.records: list[dict] = []
        self.should_succeed = should_succeed

    async def report(
        self,
        job_id: UUID,
        status: str,
        progress: int,
        error_message: str | None = None
    ) -> bool:
        self.records.append({
            "job_id": job_id,
            "status": status,
            "progress": progress,
            "error_message": error_message
        })
        return self.should_succeed
