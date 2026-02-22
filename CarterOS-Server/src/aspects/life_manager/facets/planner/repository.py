"""
ⒸAngelaMos | 2026
repository.py
"""

from collections.abc import Sequence
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.repositories.base import BaseRepository
from aspects.life_manager.facets.planner.models import TimeBlock


class TimeBlockRepository(BaseRepository[TimeBlock]):
    """
    Repository for TimeBlock operations
    """
    model = TimeBlock

    @classmethod
    async def get_by_date(
        cls,
        session: AsyncSession,
        block_date: date,
    ) -> Sequence[TimeBlock]:
        """
        Get all time blocks for a date
        """
        result = await session.execute(
            select(TimeBlock).where(
                TimeBlock.block_date == block_date
            ).order_by(TimeBlock.start_time,
                       TimeBlock.sort_order)
        )
        return result.scalars().all()
