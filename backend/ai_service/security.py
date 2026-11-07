"""
Security module for LectureLens AI Service.
Validates service-to-service internal secrets using timing-attack resistant comparison.
"""
import secrets
from fastapi import Header, HTTPException, status
from ai_service.config import get_settings


async def verify_internal_secret(
    x_internal_secret: str | None = Header(
        None,
        alias="X-Internal-Secret",
        description="Internal mesh shared secret token"
    )
) -> str:
    """
    Dependency that enforces constant-time validation of X-Internal-Secret.
    Raises HTTPException(401) on missing or mismatched secret.
    """
    settings = get_settings()
    expected_secret = settings.INTERNAL_API_SECRET_KEY

    # Uniformly reject missing or incorrect secret with 401
    if not x_internal_secret or not secrets.compare_digest(x_internal_secret, expected_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API secret token."
        )

    return x_internal_secret
