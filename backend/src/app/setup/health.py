"""
ⒸAngelaMos | 2025
health.py
"""

from fastapi import (
    APIRouter,
    status,
)
from sqlalchemy import text

from config import (
    settings,
    HealthStatus,
)
from aspects.auth.schemas.common import (
    HealthResponse,
    HealthDetailedResponse,
)
from core.infrastructure.database.session import sessionmanager
from core.infrastructure.cache.client import cachemanager


router = APIRouter(tags = ["health"])


@router.get(
    "/health",
    response_model = HealthResponse,
    status_code = status.HTTP_200_OK,
)
async def health_check() -> HealthResponse:
    """
    Basic health check
    """
    return HealthResponse(
        status = HealthStatus.HEALTHY,
        environment = settings.ENVIRONMENT.value,
        version = settings.APP_VERSION,
    )


@router.get(
    "/health/detailed",
    response_model = HealthDetailedResponse,
    status_code = status.HTTP_200_OK,
)
async def health_check_detailed() -> HealthDetailedResponse:
    """
    Detailed health check including database connectivity
    """
    db_status = HealthStatus.UNHEALTHY
    redis_status = None

    try:
        async with sessionmanager.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = HealthStatus.HEALTHY
    except Exception:
        db_status = HealthStatus.UNHEALTHY

    if cachemanager.is_available:
        try:
            if await cachemanager.ping():
                redis_status = HealthStatus.HEALTHY
            else:
                redis_status = HealthStatus.UNHEALTHY
        except Exception:
            redis_status = HealthStatus.UNHEALTHY

    overall = HealthStatus.HEALTHY if db_status == HealthStatus.HEALTHY else HealthStatus.DEGRADED

    return HealthDetailedResponse(
        status = overall,
        environment = settings.ENVIRONMENT.value,
        version = settings.APP_VERSION,
        database = db_status,
        redis = redis_status,
    )
