"""
ⒸAngelaMos | 2025
factory.py
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings, Environment, API_PREFIX
from core.infrastructure.database.session import sessionmanager
from core.infrastructure.cache.client import cachemanager
from core.foundation.exceptions import BaseAppException
from core.foundation.logging import configure_logging
from core.security.rate_limit.limiter import limiter
from app.setup.middleware import CorrelationIdMiddleware
from aspects.auth.schemas.common import AppInfoResponse
from aspects.auth.routes.admin import router as admin_router
from aspects.auth.routes.auth import router as auth_router
from aspects.auth.routes.user import router as user_router
from app.setup.health import router as health_router
from core.integrations.mcp import mcp
from aspects.content_studio.facets.video_creator.routes.tiktok import (
    router as tiktok_router,
)
from aspects.content_studio.facets.scheduler.routes import (
    router as scheduler_router,
)
from aspects.challenge.facets.tracker.routes import (
    router as challenge_router,
)
from aspects.life_manager.facets.planner.routes import (
    router as planner_router,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)


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


OPENAPI_TAGS = [
    {
        "name": "root",
        "description": "API information"
    },
    {
        "name": "health",
        "description": "Health check endpoints"
    },
    {
        "name": "auth",
        "description": "Authentication and authorization"
    },
    {
        "name": "users",
        "description": "User registration and profile management"
    },
    {
        "name": "admin",
        "description": "Admin only operations"
    },
    {
        "name": "Scheduler",
        "description": "Social media scheduling"
    },
    {
        "name": "Connected Accounts",
        "description": "Social account connections"
    },
    {
        "name": "Content Library",
        "description": "Content storage and management"
    },
    {
        "name": "Scheduled Posts",
        "description": "Post scheduling operations"
    },
    {
        "name": "Calendar",
        "description": "Calendar view and drag-drop"
    },
    {
        "name": "Analytics",
        "description": "Post and follower analytics"
    },
    {
        "name": "Challenge Tracker",
        "description": "1500/1000 challenge tracking"
    },
]


def create_app() -> FastAPI:
    """
    Application factory
    """
    is_production = settings.ENVIRONMENT == Environment.PRODUCTION

    app = FastAPI(
        title = settings.APP_NAME,
        summary = settings.APP_SUMMARY,
        description = settings.APP_DESCRIPTION,
        version = settings.APP_VERSION,
        contact = {
            "name": settings.APP_CONTACT_NAME,
            "email": settings.APP_CONTACT_EMAIL,
        },
        license_info = {
            "name": settings.APP_LICENSE_NAME,
            "url": settings.APP_LICENSE_URL,
        },
        openapi_tags = OPENAPI_TAGS,
        lifespan = lifespan,
        openapi_url = None if is_production else "/openapi.json",
        docs_url = None if is_production else "/docs",
        redoc_url = None if is_production else "/redoc",
        debug = False,
    )

    app.add_middleware(CorrelationIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins = settings.CORS_ORIGINS,
        allow_credentials = settings.CORS_ALLOW_CREDENTIALS,
        allow_methods = settings.CORS_ALLOW_METHODS,
        allow_headers = settings.CORS_ALLOW_HEADERS,
    )

    app.state.limiter = limiter
    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler
    )

    @app.exception_handler(BaseAppException)
    async def app_exception_handler(
        request: Request,
        exc: BaseAppException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code = exc.status_code,
            content = {
                "detail": exc.message,
                "type": exc.__class__.__name__,
            },
        )

    @app.get("/", response_model = AppInfoResponse, tags = ["root"])
    async def root() -> AppInfoResponse:
        return AppInfoResponse(
            name = settings.APP_NAME,
            version = settings.APP_VERSION,
            environment = settings.ENVIRONMENT.value,
            docs_url = None if is_production else "/docs",
        )

    app.include_router(health_router)
    app.include_router(admin_router, prefix = API_PREFIX)
    app.include_router(auth_router, prefix = API_PREFIX)
    app.include_router(user_router, prefix = API_PREFIX)
    app.include_router(
        tiktok_router,
        prefix = f"{API_PREFIX}/content-studio"
    )
    app.include_router(
        scheduler_router,
        prefix = f"{API_PREFIX}/content-studio"
    )
    app.include_router(
        challenge_router,
        prefix = API_PREFIX
    )
    app.include_router(
        planner_router,
        prefix = API_PREFIX
    )

    try:
        app.mount("/mcp", mcp.sse_app())
    except Exception as e:
        logger.warning(f"Failed to mount MCP server: {e}")

    return app
