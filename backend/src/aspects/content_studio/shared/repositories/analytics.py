"""
ⒸAngelaMos | 2025
analytics.py
"""

from datetime import datetime, UTC, timedelta
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aspects.content_studio.shared.models.scheduling import (
    PostAnalytics,
    FollowerStats,
    ScheduledPost,
)
from core.enums import (
    PlatformType,
)


class PostAnalyticsRepository:
    """
    Repository for post analytics
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        analytics_id: UUID,
    ) -> PostAnalytics | None:
        """
        Get analytics by ID
        """
        return await session.get(PostAnalytics, analytics_id)

    @staticmethod
    async def get_by_scheduled_post(
        session: AsyncSession,
        scheduled_post_id: UUID,
    ) -> PostAnalytics | None:
        """
        Get analytics for a scheduled post
        """
        result = await session.execute(
            select(PostAnalytics).where(
                PostAnalytics.scheduled_post_id == scheduled_post_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_multi(
        session: AsyncSession,
        platform: PlatformType | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        min_engagement_rate: float | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PostAnalytics]:
        """
        Get post analytics with filters
        """
        query = select(PostAnalytics).options(
            selectinload(PostAnalytics.scheduled_post)
            .selectinload(ScheduledPost.content_library_item)
        )

        conditions = []

        if platform:
            conditions.append(PostAnalytics.platform == platform)

        if from_date:
            conditions.append(PostAnalytics.synced_at >= from_date)

        if to_date:
            conditions.append(PostAnalytics.synced_at <= to_date)

        if min_engagement_rate:
            conditions.append(PostAnalytics.engagement_rate >= min_engagement_rate)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(PostAnalytics.synced_at.desc())
        query = query.offset(skip).limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_top_performers(
        session: AsyncSession,
        platform: PlatformType | None = None,
        days: int = 30,
        limit: int = 10,
    ) -> list[PostAnalytics]:
        """
        Get top performing posts by engagement rate
        """
        since_date = datetime.now(UTC) - timedelta(days=days)

        query = select(PostAnalytics).options(
            selectinload(PostAnalytics.scheduled_post)
            .selectinload(ScheduledPost.content_library_item)
        ).where(
            PostAnalytics.synced_at >= since_date
        )

        if platform:
            query = query.where(PostAnalytics.platform == platform)

        query = query.order_by(PostAnalytics.engagement_rate.desc()).limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create(
        session: AsyncSession,
        scheduled_post_id: UUID,
        platform: PlatformType,
        views: int = 0,
        likes: int = 0,
        comments: int = 0,
        shares: int = 0,
        saves: int = 0,
        clicks: int = 0,
        impressions: int = 0,
        reach: int = 0,
        engagement_rate: float = 0.0,
        watch_time_seconds: float | None = None,
        avg_watch_percentage: float | None = None,
        raw_data: dict | None = None,
    ) -> PostAnalytics:
        """
        Create new analytics record
        """
        analytics = PostAnalytics(
            scheduled_post_id=scheduled_post_id,
            platform=platform,
            views=views,
            likes=likes,
            comments=comments,
            shares=shares,
            saves=saves,
            clicks=clicks,
            impressions=impressions,
            reach=reach,
            engagement_rate=engagement_rate,
            watch_time_seconds=watch_time_seconds,
            avg_watch_percentage=avg_watch_percentage,
            synced_at=datetime.now(UTC),
            raw_data=raw_data,
        )

        session.add(analytics)
        await session.flush()
        await session.refresh(analytics)
        return analytics

    @staticmethod
    async def update(
        session: AsyncSession,
        analytics: PostAnalytics,
        views: int | None = None,
        likes: int | None = None,
        comments: int | None = None,
        shares: int | None = None,
        saves: int | None = None,
        clicks: int | None = None,
        impressions: int | None = None,
        reach: int | None = None,
        engagement_rate: float | None = None,
        watch_time_seconds: float | None = None,
        avg_watch_percentage: float | None = None,
        raw_data: dict | None = None,
    ) -> PostAnalytics:
        """
        Update analytics record
        """
        if views is not None:
            analytics.views = views
        if likes is not None:
            analytics.likes = likes
        if comments is not None:
            analytics.comments = comments
        if shares is not None:
            analytics.shares = shares
        if saves is not None:
            analytics.saves = saves
        if clicks is not None:
            analytics.clicks = clicks
        if impressions is not None:
            analytics.impressions = impressions
        if reach is not None:
            analytics.reach = reach
        if engagement_rate is not None:
            analytics.engagement_rate = engagement_rate
        if watch_time_seconds is not None:
            analytics.watch_time_seconds = watch_time_seconds
        if avg_watch_percentage is not None:
            analytics.avg_watch_percentage = avg_watch_percentage
        if raw_data is not None:
            analytics.raw_data = raw_data

        analytics.synced_at = datetime.now(UTC)

        await session.flush()
        await session.refresh(analytics)
        return analytics

    @staticmethod
    async def get_aggregated_stats(
        session: AsyncSession,
        platform: PlatformType | None = None,
        days: int = 30,
    ) -> dict:
        """
        Get aggregated analytics stats
        """
        since_date = datetime.now(UTC) - timedelta(days=days)

        query = select(
            func.count(PostAnalytics.id).label("total_posts"),
            func.sum(PostAnalytics.views).label("total_views"),
            func.sum(PostAnalytics.likes).label("total_likes"),
            func.sum(PostAnalytics.comments).label("total_comments"),
            func.sum(PostAnalytics.shares).label("total_shares"),
            func.avg(PostAnalytics.engagement_rate).label("avg_engagement_rate"),
            func.max(PostAnalytics.views).label("max_views"),
        ).where(PostAnalytics.synced_at >= since_date)

        if platform:
            query = query.where(PostAnalytics.platform == platform)

        result = await session.execute(query)
        row = result.first()

        return {
            "total_posts": row.total_posts or 0,
            "total_views": row.total_views or 0,
            "total_likes": row.total_likes or 0,
            "total_comments": row.total_comments or 0,
            "total_shares": row.total_shares or 0,
            "avg_engagement_rate": float(row.avg_engagement_rate) if row.avg_engagement_rate else 0.0,
            "max_views": row.max_views or 0,
        }


class FollowerStatsRepository:
    """
    Repository for follower statistics
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        stats_id: UUID,
    ) -> FollowerStats | None:
        """
        Get follower stats by ID
        """
        return await session.get(FollowerStats, stats_id)

    @staticmethod
    async def get_by_account(
        session: AsyncSession,
        connected_account_id: UUID,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        limit: int = 30,
    ) -> list[FollowerStats]:
        """
        Get follower stats for a connected account
        """
        query = select(FollowerStats).where(
            FollowerStats.connected_account_id == connected_account_id
        )

        if from_date:
            query = query.where(FollowerStats.recorded_date >= from_date)

        if to_date:
            query = query.where(FollowerStats.recorded_date <= to_date)

        query = query.order_by(FollowerStats.recorded_date.desc()).limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_latest_by_account(
        session: AsyncSession,
        connected_account_id: UUID,
    ) -> FollowerStats | None:
        """
        Get latest follower stats for account
        """
        result = await session.execute(
            select(FollowerStats)
            .where(FollowerStats.connected_account_id == connected_account_id)
            .order_by(FollowerStats.recorded_date.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_platform(
        session: AsyncSession,
        platform: PlatformType,
        days: int = 30,
    ) -> list[FollowerStats]:
        """
        Get follower stats for all accounts of a platform
        """
        since_date = datetime.now(UTC) - timedelta(days=days)

        result = await session.execute(
            select(FollowerStats)
            .options(selectinload(FollowerStats.connected_account))
            .where(
                and_(
                    FollowerStats.platform == platform,
                    FollowerStats.recorded_date >= since_date,
                )
            )
            .order_by(FollowerStats.recorded_date.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        session: AsyncSession,
        connected_account_id: UUID,
        platform: PlatformType,
        follower_count: int,
        following_count: int | None = None,
        posts_count: int | None = None,
        daily_change: int | None = None,
        weekly_change: int | None = None,
        monthly_change: int | None = None,
        recorded_date: datetime | None = None,
    ) -> FollowerStats:
        """
        Create new follower stats record
        """
        stats = FollowerStats(
            connected_account_id=connected_account_id,
            platform=platform,
            recorded_date=recorded_date or datetime.now(UTC),
            follower_count=follower_count,
            following_count=following_count,
            posts_count=posts_count,
            daily_change=daily_change,
            weekly_change=weekly_change,
            monthly_change=monthly_change,
        )

        session.add(stats)
        await session.flush()
        await session.refresh(stats)
        return stats

    @staticmethod
    async def calculate_growth(
        session: AsyncSession,
        connected_account_id: UUID,
        days: int = 30,
    ) -> dict:
        """
        Calculate follower growth for account
        """
        stats = await FollowerStatsRepository.get_by_account(
            session=session,
            connected_account_id=connected_account_id,
            limit=days + 1,
        )

        if not stats:
            return {
                "current_followers": 0,
                "growth_count": 0,
                "growth_percentage": 0.0,
            }

        current = stats[0].follower_count if stats else 0
        oldest = stats[-1].follower_count if len(stats) > 1 else current

        growth_count = current - oldest
        growth_percentage = (growth_count / oldest * 100) if oldest > 0 else 0.0

        return {
            "current_followers": current,
            "growth_count": growth_count,
            "growth_percentage": round(growth_percentage, 2),
        }

    @staticmethod
    async def get_total_followers(
        session: AsyncSession,
    ) -> dict[PlatformType, int]:
        """
        Get latest total followers per platform
        """
        subquery = (
            select(
                FollowerStats.connected_account_id,
                func.max(FollowerStats.recorded_date).label("max_date")
            )
            .group_by(FollowerStats.connected_account_id)
            .subquery()
        )

        result = await session.execute(
            select(FollowerStats.platform, func.sum(FollowerStats.follower_count))
            .join(
                subquery,
                and_(
                    FollowerStats.connected_account_id == subquery.c.connected_account_id,
                    FollowerStats.recorded_date == subquery.c.max_date,
                )
            )
            .group_by(FollowerStats.platform)
        )

        return {row[0]: row[1] for row in result.all()}
