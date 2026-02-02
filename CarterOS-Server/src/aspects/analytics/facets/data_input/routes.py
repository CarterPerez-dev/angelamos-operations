"""
ⒸAngelaMos | 2026
routes.py
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query, status

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
from aspects.analytics.facets.data_input.schemas import (
    TikTokVideoCreate,
    TikTokVideoUpdate,
    TikTokVideoResponse,
    TikTokVideoListResponse,
)
from aspects.analytics.facets.data_input.service import DataInputService


router = APIRouter(prefix="/analytics/videos", tags=["Analytics - Data Input"])


@router.post(
    "",
    response_model=TikTokVideoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_video(
    db: DBSession,
    data: TikTokVideoCreate,
) -> TikTokVideoResponse:
    """
    Create a new TikTok video record
    """
    return await DataInputService.create_video(db, data)


@router.get(
    "",
    response_model=TikTokVideoListResponse,
)
async def get_videos(
    db: DBSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
) -> TikTokVideoListResponse:
    """
    Get all videos with pagination
    """
    return await DataInputService.get_all_videos(db, page, page_size)


@router.get(
    "/{video_id}",
    response_model=TikTokVideoResponse,
    responses={**NOT_FOUND_404},
)
async def get_video(
    db: DBSession,
    video_id: UUID,
) -> TikTokVideoResponse:
    """
    Get a single video by ID
    """
    return await DataInputService.get_video(db, video_id)


@router.put(
    "/{video_id}",
    response_model=TikTokVideoResponse,
    responses={**NOT_FOUND_404},
)
async def update_video(
    db: DBSession,
    video_id: UUID,
    data: TikTokVideoUpdate,
) -> TikTokVideoResponse:
    """
    Update a video record
    """
    return await DataInputService.update_video(db, video_id, data)


@router.delete(
    "/{video_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def delete_video(
    db: DBSession,
    video_id: UUID,
) -> None:
    """
    Delete a video record
    """
    await DataInputService.delete_video(db, video_id)


@router.get(
    "/search/query",
    response_model=list[TikTokVideoResponse],
)
async def search_videos(
    db: DBSession,
    q: str = Query(min_length=1),
) -> list[TikTokVideoResponse]:
    """
    Search videos across hook, description, hashtags, CTA, and transcription
    """
    return await DataInputService.search_videos(db, q)


@router.get(
    "/filter/date-range",
    response_model=list[TikTokVideoResponse],
)
async def filter_by_date_range(
    db: DBSession,
    start_date: date = Query(),
    end_date: date = Query(),
) -> list[TikTokVideoResponse]:
    """
    Get videos within a date range
    """
    return await DataInputService.get_videos_by_date_range(db, start_date, end_date)


@router.get(
    "/filter/min-views",
    response_model=list[TikTokVideoResponse],
)
async def filter_by_min_views(
    db: DBSession,
    min_views: int = Query(ge=0),
) -> list[TikTokVideoResponse]:
    """
    Get videos with minimum view count
    """
    return await DataInputService.get_videos_by_min_views(db, min_views)
