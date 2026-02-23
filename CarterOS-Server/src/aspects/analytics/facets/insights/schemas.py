"""
ⒸAngelaMos | 2026
schemas.py
"""

from pydantic import BaseModel


class VideoPerformance(BaseModel):
    """Individual video performance metrics"""
    id: str
    rank: int
    hook: str
    views: int
    engagement_rate: float
    follower_conversion_rate: float
    avg_watch_time: float
    watched_full_video_percentage: float
    date_posted: str


class PerformanceRankingsResponse(BaseModel):
    """Rankings by different metrics"""
    by_views: list[VideoPerformance]
    by_engagement_rate: list[VideoPerformance]
    by_follower_conversion: list[VideoPerformance]
    by_watch_time: list[VideoPerformance]


class HookAnalysis(BaseModel):
    """Hook effectiveness metrics"""
    hook: str
    video_count: int
    avg_views: float
    avg_watch_time: float
    avg_engagement_rate: float
    total_views: int


class HookInsightsResponse(BaseModel):
    """Hook effectiveness analysis"""
    top_hooks: list[HookAnalysis]
    total_unique_hooks: int


class CTAAnalysis(BaseModel):
    """CTA performance metrics"""
    cta: str
    video_count: int
    avg_shares: float
    avg_new_followers: float
    avg_engagement_rate: float
    total_shares: int
    total_followers: int


class CTAInsightsResponse(BaseModel):
    """CTA performance comparison"""
    top_ctas: list[CTAAnalysis]
    total_unique_ctas: int


class TrafficSourceData(BaseModel):
    """Traffic source distribution"""
    source: str
    percentage: float
    video_count: int


class TrafficSourceInsightsResponse(BaseModel):
    """Traffic source breakdown"""
    sources: list[TrafficSourceData]


class SearchQueryData(BaseModel):
    """Search query performance"""
    query: str
    percentage: float
    video_count: int


class SearchQueryInsightsResponse(BaseModel):
    """Search query trends"""
    queries: list[SearchQueryData]


class CommentWordData(BaseModel):
    """Comment word frequency"""
    word: str
    count: int
    video_count: int


class CommentWordInsightsResponse(BaseModel):
    """Comment word cloud data"""
    words: list[CommentWordData]


class TimeSeriesDataPoint(BaseModel):
    """Single time series data point"""
    date: str
    views: int
    engagement_rate: float
    new_followers: int
    video_count: int


class TimeSeriesInsightsResponse(BaseModel):
    """Performance over time"""
    data_points: list[TimeSeriesDataPoint]
    date_range: tuple[str, str]


class VideoLengthRangeData(BaseModel):
    """Video length range performance"""
    range_label: str  # "0:30-1:00", "1:00-1:30", etc.
    min_seconds: int
    max_seconds: int
    video_count: int
    avg_views: float
    avg_engagement_rate: float
    avg_watch_percentage: float


class VideoLengthInsightsResponse(BaseModel):
    """Top performing video length ranges"""
    ranges: list[VideoLengthRangeData]


class HashtagPerformance(BaseModel):
    """Hashtag performance metrics"""
    hashtag: str
    video_count: int
    avg_views: float
    avg_engagement_rate: float
    total_views: int


class HashtagInsightsResponse(BaseModel):
    """Best hashtag combinations"""
    top_hashtags: list[HashtagPerformance]
    total_unique_hashtags: int


class PostingTimeData(BaseModel):
    """Posting time performance"""
    day_of_week: str
    hour_of_day: int | None
    video_count: int
    avg_views: float
    avg_engagement_rate: float


class PostingTimeInsightsResponse(BaseModel):
    """Optimal posting times"""
    by_day: list[PostingTimeData]
    by_hour: list[PostingTimeData]


class OverviewMetrics(BaseModel):
    """Overall analytics summary"""
    total_videos: int
    total_views: int
    total_likes: int
    total_comments: int
    total_shares: int
    total_bookmarks: int
    total_new_followers: int
    avg_engagement_rate: float
    avg_watch_time: float
    avg_watch_percentage: float
    date_range: tuple[str, str]


class OverviewInsightsResponse(BaseModel):
    """High-level overview of all metrics"""
    metrics: OverviewMetrics
    top_video: VideoPerformance | None
    recent_trend: str  # "improving", "declining", "stable"


class ExportDataResponse(BaseModel):
    """Complete data export"""
    videos: list[dict]
    total_count: int
    export_date: str
