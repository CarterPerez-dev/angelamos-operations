"""
ⒸAngelaMos | 2025
analytics.py
"""

from datetime import datetime, timedelta, UTC
from uuid import UUID

from fastapi import APIRouter

from core.security.auth.dependencies import CurrentUser, DBSession
from core.enums import PlatformType
from core.foundation.logging import get_logger

from aspects.content_studio.shared.services.analytics_service import AnalyticsService
from aspects.content_studio.shared.repositories.analytics import (
    PostAnalyticsRepository,
)
from aspects.content_studio.shared.schemas.scheduler import (
    PostAnalyticsResponse,
    FollowerGrowthResponse,
    FollowerStatsResponse,
    FollowerStatsCreate,
    FollowerStatsBulkCreate,
    AnalyticsOverviewResponse,
    BestTimesResponse,
    SyncResponse,
)
from aspects.content_studio.shared.repositories.follower_stats import (
    FollowerStatsRepository,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_overview(
    db: DBSession,
    current_user: CurrentUser = None,
    days: int = 30,
) -> AnalyticsOverviewResponse:
    """
    Get analytics dashboard overview
    """
    result = await AnalyticsService.get_overview(db, days)
    return AnalyticsOverviewResponse(**result)


@router.get("/posts", response_model=list[PostAnalyticsResponse])
async def list_post_analytics(
    db: DBSession,
    current_user: CurrentUser = None,
    platform: PlatformType | None = None,
    days: int = 30,
    skip: int = 0,
    limit: int = 50,
) -> list[PostAnalyticsResponse]:
    """
    Get post analytics with filters
    """
    from_date = datetime.now(UTC) - timedelta(days=days)

    analytics = await PostAnalyticsRepository.get_multi(
        session=db,
        platform=platform,
        from_date=from_date,
        skip=skip,
        limit=limit,
    )

    return [
        PostAnalyticsResponse(
            id=a.id,
            scheduled_post_id=a.scheduled_post_id,
            platform=a.platform,
            views=a.views,
            likes=a.likes,
            comments=a.comments,
            shares=a.shares,
            saves=a.saves,
            clicks=a.clicks,
            impressions=a.impressions,
            reach=a.reach,
            engagement_rate=a.engagement_rate,
            watch_time_seconds=a.watch_time_seconds,
            avg_watch_percentage=a.avg_watch_percentage,
            synced_at=a.synced_at,
        )
        for a in analytics
    ]


@router.get("/posts/top", response_model=list[PostAnalyticsResponse])
async def get_top_performers(
    db: DBSession,
    current_user: CurrentUser = None,
    platform: PlatformType | None = None,
    days: int = 30,
    limit: int = 10,
) -> list[PostAnalyticsResponse]:
    """
    Get top performing posts
    """
    result = await AnalyticsService.get_top_performers(
        session=db,
        platform=platform,
        days=days,
        limit=limit,
    )

    return [PostAnalyticsResponse(**a) for a in result]


@router.get("/posts/{post_id}", response_model=PostAnalyticsResponse | None)
async def get_post_analytics(
    post_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> PostAnalyticsResponse | None:
    """
    Get analytics for single post
    """
    analytics = await PostAnalyticsRepository.get_by_scheduled_post(db, post_id)

    if not analytics:
        return None

    return PostAnalyticsResponse(
        id=analytics.id,
        scheduled_post_id=analytics.scheduled_post_id,
        platform=analytics.platform,
        views=analytics.views,
        likes=analytics.likes,
        comments=analytics.comments,
        shares=analytics.shares,
        saves=analytics.saves,
        clicks=analytics.clicks,
        impressions=analytics.impressions,
        reach=analytics.reach,
        engagement_rate=analytics.engagement_rate,
        watch_time_seconds=analytics.watch_time_seconds,
        avg_watch_percentage=analytics.avg_watch_percentage,
        synced_at=analytics.synced_at,
    )


@router.get("/best-times", response_model=BestTimesResponse)
async def get_best_times(
    db: DBSession,
    current_user: CurrentUser = None,
    platform: PlatformType | None = None,
    days: int = 90,
) -> BestTimesResponse:
    """
    Get best posting times based on engagement
    """
    result = await AnalyticsService.calculate_best_times(
        session=db,
        platform=platform,
        days=days,
    )

    return BestTimesResponse(**result)


@router.get("/followers/history", response_model=list[FollowerStatsResponse])
async def get_all_follower_history(
    db: DBSession,
    current_user: CurrentUser = None,
    days: int = 30,
) -> list[FollowerStatsResponse]:
    """
    Get follower history for all accounts (for grid view)
    """
    from_date = datetime.now(UTC) - timedelta(days=days)
    stats = await FollowerStatsRepository.get_all_since(db, from_date)

    return [
        FollowerStatsResponse(
            id=s.id,
            connected_account_id=s.connected_account_id,
            platform=s.platform,
            recorded_date=s.recorded_date,
            follower_count=s.follower_count,
            following_count=s.following_count,
            posts_count=s.posts_count,
            daily_change=s.daily_change,
            weekly_change=s.weekly_change,
            monthly_change=s.monthly_change,
        )
        for s in stats
    ]


@router.get("/followers/{account_id}", response_model=FollowerGrowthResponse)
async def get_follower_growth(
    account_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
    days: int = 30,
) -> FollowerGrowthResponse:
    """
    Get follower growth data for account
    """
    result = await AnalyticsService.get_follower_growth(
        session=db,
        account_id=account_id,
        days=days,
    )

    return FollowerGrowthResponse(**result)


@router.post("/sync", response_model=SyncResponse)
async def sync_all_analytics(
    db: DBSession,
    current_user: CurrentUser = None,
    days: int = 7,
) -> SyncResponse:
    """
    Sync analytics for all published posts
    """
    result = await AnalyticsService.sync_all_published(db, days)
    return SyncResponse(**result)


@router.post("/sync/post/{post_id}")
async def sync_post_analytics(
    post_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> dict:
    """
    Sync analytics for single post
    """
    result = await AnalyticsService.sync_post_analytics(db, post_id)

    if not result:
        return {"status": "skipped", "reason": "Post not published or no Late post ID"}

    return {"status": "synced", "analytics": result}


@router.post("/sync/followers", response_model=SyncResponse)
async def sync_follower_stats(
    db: DBSession,
    current_user: CurrentUser = None,
) -> SyncResponse:
    """
    Sync follower stats for all accounts
    """
    result = await AnalyticsService.sync_all_follower_stats(db)
    return SyncResponse(**result)


@router.post("/followers/record", response_model=FollowerStatsResponse)
async def record_follower_stats(
    data: FollowerStatsCreate,
    db: DBSession,
    current_user: CurrentUser = None,
) -> FollowerStatsResponse:
    """
    Manually record follower count for an account (upsert by date)
    """
    from aspects.content_studio.shared.repositories.connected_account import (
        ConnectedAccountRepository,
    )

    account = await ConnectedAccountRepository.get_by_id(db, data.connected_account_id)
    if not account:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    recorded_date = data.recorded_date or datetime.now(UTC)

    stat = await FollowerStatsRepository.upsert(
        session=db,
        connected_account_id=data.connected_account_id,
        platform=account.platform,
        recorded_date=recorded_date,
        follower_count=data.follower_count,
    )
    await db.commit()

    return FollowerStatsResponse(
        id=stat.id,
        connected_account_id=stat.connected_account_id,
        platform=stat.platform,
        recorded_date=stat.recorded_date,
        follower_count=stat.follower_count,
        following_count=stat.following_count,
        posts_count=stat.posts_count,
        daily_change=stat.daily_change,
        weekly_change=stat.weekly_change,
        monthly_change=stat.monthly_change,
    )


@router.post("/followers/record/bulk", response_model=list[FollowerStatsResponse])
async def record_follower_stats_bulk(
    data: FollowerStatsBulkCreate,
    db: DBSession,
    current_user: CurrentUser = None,
) -> list[FollowerStatsResponse]:
    """
    Bulk record follower counts for multiple accounts
    """
    from aspects.content_studio.shared.repositories.connected_account import (
        ConnectedAccountRepository,
    )

    results = []
    for stat_data in data.stats:
        account = await ConnectedAccountRepository.get_by_id(
            db, stat_data.connected_account_id
        )
        if not account:
            continue

        recorded_date = stat_data.recorded_date or datetime.now(UTC)

        stat = await FollowerStatsRepository.upsert(
            session=db,
            connected_account_id=stat_data.connected_account_id,
            platform=account.platform,
            recorded_date=recorded_date,
            follower_count=stat_data.follower_count,
        )
        results.append(stat)

    await db.commit()

    return [
        FollowerStatsResponse(
            id=s.id,
            connected_account_id=s.connected_account_id,
            platform=s.platform,
            recorded_date=s.recorded_date,
            follower_count=s.follower_count,
            following_count=s.following_count,
            posts_count=s.posts_count,
            daily_change=s.daily_change,
            weekly_change=s.weekly_change,
            monthly_change=s.monthly_change,
        )
        for s in results
    ]
