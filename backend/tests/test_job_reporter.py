"""
Tests for JobReporter Deep Module.
Verifies payload serialization, retry behavior with backoff, and fault-tolerance against network outages.
"""
import uuid
import httpx
import pytest
from ai_service.core.job_reporter import RecordingJobReporter, SpringJobReporter


@pytest.mark.asyncio
async def test_recording_job_reporter():
    job_id = uuid.uuid4()
    reporter = RecordingJobReporter()

    ok1 = await reporter.report(job_id, "PROCESSING_STT", 15)
    ok2 = await reporter.report(job_id, "STT_COMPLETED", 100)

    assert ok1 is True
    assert ok2 is True
    assert len(reporter.records) == 2
    assert reporter.records[0]["status"] == "PROCESSING_STT"
    assert reporter.records[0]["progress"] == 15
    assert reporter.records[1]["status"] == "STT_COMPLETED"
    assert reporter.records[1]["progress"] == 100


@pytest.mark.asyncio
async def test_spring_job_reporter_success(monkeypatch):
    job_id = uuid.uuid4()

    def mock_put_handler(request: httpx.Request):
        assert request.headers["X-Internal-Secret"] == "test_secret_123"
        return httpx.Response(200, json={"status": "UPDATED"})

    transport = httpx.MockTransport(mock_put_handler)

    # Monkeypatch httpx.AsyncClient to use mock transport
    original_client = httpx.AsyncClient

    def custom_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", custom_client)

    reporter = SpringJobReporter(
        spring_base_url="http://mock-spring:8080",
        internal_secret="test_secret_123",
        max_retries=2,
        initial_backoff_sec=0.01
    )

    success = await reporter.report(job_id, "PROCESSING_STT", 50)
    assert success is True


@pytest.mark.asyncio
async def test_spring_job_reporter_retries_and_does_not_crash_on_500(monkeypatch):
    job_id = uuid.uuid4()
    attempts = []

    def mock_failure_handler(request: httpx.Request):
        attempts.append(1)
        return httpx.Response(500, text="Internal Server Error on Spring")

    transport = httpx.MockTransport(mock_failure_handler)

    original_client = httpx.AsyncClient

    def custom_client(*args, **kwargs):
        kwargs["transport"] = transport
        return original_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", custom_client)

    reporter = SpringJobReporter(
        spring_base_url="http://mock-spring:8080",
        internal_secret="test_secret_123",
        max_retries=3,
        initial_backoff_sec=0.01
    )

    # Should attempt 3 times, fail gracefully, return False without raising exception
    success = await reporter.report(job_id, "FAILED", 0, "Test error message")
    assert success is False
    assert len(attempts) == 3
