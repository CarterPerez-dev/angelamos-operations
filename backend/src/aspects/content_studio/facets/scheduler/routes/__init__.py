"""
ⒸAngelaMos | 2025
__init__.py
"""

from fastapi import APIRouter

from aspects.content_studio.facets.scheduler.routes.accounts import router as accounts_router
from aspects.content_studio.facets.scheduler.routes.library import router as library_router
from aspects.content_studio.facets.scheduler.routes.schedule import router as schedule_router
from aspects.content_studio.facets.scheduler.routes.calendar import router as calendar_router
from aspects.content_studio.facets.scheduler.routes.analytics import router as analytics_router


router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

router.include_router(accounts_router)
router.include_router(library_router)
router.include_router(schedule_router)
router.include_router(calendar_router)
router.include_router(analytics_router)
