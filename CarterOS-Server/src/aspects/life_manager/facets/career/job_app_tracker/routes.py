"""
ⒸAngelaMos | 2025
routes.py
"""

from uuid import UUID

from fastapi import APIRouter, Query, status

from core.security.auth.dependencies import DBSession, CurrentUser
from core.foundation.responses import NOT_FOUND_404, FORBIDDEN_403
from aspects.life_manager.facets.career.job_app_tracker.schemas import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    JobApplicationListResponse,
)
from aspects.life_manager.facets.career.job_app_tracker.enums import (
    ApplicationStatus,
    Outcome,
)
from aspects.life_manager.facets.career.job_app_tracker.service import (
    JobApplicationService,
)


router = APIRouter(prefix="/career/jobs", tags=["Job Application Tracker"])


@router.get(
    "",
    response_model=JobApplicationListResponse,
)
async def list_applications(
    db: DBSession,
    user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> JobApplicationListResponse:
    """
    Get all job applications for the current user
    """
    return await JobApplicationService.get_applications(db, user.id, skip, limit)


@router.get(
    "/stats",
    response_model=dict,
)
async def get_stats(
    db: DBSession,
    user: CurrentUser,
) -> dict:
    """
    Get aggregated stats for job applications
    """
    return await JobApplicationService.get_stats(db, user.id)


@router.get(
    "/followups",
    response_model=JobApplicationListResponse,
)
async def get_pending_followups(
    db: DBSession,
    user: CurrentUser,
) -> JobApplicationListResponse:
    """
    Get applications needing follow-up
    """
    return await JobApplicationService.get_pending_followups(db, user.id)


@router.get(
    "/by-status/{status}",
    response_model=JobApplicationListResponse,
)
async def get_by_status(
    db: DBSession,
    user: CurrentUser,
    status: ApplicationStatus,
) -> JobApplicationListResponse:
    """
    Get job applications filtered by application status
    """
    return await JobApplicationService.get_by_status(db, user.id, status)


@router.get(
    "/by-outcome/{outcome}",
    response_model=JobApplicationListResponse,
)
async def get_by_outcome(
    db: DBSession,
    user: CurrentUser,
    outcome: Outcome,
) -> JobApplicationListResponse:
    """
    Get job applications filtered by outcome
    """
    return await JobApplicationService.get_by_outcome(db, user.id, outcome)


@router.get(
    "/{application_id}",
    response_model=JobApplicationResponse,
    responses={**NOT_FOUND_404, **FORBIDDEN_403},
)
async def get_application(
    db: DBSession,
    user: CurrentUser,
    application_id: UUID,
) -> JobApplicationResponse:
    """
    Get a single job application by ID
    """
    return await JobApplicationService.get_application(db, user.id, application_id)


@router.post(
    "",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(
    db: DBSession,
    user: CurrentUser,
    data: JobApplicationCreate,
) -> JobApplicationResponse:
    """
    Create a new job application
    """
    return await JobApplicationService.create_application(db, user.id, data)


@router.patch(
    "/{application_id}",
    response_model=JobApplicationResponse,
    responses={**NOT_FOUND_404, **FORBIDDEN_403},
)
async def update_application(
    db: DBSession,
    user: CurrentUser,
    application_id: UUID,
    data: JobApplicationUpdate,
) -> JobApplicationResponse:
    """
    Update a job application
    """
    return await JobApplicationService.update_application(
        db, user.id, application_id, data
    )


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404, **FORBIDDEN_403},
)
async def delete_application(
    db: DBSession,
    user: CurrentUser,
    application_id: UUID,
) -> None:
    """
    Delete a job application
    """
    await JobApplicationService.delete_application(db, user.id, application_id)
