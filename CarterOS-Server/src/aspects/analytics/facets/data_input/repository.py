"""
ⒸAngelaMos | 2026
repository.py
"""

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.repositories.base import BaseRepository
from aspects.analytics.facets.data_input.models import TikTokVideo


class TikTokVideoRepository(BaseRepository[TikTokVideo]):
    """
    Repository for TikTok video analytics operations
    """
    model = TikTokVideo

    @classmethod
    async def get_by_rank_range(
        cls,
        session: AsyncSession,
        min_rank: int,
        max_rank: int,
    ) -> Sequence[TikTokVideo]:
        """
        Get videos within a rank range
        """
        result = await session.execute(
            select(TikTokVideo).where(
                TikTokVideo.rank >= min_rank,
                TikTokVideo.rank <= max_rank
            ).order_by(TikTokVideo.rank)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_date_range(
        cls,
        session: AsyncSession,
        start_date: date,
        end_date: date,
    ) -> Sequence[TikTokVideo]:
        """
        Get videos posted within a date range
        """
        result = await session.execute(
            select(TikTokVideo).where(
                TikTokVideo.date_posted >= start_date,
                TikTokVideo.date_posted <= end_date
            ).order_by(TikTokVideo.date_posted.desc())
        )
        return result.scalars().all()

    @classmethod
    async def get_by_min_views(
        cls,
        session: AsyncSession,
        min_views: int,
    ) -> Sequence[TikTokVideo]:
        """
        Get videos with minimum view count
        """
        result = await session.execute(
            select(TikTokVideo).where(TikTokVideo.views >= min_views
                                      ).order_by(TikTokVideo.views.desc())
        )
        return result.scalars().all()

    @classmethod
    async def search_videos(
        cls,
        session: AsyncSession,
        query: str,
    ) -> Sequence[TikTokVideo]:
        """
        Search across hook, description, hashtags, CTA, and transcription
        """
        search_term = f"%{query}%"
        result = await session.execute(
            select(TikTokVideo).where(
                or_(
                    TikTokVideo.hook.ilike(search_term),
                    TikTokVideo.description.ilike(search_term),
                    TikTokVideo.cta.ilike(search_term),
                    TikTokVideo.full_transcription.ilike(search_term),
                )
            ).order_by(TikTokVideo.rank)
        )
        return result.scalars().all()

    @classmethod
    async def get_all_ordered(
        cls,
        session: AsyncSession,
        order_by: str = "rank",
    ) -> Sequence[TikTokVideo]:
        """
        Get all videos ordered by specified field
        """
        order_field = getattr(TikTokVideo, order_by, TikTokVideo.rank)
        result = await session.execute(
            select(TikTokVideo).order_by(order_field)
        )
        return result.scalars().all()
