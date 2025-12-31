"""
ⒸAngelaMos | 2025
follower_stats.py
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from core.enums import PlatformType
from aspects.content_studio.shared.models.scheduling import FollowerStats


class FollowerStatsRepository:
    """
    Repository for follower statistics tracking
    """

    @staticmethod
    async def get_all_since(
        session: AsyncSession,
        from_date: datetime,
    ) -> list[FollowerStats]:
        """
        Get all follower stats since a given date
        """
        stmt = (
            select(FollowerStats)
            .where(FollowerStats.recorded_date >= from_date)
            .order_by(FollowerStats.recorded_date.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_account(
        session: AsyncSession,
        connected_account_id: UUID,
        from_date: datetime | None = None,
    ) -> list[FollowerStats]:
        """
        Get follower stats for a specific account
        """
        conditions = [FollowerStats.connected_account_id == connected_account_id]
        if from_date:
            conditions.append(FollowerStats.recorded_date >= from_date)

        stmt = (
            select(FollowerStats)
            .where(and_(*conditions))
            .order_by(FollowerStats.recorded_date.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def upsert(
        session: AsyncSession,
        connected_account_id: UUID,
        platform: PlatformType,
        recorded_date: datetime,
        follower_count: int,
        following_count: int | None = None,
        posts_count: int | None = None,
    ) -> FollowerStats:
        """
        Insert or update follower stats for a specific account and date
        """
        normalized_date = recorded_date.replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        stmt = (
            insert(FollowerStats)
            .values(
                connected_account_id=connected_account_id,
                platform=platform,
                recorded_date=normalized_date,
                follower_count=follower_count,
                following_count=following_count,
                posts_count=posts_count,
            )
            .on_conflict_do_update(
                constraint="uq_follower_account_date",
                set_={
                    "follower_count": follower_count,
                    "following_count": following_count,
                    "posts_count": posts_count,
                    "updated_at": datetime.utcnow(),
                },
            )
            .returning(FollowerStats)
        )
        result = await session.execute(stmt)
        return result.scalar_one()

    @staticmethod
    async def get_latest_by_account(
        session: AsyncSession,
        connected_account_id: UUID,
    ) -> FollowerStats | None:
        """
        Get the most recent follower stats for an account
        """
        stmt = (
            select(FollowerStats)
            .where(FollowerStats.connected_account_id == connected_account_id)
            .order_by(FollowerStats.recorded_date.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
