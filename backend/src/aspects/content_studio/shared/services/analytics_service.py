"""
ⒸAngelaMos | 2025
analytics_service.py
"""

from datetime import datetime, UTC, timedelta
from uuid import UUID
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.repositories.analytics import (
    PostAnalyticsRepository,
    FollowerStatsRepository,
)
from aspects.content_studio.shared.repositories.scheduled_post import (
    ScheduledPostRepository,
)
from aspects.content_studio.shared.repositories.connected_account import (
    ConnectedAccountRepository,
)
from aspects.content_studio.shared.models.scheduling import (
    PostAnalytics,
    FollowerStats,
)
from core.enums import (
    PlatformType,
    ScheduleStatus,
)
from core.integrations.later_dev import (
    LateApiClient,
    LateApiError,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)


class AnalyticsService:
    """
    Service for analytics and statistics

    Handles:
    - Post analytics syncing from Late API
    - Follower stats tracking
    - Performance metrics calculation
    - Best posting times analysis
    """

    @staticmethod
    async def sync_post_analytics(
        session: AsyncSession,
        post_id: UUID,
    ) -> dict | None:
        """
        Sync analytics for a single post from Late API
        """
        post = await ScheduledPostRepository.get_by_id_with_relations(
            session, post_id
        )

        if not post:
            raise ValueError(f"Post {post_id} not found")

        if post.status != ScheduleStatus.PUBLISHED:
            return None

        if not post.late_post_id:
            return None

        client = LateApiClient()

        try:
            late_analytics = await client.get_analytics(post_id=post.late_post_id)

            if isinstance(late_analytics, list):
                if not late_analytics:
                    return None
                late_analytics = late_analytics[0]

            existing = await PostAnalyticsRepository.get_by_scheduled_post(
                session, post_id
            )

            if existing:
                analytics = await PostAnalyticsRepository.update(
                    session=session,
                    analytics=existing,
                    views=late_analytics.views,
                    likes=late_analytics.likes,
                    comments=late_analytics.comments,
                    shares=late_analytics.shares,
                    saves=late_analytics.saves,
                    clicks=late_analytics.clicks,
                    impressions=late_analytics.impressions,
                    reach=late_analytics.reach,
                    engagement_rate=late_analytics.engagement_rate,
                    watch_time_seconds=late_analytics.watch_time_seconds,
                    avg_watch_percentage=late_analytics.avg_watch_percentage,
                )
            else:
                analytics = await PostAnalyticsRepository.create(
                    session=session,
                    scheduled_post_id=post_id,
                    platform=post.platform,
                    views=late_analytics.views,
                    likes=late_analytics.likes,
                    comments=late_analytics.comments,
                    shares=late_analytics.shares,
                    saves=late_analytics.saves,
                    clicks=late_analytics.clicks,
                    impressions=late_analytics.impressions,
                    reach=late_analytics.reach,
                    engagement_rate=late_analytics.engagement_rate,
                    watch_time_seconds=late_analytics.watch_time_seconds,
                    avg_watch_percentage=late_analytics.avg_watch_percentage,
                )

            await session.commit()

            logger.info(
                "Analytics synced",
                post_id=post_id,
                views=analytics.views,
                engagement_rate=analytics.engagement_rate,
            )

            return AnalyticsService._analytics_to_dict(analytics)

        except LateApiError as e:
            logger.error(
                "Failed to sync analytics",
                post_id=post_id,
                error=str(e),
            )
            return None

        finally:
            await client.close()

    @staticmethod
    async def sync_all_published(
        session: AsyncSession,
        days: int = 7,
    ) -> dict:
        """
        Sync analytics for all published posts in last N days

        Called by background job
        """
        since_date = datetime.now(UTC) - timedelta(days=days)

        posts = await ScheduledPostRepository.get_multi(
            session=session,
            status=ScheduleStatus.PUBLISHED,
            from_date=since_date,
            limit=1000,
        )

        synced = 0
        failed = 0

        for post in posts:
            try:
                result = await AnalyticsService.sync_post_analytics(
                    session, post.id
                )
                if result:
                    synced += 1
            except Exception as e:
                logger.error(
                    "Analytics sync failed",
                    post_id=post.id,
                    error=str(e),
                )
                failed += 1

        logger.info(
            "Analytics sync complete",
            synced=synced,
            failed=failed,
        )

        return {
            "synced": synced,
            "failed": failed,
        }

    @staticmethod
    async def sync_follower_stats(
        session: AsyncSession,
        account_id: UUID,
    ) -> dict | None:
        """
        Sync follower stats for a connected account
        """
        account = await ConnectedAccountRepository.get_by_id(session, account_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        client = LateApiClient()

        try:
            stats = await client.get_follower_stats(
                account_ids=[account.late_account_id]
            )

            if not stats:
                return None

            latest = stats[0]

            previous = await FollowerStatsRepository.get_latest_by_account(
                session, account_id
            )

            daily_change = None
            if previous:
                daily_change = latest.follower_count - previous.follower_count

            follower_stats = await FollowerStatsRepository.create(
                session=session,
                connected_account_id=account_id,
                platform=account.platform,
                follower_count=latest.follower_count,
                following_count=latest.following_count,
                posts_count=latest.posts_count,
                daily_change=daily_change,
                weekly_change=latest.weekly_change,
                monthly_change=latest.monthly_change,
            )

            await ConnectedAccountRepository.update_from_late_api(
                session=session,
                account=account,
                followers_count=latest.follower_count,
            )

            await session.commit()

            logger.info(
                "Follower stats synced",
                account_id=account_id,
                follower_count=latest.follower_count,
                daily_change=daily_change,
            )

            return AnalyticsService._follower_stats_to_dict(follower_stats)

        except LateApiError as e:
            logger.error(
                "Failed to sync follower stats",
                account_id=account_id,
                error=str(e),
            )
            return None

        finally:
            await client.close()

    @staticmethod
    async def sync_all_follower_stats(
        session: AsyncSession,
    ) -> dict:
        """
        Sync follower stats for all active accounts

        Called by daily background job
        """
        accounts = await ConnectedAccountRepository.get_all_active(session)

        synced = 0
        failed = 0

        for account in accounts:
            try:
                result = await AnalyticsService.sync_follower_stats(
                    session, account.id
                )
                if result:
                    synced += 1
            except Exception as e:
                logger.error(
                    "Follower sync failed",
                    account_id=account.id,
                    error=str(e),
                )
                failed += 1

        logger.info(
            "Follower stats sync complete",
            synced=synced,
            failed=failed,
        )

        return {
            "synced": synced,
            "failed": failed,
        }

    @staticmethod
    async def get_overview(
        session: AsyncSession,
        days: int = 30,
    ) -> dict:
        """
        Get analytics overview dashboard data
        """
        post_stats = await PostAnalyticsRepository.get_aggregated_stats(
            session=session,
            days=days,
        )

        follower_totals = await FollowerStatsRepository.get_total_followers(session)

        posts_by_platform = await ScheduledPostRepository.count_by_platform(
            session=session,
            status=ScheduleStatus.PUBLISHED,
        )

        posts_by_status = await ScheduledPostRepository.count_by_status(session)

        return {
            "period_days": days,
            "post_metrics": post_stats,
            "total_followers_by_platform": {
                k.value: v for k, v in follower_totals.items()
            },
            "posts_by_platform": {
                k.value: v for k, v in posts_by_platform.items()
            },
            "posts_by_status": {
                k.value: v for k, v in posts_by_status.items()
            },
        }

    @staticmethod
    async def get_top_performers(
        session: AsyncSession,
        platform: PlatformType | None = None,
        days: int = 30,
        limit: int = 10,
    ) -> list[dict]:
        """
        Get top performing posts
        """
        analytics = await PostAnalyticsRepository.get_top_performers(
            session=session,
            platform=platform,
            days=days,
            limit=limit,
        )

        return [AnalyticsService._analytics_to_dict(a) for a in analytics]

    @staticmethod
    async def get_follower_growth(
        session: AsyncSession,
        account_id: UUID,
        days: int = 30,
    ) -> dict:
        """
        Get follower growth data for account
        """
        stats = await FollowerStatsRepository.get_by_account(
            session=session,
            connected_account_id=account_id,
            limit=days,
        )

        growth = await FollowerStatsRepository.calculate_growth(
            session=session,
            connected_account_id=account_id,
            days=days,
        )

        return {
            "account_id": str(account_id),
            "period_days": days,
            "growth": growth,
            "history": [AnalyticsService._follower_stats_to_dict(s) for s in stats],
        }

    @staticmethod
    async def calculate_best_times(
        session: AsyncSession,
        platform: PlatformType | None = None,
        days: int = 90,
    ) -> dict:
        """
        Calculate best posting times based on engagement

        Returns heatmap data by day of week and hour
        """
        analytics = await PostAnalyticsRepository.get_multi(
            session=session,
            platform=platform,
            from_date=datetime.now(UTC) - timedelta(days=days),
            limit=1000,
        )

        heatmap: dict[int, dict[int, list[float]]] = defaultdict(
            lambda: defaultdict(list)
        )

        for a in analytics:
            if hasattr(a, "scheduled_post") and a.scheduled_post:
                post_time = a.scheduled_post.scheduled_for
                day_of_week = post_time.weekday()
                hour = post_time.hour
                heatmap[day_of_week][hour].append(a.engagement_rate)

        result = {}
        for day in range(7):
            result[day] = {}
            for hour in range(24):
                rates = heatmap[day][hour]
                result[day][hour] = {
                    "avg_engagement": sum(rates) / len(rates) if rates else 0,
                    "post_count": len(rates),
                }

        best_times = []
        for day, hours in result.items():
            for hour, data in hours.items():
                if data["post_count"] >= 3:
                    best_times.append({
                        "day": day,
                        "hour": hour,
                        "avg_engagement": data["avg_engagement"],
                        "post_count": data["post_count"],
                    })

        best_times.sort(key=lambda x: x["avg_engagement"], reverse=True)

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        return {
            "heatmap": result,
            "top_times": [
                {
                    "day_name": day_names[t["day"]],
                    "hour": t["hour"],
                    "avg_engagement": round(t["avg_engagement"], 4),
                    "post_count": t["post_count"],
                }
                for t in best_times[:10]
            ],
        }

    @staticmethod
    def _analytics_to_dict(analytics: PostAnalytics) -> dict:
        """
        Convert analytics to dict
        """
        result = {
            "id": str(analytics.id),
            "scheduled_post_id": str(analytics.scheduled_post_id),
            "platform": analytics.platform.value,
            "views": analytics.views,
            "likes": analytics.likes,
            "comments": analytics.comments,
            "shares": analytics.shares,
            "saves": analytics.saves,
            "clicks": analytics.clicks,
            "impressions": analytics.impressions,
            "reach": analytics.reach,
            "engagement_rate": analytics.engagement_rate,
            "watch_time_seconds": analytics.watch_time_seconds,
            "avg_watch_percentage": analytics.avg_watch_percentage,
            "synced_at": analytics.synced_at.isoformat(),
        }

        if hasattr(analytics, "scheduled_post") and analytics.scheduled_post:
            post = analytics.scheduled_post
            result["post"] = {
                "id": str(post.id),
                "scheduled_for": post.scheduled_for.isoformat(),
                "published_at": post.published_at.isoformat() if post.published_at else None,
            }

            if hasattr(post, "content_library_item") and post.content_library_item:
                result["post"]["title"] = post.content_library_item.title
                result["post"]["body_preview"] = (
                    post.content_library_item.body[:100]
                    if post.content_library_item.body else None
                )

        return result

    @staticmethod
    def _follower_stats_to_dict(stats: FollowerStats) -> dict:
        """
        Convert follower stats to dict
        """
        return {
            "id": str(stats.id),
            "connected_account_id": str(stats.connected_account_id),
            "platform": stats.platform.value,
            "recorded_date": stats.recorded_date.isoformat(),
            "follower_count": stats.follower_count,
            "following_count": stats.following_count,
            "posts_count": stats.posts_count,
            "daily_change": stats.daily_change,
            "weekly_change": stats.weekly_change,
            "monthly_change": stats.monthly_change,
        }
