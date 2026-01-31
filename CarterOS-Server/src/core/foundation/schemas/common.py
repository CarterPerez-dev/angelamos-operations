"""
ⒸAngelaMos | 2026
common.py
"""

from config import HealthStatus
from core.foundation.schemas.base import BaseSchema


class HealthResponse(BaseSchema):
    """
    Health check response
    """
    status: HealthStatus
    environment: str
    version: str


class HealthDetailedResponse(HealthResponse):
    """
    Detailed health check with component status
    """
    database: HealthStatus
    redis: HealthStatus | None = None


class AppInfoResponse(BaseSchema):
    """
    Root endpoint response with API information
    """
    name: str
    version: str
    environment: str
    docs_url: str | None
