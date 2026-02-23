"""
ⒸAngelaMos | 2026
service.py
"""

from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ResourceNotFound
from aspects.analytics.facets.data_input.repository import TikTokVideoRepository
from aspects.analytics.facets.data_input.schemas import (
    TikTokVideoCreate,
    TikTokVideoUpdate,
    TikTokVideoResponse,
    TikTokVideoListResponse,
)


class TikTokVideoNotFound(ResourceNotFound):
    """
    Raised when TikTok video not found
    """
    def __init__(self, video_id: UUID) -> None:
        super().__init__(
            resource = "TikTokVideo",
            identifier = str(video_id)
        )


class DataInputService:
    """
    Service for TikTok video data input operations
    """
    @staticmethod
    async def create_video(
        session: AsyncSession,
        data: TikTokVideoCreate,
    ) -> TikTokVideoResponse:
        """
        Create a TikTok video record
        """
        video = await TikTokVideoRepository.create(
            session,
            rank = data.rank,
            date_posted = data.date_posted,
            video_url = data.video_url,
            views = data.views,
            comments = data.comments,
            likes = data.likes,
            bookmarks = data.bookmarks,
            shares = data.shares,
            avg_watch_time = data.avg_watch_time,
            new_followers = data.new_followers,
            watched_full_video_percentage = data.
            watched_full_video_percentage,
            top_comment_words = data.top_comment_words,
            search_queries = data.search_queries,
            traffic_sources = data.traffic_sources,
            hook = data.hook,
            text_on_screen_hook = data.text_on_screen_hook,
            length = data.length,
            description = data.description,
            hashtags = data.hashtags,
            cta = data.cta,
            full_transcription = data.full_transcription,
            notes = data.notes,
        )
        return TikTokVideoResponse.model_validate(video)

    @staticmethod
    async def get_video(
        session: AsyncSession,
        video_id: UUID,
    ) -> TikTokVideoResponse:
        """
        Get a single video by ID
        """
        video = await TikTokVideoRepository.get_by_id(session, video_id)
        if not video:
            raise TikTokVideoNotFound(video_id)
        return TikTokVideoResponse.model_validate(video)

    @staticmethod
    async def get_all_videos(
        session: AsyncSession,
        page: int = 1,
        page_size: int = 50,
    ) -> TikTokVideoListResponse:
        """
        Get all videos with pagination
        """
        skip = (page - 1) * page_size
        videos = await TikTokVideoRepository.get_multi(
            session,
            skip = skip,
            limit = page_size
        )
        total = await TikTokVideoRepository.count(session)

        return TikTokVideoListResponse(
            items = [
                TikTokVideoResponse.model_validate(v) for v in videos
            ],
            total = total,
            page = page,
            page_size = page_size,
        )

    @staticmethod
    async def update_video(
        session: AsyncSession,
        video_id: UUID,
        data: TikTokVideoUpdate,
    ) -> TikTokVideoResponse:
        """
        Update a video record
        """
        video = await TikTokVideoRepository.get_by_id(session, video_id)
        if not video:
            raise TikTokVideoNotFound(video_id)

        update_dict = data.model_dump(exclude_unset = True)
        video = await TikTokVideoRepository.update(
            session,
            video,
            **update_dict
        )
        return TikTokVideoResponse.model_validate(video)

    @staticmethod
    async def delete_video(
        session: AsyncSession,
        video_id: UUID,
    ) -> None:
        """
        Delete a video record
        """
        video = await TikTokVideoRepository.get_by_id(session, video_id)
        if not video:
            raise TikTokVideoNotFound(video_id)
        await TikTokVideoRepository.delete(session, video)

    @staticmethod
    async def search_videos(
        session: AsyncSession,
        query: str,
    ) -> list[TikTokVideoResponse]:
        """
        Search videos by query string
        """
        videos = await TikTokVideoRepository.search_videos(session, query)
        return [TikTokVideoResponse.model_validate(v) for v in videos]

    @staticmethod
    async def get_videos_by_date_range(
        session: AsyncSession,
        start_date: date,
        end_date: date,
    ) -> list[TikTokVideoResponse]:
        """
        Get videos within date range
        """
        videos = await TikTokVideoRepository.get_by_date_range(
            session,
            start_date,
            end_date
        )
        return [TikTokVideoResponse.model_validate(v) for v in videos]

    @staticmethod
    async def get_videos_by_min_views(
        session: AsyncSession,
        min_views: int,
    ) -> list[TikTokVideoResponse]:
        """
        Get videos with minimum view count
        """
        videos = await TikTokVideoRepository.get_by_min_views(
            session,
            min_views
        )
        return [TikTokVideoResponse.model_validate(v) for v in videos]
