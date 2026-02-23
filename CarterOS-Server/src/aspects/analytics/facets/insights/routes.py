"""
ⒸAngelaMos | 2026
routes.py
"""

from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse

from core.security.auth.dependencies import DBSession
from aspects.analytics.facets.insights.service import InsightsService
from aspects.analytics.facets.insights.schemas import (
    OverviewInsightsResponse,
    PerformanceRankingsResponse,
    HookInsightsResponse,
    CTAInsightsResponse,
    TrafficSourceInsightsResponse,
    SearchQueryInsightsResponse,
    CommentWordInsightsResponse,
    VideoLengthInsightsResponse,
    HashtagInsightsResponse,
    PostingTimeInsightsResponse,
    TimeSeriesInsightsResponse,
    ExportDataResponse,
)


router = APIRouter(
    prefix = "/analytics/insights",
    tags = ["Analytics - Insights"]
)


@router.get(
    "/overview",
    response_model = OverviewInsightsResponse,
)
async def get_overview_insights(
    db: DBSession,
) -> OverviewInsightsResponse:
    """
    Get high-level overview of all analytics metrics

    Includes:
    - Total counts and averages
    - Top performing video
    - Performance trend
    """
    return await InsightsService.get_overview_insights(db)


@router.get(
    "/rankings",
    response_model = PerformanceRankingsResponse,
)
async def get_performance_rankings(
    db: DBSession,
    limit: int = Query(default = 10,
                       ge = 1,
                       le = 50),
) -> PerformanceRankingsResponse:
    """
    Get top performing videos ranked by different metrics

    Rankings by:
    - Views
    - Engagement rate
    - Follower conversion
    - Watch time
    """
    return await InsightsService.get_performance_rankings(db, limit)


@router.get(
    "/hooks",
    response_model = HookInsightsResponse,
)
async def get_hook_insights(
    db: DBSession,
    limit: int = Query(default = 10,
                       ge = 1,
                       le = 50),
) -> HookInsightsResponse:
    """
    Analyze hook effectiveness

    Shows which hooks get:
    - Highest average views
    - Best watch time
    - Best engagement rate
    """
    return await InsightsService.get_hook_insights(db, limit)


@router.get(
    "/ctas",
    response_model = CTAInsightsResponse,
)
async def get_cta_insights(
    db: DBSession,
    limit: int = Query(default = 10,
                       ge = 1,
                       le = 50),
) -> CTAInsightsResponse:
    """
    Compare CTA performance

    Shows which CTAs get:
    - Most shares
    - Most new followers
    - Best engagement
    """
    return await InsightsService.get_cta_insights(db, limit)


@router.get(
    "/traffic-sources",
    response_model = TrafficSourceInsightsResponse,
)
async def get_traffic_source_insights(
    db: DBSession,
) -> TrafficSourceInsightsResponse:
    """
    Get traffic source breakdown

    Shows percentage distribution across:
    - For You page
    - Search
    - Profile
    - Other sources
    """
    return await InsightsService.get_traffic_source_insights(db)


@router.get(
    "/search-queries",
    response_model = SearchQueryInsightsResponse,
)
async def get_search_query_insights(
    db: DBSession,
    limit: int = Query(default = 20,
                       ge = 1,
                       le = 100),
) -> SearchQueryInsightsResponse:
    """
    Get search query trends

    Shows which keywords perform best
    """
    return await InsightsService.get_search_query_insights(db, limit)


@router.get(
    "/comment-words",
    response_model = CommentWordInsightsResponse,
)
async def get_comment_word_insights(
    db: DBSession,
    limit: int = Query(default = 50,
                       ge = 1,
                       le = 200),
) -> CommentWordInsightsResponse:
    """
    Get comment word cloud data

    Shows most frequently mentioned words
    in comments across videos
    """
    return await InsightsService.get_comment_word_insights(db, limit)


@router.get(
    "/video-length",
    response_model = VideoLengthInsightsResponse,
)
async def get_video_length_insights(
    db: DBSession,
) -> VideoLengthInsightsResponse:
    """
    Get top performing video length ranges

    Analyzes performance by:
    - 0:30-1:00
    - 1:00-1:30
    - 1:30-2:00
    - etc.
    """
    return await InsightsService.get_video_length_insights(db)


@router.get(
    "/hashtags",
    response_model = HashtagInsightsResponse,
)
async def get_hashtag_insights(
    db: DBSession,
    limit: int = Query(default = 20,
                       ge = 1,
                       le = 100),
) -> HashtagInsightsResponse:
    """
    Get best hashtag performance

    Shows which hashtags get:
    - Most total views
    - Best average performance
    - Most usage
    """
    return await InsightsService.get_hashtag_insights(db, limit)


@router.get(
    "/posting-time",
    response_model = PostingTimeInsightsResponse,
)
async def get_posting_time_insights(
    db: DBSession,
) -> PostingTimeInsightsResponse:
    """
    Get optimal posting times

    Analyzes performance by:
    - Day of week
    - Hour of day (if available)
    """
    return await InsightsService.get_posting_time_insights(db)


@router.get(
    "/time-series",
    response_model = TimeSeriesInsightsResponse,
)
async def get_time_series_insights(
    db: DBSession,
) -> TimeSeriesInsightsResponse:
    """
    Get performance trends over time

    Shows daily metrics:
    - Total views
    - Engagement rate
    - New followers
    - Video count
    """
    return await InsightsService.get_time_series_insights(db)


@router.get(
    "/export",
    response_model = ExportDataResponse,
)
async def export_all_data(
    db: DBSession,
) -> ExportDataResponse:
    """
    Export all video data as JSON

    Includes:
    - All video fields
    - Calculated metrics
    - Export metadata
    """
    return await InsightsService.export_all_data(db)


@router.get(
    "/export/download",
    status_code = status.HTTP_200_OK,
)
async def download_export(
    db: DBSession,
) -> JSONResponse:
    """
    Download exported data as JSON file

    Returns JSON with content-disposition header
    for browser download
    """
    data = await InsightsService.export_all_data(db)

    return JSONResponse(
        content = data.model_dump(),
        headers = {
            "Content-Disposition":
            f'attachment; filename="tiktok-analytics-{data.export_date}.json"'
        }
    )
