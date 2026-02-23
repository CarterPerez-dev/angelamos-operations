"""
ⒸAngelaMos | 2026
repository.py
"""

from collections.abc import Sequence
from datetime import date
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.repositories.base import BaseRepository
from aspects.life_manager.facets.checklist.models import ChecklistItem, ChecklistLog


class ChecklistItemRepository(BaseRepository[ChecklistItem]):
    """
    Repository for ChecklistItem operations
    """
    model = ChecklistItem

    @classmethod
    async def get_active(
        cls,
        session: AsyncSession,
    ) -> Sequence[ChecklistItem]:
        """
        Get all active items ordered by sort_order
        """
        result = await session.execute(
            select(ChecklistItem).where(
                ChecklistItem.is_active == sa.true()
            ).order_by(ChecklistItem.sort_order)
        )
        return result.scalars().all()

    @classmethod
    async def soft_delete(
        cls,
        session: AsyncSession,
        item: ChecklistItem,
    ) -> ChecklistItem:
        """
        Set is_active=False instead of deleting
        """
        item.is_active = False
        await session.flush()
        await session.refresh(item)
        return item


class ChecklistLogRepository(BaseRepository[ChecklistLog]):
    """
    Repository for ChecklistLog operations
    """
    model = ChecklistLog

    @classmethod
    async def get_by_date(
        cls,
        session: AsyncSession,
        log_date: date,
    ) -> Sequence[ChecklistLog]:
        """
        Get all log entries for a date, joined with item for title/sort
        """
        result = await session.execute(
            select(ChecklistLog).join(ChecklistLog.item).where(
                ChecklistLog.log_date == log_date
            ).order_by(ChecklistItem.sort_order)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_item_and_date(
        cls,
        session: AsyncSession,
        item_id: UUID,
        log_date: date,
    ) -> ChecklistLog | None:
        """
        Get a specific log entry
        """
        result = await session.execute(
            select(ChecklistLog).where(
                ChecklistLog.item_id == item_id,
                ChecklistLog.log_date == log_date,
            )
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_heatmap_data(
        cls,
        session: AsyncSession,
        start_date: date,
        end_date: date,
    ) -> Sequence[sa.Row]:
        """
        Get (log_date, completed_count, total_count) aggregates for a date range
        """
        result = await session.execute(
            select(
                ChecklistLog.log_date,
                func.sum(sa.cast(ChecklistLog.completed,
                                 sa.Integer)).label("completed_count"),
                func.count(ChecklistLog.id).label("total_count"),
            ).where(
                ChecklistLog.log_date >= start_date,
                ChecklistLog.log_date <= end_date,
            ).group_by(ChecklistLog.log_date).order_by(
                ChecklistLog.log_date
            )
        )
        return result.all()

    @classmethod
    async def get_item_completion_rates(
        cls,
        session: AsyncSession,
    ) -> Sequence[sa.Row]:
        """
        Get (item_id, total_days, completed_days) for all active items
        """
        result = await session.execute(
            select(
                ChecklistLog.item_id,
                func.count(ChecklistLog.id).label("total"),
                func.sum(sa.cast(ChecklistLog.completed,
                                 sa.Integer)).label("completed"),
            ).join(ChecklistLog.item).where(
                ChecklistItem.is_active == sa.true()
            ).group_by(ChecklistLog.item_id)
        )
        return result.all()
