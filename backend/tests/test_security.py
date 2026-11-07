"""
Security and Health Check Tests for LectureLens AI Service.
Verifies constant-time X-Internal-Secret validation and unauthorized rejection.
"""
import pytest
from httpx import ASGITransport, AsyncClient
from ai_service.main import app
from ai_service.config import get_settings


@pytest.mark.asyncio
async def test_health_endpoint_missing_secret_returns_401():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/internal/v1/ai/health")
        assert response.status_code == 401
        assert "Invalid or missing internal API secret token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_health_endpoint_invalid_secret_returns_401():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/internal/v1/ai/health",
            headers={"X-Internal-Secret": "completely_wrong_secret"}
        )
        assert response.status_code == 401
        assert "Invalid or missing internal API secret token" in response.json()["detail"]


@pytest.mark.asyncio
async def test_health_endpoint_valid_secret_returns_200():
    settings = get_settings()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/internal/v1/ai/health",
            headers={"X-Internal-Secret": settings.INTERNAL_API_SECRET_KEY}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert data["service"] == "lecturelens-ai-service"
        assert "configured_device" in data
        assert "models" in data
