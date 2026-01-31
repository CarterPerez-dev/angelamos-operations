"""
ⒸAngelaMos | 2026
routers.py
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config import settings, Environment, API_PREFIX
from core.foundation.schemas.common import AppInfoResponse
from aspects.auth.routes.admin import router as admin_router
from aspects.auth.routes.auth import router as auth_router
from aspects.auth.routes.user import router as user_router
from app.setup.health import router as health_router
from aspects.challenge.facets.tracker.routes import (
    router as challenge_router,
)
from aspects.life_manager.facets.planner.routes import (
    router as planner_router,
)
from aspects.life_manager.facets.notes.routes import (
    router as notes_router,
)
from aspects.life_manager.facets.career.job_app_tracker.routes import (
    router as job_tracker_router,
)
from aspects.analytics.facets.data_input.routes import (
    router as analytics_router,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)


def register_routers(app: FastAPI) -> None:
    """
    Register all application routers
    """
    is_production = settings.ENVIRONMENT == Environment.PRODUCTION

    @app.get("/", response_model = AppInfoResponse, tags = ["root"])
    async def root() -> AppInfoResponse:
        return AppInfoResponse(
            name = settings.APP_NAME,
            version = settings.APP_VERSION,
            environment = settings.ENVIRONMENT.value,
            docs_url = "/docs",
        )

    app.include_router(health_router)
    app.include_router(admin_router, prefix = API_PREFIX)
    app.include_router(auth_router, prefix = API_PREFIX)
    app.include_router(user_router, prefix = API_PREFIX)
    app.include_router(
        challenge_router,
        prefix = API_PREFIX
    )
    app.include_router(
        planner_router,
        prefix = API_PREFIX
    )
    app.include_router(
        notes_router,
        prefix = API_PREFIX
    )
    app.include_router(
        job_tracker_router,
        prefix = API_PREFIX
    )
    app.include_router(
        analytics_router,
        prefix = API_PREFIX
    )

