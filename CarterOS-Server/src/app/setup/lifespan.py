"""
ⒸAngelaMos | 2025
lifespan.py
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from config import settings
from core.infrastructure.database.session import sessionmanager
from core.infrastructure.cache.client import cachemanager
from core.foundation.logging import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan handler for startup and shutdown
    """
    configure_logging()
    sessionmanager.init(str(settings.DATABASE_URL))
    cachemanager.init(
        str(settings.REDIS_URL) if settings.REDIS_URL else None
    )
    yield
    await sessionmanager.close()
    await cachemanager.close()
