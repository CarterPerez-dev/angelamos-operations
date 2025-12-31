"""
ⒸAngelaMos | 2025
schedule.py
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from core.security.auth.dependencies import CurrentUser, DBSession
from core.enums import PlatformType, ScheduleStatus
from core.integrations.later_dev import LateApiError
from core.foundation.logging import get_logger

from aspects.content_studio.shared.services.scheduler_service import SchedulerService
from aspects.content_studio.shared.repositories.scheduled_post import (
    ScheduledPostRepository,
)
from aspects.content_studio.shared.schemas.scheduler import (
    ScheduleSingleRequest,
    ScheduleMultiRequest,
    RescheduleRequest,
    ScheduledPostResponse,
    ScheduleBatchResponse,
    SyncResponse,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/posts", tags=["Scheduled Posts"])


@router.post("", response_model=ScheduledPostResponse)
async def schedule_single(
    request: ScheduleSingleRequest,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduledPostResponse:
    """
    Schedule post to single platform
    """
    try:
        result = await SchedulerService.schedule_single(
            session=db,
            content_library_item_id=request.content_library_item_id,
            connected_account_id=request.connected_account_id,
            scheduled_for=request.scheduled_for,
            timezone=request.timezone,
            platform_specific_config=request.platform_specific_config,
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


@router.post("/multi", response_model=ScheduleBatchResponse)
async def schedule_multi(
    request: ScheduleMultiRequest,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduleBatchResponse:
    """
    Schedule post to multiple platforms
    """
    try:
        result = await SchedulerService.schedule_multi(
            session=db,
            content_library_item_id=request.content_library_item_id,
            account_schedules=[
                {
                    "connected_account_id": s.connected_account_id,
                    "scheduled_for": s.scheduled_for,
                    "platform_specific_config": s.platform_specific_config,
                }
                for s in request.account_schedules
            ],
            timezone=request.timezone,
        )

        return ScheduleBatchResponse(
            batch_id=result["batch_id"],
            posts=[ScheduledPostResponse(**p) for p in result["posts"]],
        )

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


@router.get("", response_model=list[ScheduledPostResponse])
async def list_posts(
    db: DBSession,
    current_user: CurrentUser = None,
    status_filter: ScheduleStatus | None = None,
    platform: PlatformType | None = None,
    account_id: UUID | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ScheduledPostResponse]:
    """
    List scheduled posts with filters
    """
    posts = await ScheduledPostRepository.get_multi(
        session=db,
        status=status_filter,
        platform=platform,
        account_id=account_id,
        skip=skip,
        limit=limit,
    )

    return [
        ScheduledPostResponse(**SchedulerService.post_to_dict(p))
        for p in posts
    ]


@router.get("/upcoming", response_model=list[ScheduledPostResponse])
async def get_upcoming(
    db: DBSession,
    current_user: CurrentUser = None,
    hours: int = 24,
    limit: int = 20,
) -> list[ScheduledPostResponse]:
    """
    Get posts scheduled for the next N hours
    """
    result = await SchedulerService.get_upcoming(
        session=db,
        hours=hours,
        limit=limit,
    )

    return [ScheduledPostResponse(**p) for p in result]


@router.get("/batch/{batch_id}", response_model=list[ScheduledPostResponse])
async def get_batch(
    batch_id: str,
    db: DBSession,
    current_user: CurrentUser = None,
) -> list[ScheduledPostResponse]:
    """
    Get all posts in a batch
    """
    posts = await ScheduledPostRepository.get_by_batch_id(db, batch_id)

    if not posts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch {batch_id} not found",
        )

    return [
        ScheduledPostResponse(**SchedulerService.post_to_dict(p))
        for p in posts
    ]


@router.get("/{post_id}", response_model=ScheduledPostResponse)
async def get_post(
    post_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduledPostResponse:
    """
    Get single scheduled post
    """
    post = await ScheduledPostRepository.get_by_id_with_relations(db, post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found",
        )

    return ScheduledPostResponse(**SchedulerService.post_to_dict(post))


@router.put("/{post_id}", response_model=ScheduledPostResponse)
async def reschedule_post(
    post_id: UUID,
    request: RescheduleRequest,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduledPostResponse:
    """
    Reschedule a post
    """
    try:
        result = await SchedulerService.reschedule(
            session=db,
            post_id=post_id,
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


@router.delete("/{post_id}")
async def cancel_post(
    post_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> dict:
    """
    Cancel a scheduled post
    """
    try:
        result = await SchedulerService.cancel(db, post_id)
        return {"status": "cancelled", "post": result}

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


@router.post("/{post_id}/publish", response_model=ScheduledPostResponse)
async def publish_now(
    post_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ScheduledPostResponse:
    """
    Publish a post immediately
    """
    try:
        result = await SchedulerService.publish_now(db, post_id)
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


@router.post("/sync", response_model=SyncResponse)
async def sync_pending(
    db: DBSession,
    current_user: CurrentUser = None,
) -> SyncResponse:
    """
    Sync all pending posts to Late API
    """
    result = await SchedulerService.sync_pending(db)
    return SyncResponse(**result)
