"""
ⒸAngelaMos | 2025
calendar.py
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from core.security.auth.dependencies import CurrentUser, DBSession
from core.integrations.later_dev import LateApiError
from core.foundation.logging import get_logger

from aspects.content_studio.shared.services.scheduler_service import SchedulerService
from aspects.content_studio.shared.schemas.scheduler import (
    CalendarRescheduleRequest,
    ScheduledPostResponse,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("", response_model=list[ScheduledPostResponse])
async def get_calendar_data(
    from_date: datetime,
    to_date: datetime,
    db: DBSession,
    current_user: CurrentUser = None,
    account_ids: str | None = None,
) -> list[ScheduledPostResponse]:
    """
    Get scheduled posts for calendar view

    Args:
        from_date: Start of date range
        to_date: End of date range
        account_ids: Comma-separated account IDs to filter (optional)
    """
    account_id_list = None
    if account_ids:
        account_id_list = [UUID(id.strip()) for id in account_ids.split(",")]

    result = await SchedulerService.get_calendar_data(
        session=db,
        from_date=from_date,
        to_date=to_date,
        account_ids=account_id_list,
    )

    return [ScheduledPostResponse(**p) for p in result]


@router.put("/reschedule", response_model=ScheduledPostResponse)
async def calendar_reschedule(
    request: CalendarRescheduleRequest,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduledPostResponse:
    """
    Reschedule post via drag-and-drop in calendar
    """
    try:
        result = await SchedulerService.reschedule(
            session=db,
            post_id=request.post_id,
            scheduled_for=request.scheduled_for,
            timezone=request.timezone,
        )

        return ScheduledPostResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from None
    except LateApiError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Late API error: {e.message}",
        ) from None
