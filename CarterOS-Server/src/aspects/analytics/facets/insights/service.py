"""
ⒸAngelaMos | 2026
service.py
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.analytics.facets.insights.repository import InsightsRepository
from aspects.analytics.facets.insights.schemas import (
    OverviewInsightsResponse,
    OverviewMetrics,
    VideoPerformance,
    PerformanceRankingsResponse,
    HookInsightsResponse,
    HookAnalysis,
    CTAInsightsResponse,
    CTAAnalysis,
    TrafficSourceInsightsResponse,
    TrafficSourceData,
    SearchQueryInsightsResponse,
    SearchQueryData,
    CommentWordInsightsResponse,
    CommentWordData,
    VideoLengthInsightsResponse,
    VideoLengthRangeData,
    HashtagInsightsResponse,
    HashtagPerformance,
    PostingTimeInsightsResponse,
    PostingTimeData,
    TimeSeriesInsightsResponse,
    TimeSeriesDataPoint,
    ExportDataResponse,
)


class InsightsService:
    """
    Service for analytics insights operations
    """
    @staticmethod
    async def get_overview_insights(
        session: AsyncSession,
    ) -> OverviewInsightsResponse:
        """Get high-level overview of all metrics"""
        metrics_data = await InsightsRepository.get_overview_metrics(
            session
        )
        videos = await InsightsRepository.get_all_videos(session)

        # Calculate average engagement rate
        total_engagement_rate = sum(
            InsightsRepository.calculate_engagement_rate(v) for v in videos
        )
        avg_engagement_rate = total_engagement_rate / len(
            videos
        ) if videos else 0.0

        # Find top video
        top_video = None
        if videos:
            top_by_views = max(videos, key = lambda v: v.views)
            top_video = VideoPerformance(
                id = str(top_by_views.id),
                rank = top_by_views.rank,
                hook = top_by_views.hook,
                views = top_by_views.views,
                engagement_rate = InsightsRepository.
                calculate_engagement_rate(top_by_views),
                follower_conversion_rate = InsightsRepository.
                calculate_follower_conversion_rate(top_by_views),
                avg_watch_time = top_by_views.avg_watch_time,
                watched_full_video_percentage = top_by_views.
                watched_full_video_percentage,
                date_posted = top_by_views.date_posted.isoformat(),
            )

        # Determine trend (simple: compare first half vs second half of videos)
        trend = "stable"
        if len(videos) >= 4:
            mid_point = len(videos) // 2
            first_half_avg = sum(
                v.views for v in videos[: mid_point]
            ) / mid_point
            second_half_avg = sum(v.views for v in videos[mid_point :]
                                  ) / (len(videos) - mid_point)

            if second_half_avg > first_half_avg * 1.1:
                trend = "improving"
            elif second_half_avg < first_half_avg * 0.9:
                trend = "declining"

        metrics = OverviewMetrics(
            total_videos = metrics_data["total_videos"],
            total_views = metrics_data["total_views"],
            total_likes = metrics_data["total_likes"],
            total_comments = metrics_data["total_comments"],
            total_shares = metrics_data["total_shares"],
            total_bookmarks = metrics_data["total_bookmarks"],
            total_new_followers = metrics_data["total_new_followers"],
            avg_engagement_rate = avg_engagement_rate,
            avg_watch_time = metrics_data["avg_watch_time"],
            avg_watch_percentage = metrics_data["avg_watch_percentage"],
            date_range = (
                metrics_data["min_date"].isoformat()
                if metrics_data["min_date"] else "",
                metrics_data["max_date"].isoformat()
                if metrics_data["max_date"] else "",
            ),
        )

        return OverviewInsightsResponse(
            metrics = metrics,
            top_video = top_video,
            recent_trend = trend,
        )

    @staticmethod
    async def get_performance_rankings(
        session: AsyncSession,
        limit: int = 10,
    ) -> PerformanceRankingsResponse:
        """Get top performing videos by different metrics"""
        videos = await InsightsRepository.get_all_videos(session)

        def to_video_performance(video) -> VideoPerformance:
            return VideoPerformance(
                id = str(video.id),
                rank = video.rank,
                hook = video.hook,
                views = video.views,
                engagement_rate = InsightsRepository.
                calculate_engagement_rate(video),
                follower_conversion_rate = InsightsRepository.
                calculate_follower_conversion_rate(video),
                avg_watch_time = video.avg_watch_time,
                watched_full_video_percentage = video.
                watched_full_video_percentage,
                date_posted = video.date_posted.isoformat(),
            )

        by_views = sorted(
            videos,
            key = lambda v: v.views,
            reverse = True
        )[: limit]
        by_engagement = sorted(
            videos,
            key = lambda v: InsightsRepository.
            calculate_engagement_rate(v),
            reverse = True
        )[: limit]
        by_followers = sorted(
            videos,
            key = lambda v: InsightsRepository.
            calculate_follower_conversion_rate(v),
            reverse = True
        )[: limit]
        by_watch_time = sorted(
            videos,
            key = lambda v: v.avg_watch_time,
            reverse = True
        )[: limit]

        return PerformanceRankingsResponse(
            by_views = [to_video_performance(v) for v in by_views],
            by_engagement_rate = [
                to_video_performance(v) for v in by_engagement
            ],
            by_follower_conversion = [
                to_video_performance(v) for v in by_followers
            ],
            by_watch_time = [
                to_video_performance(v) for v in by_watch_time
            ],
        )

    @staticmethod
    async def get_hook_insights(
        session: AsyncSession,
        limit: int = 10,
    ) -> HookInsightsResponse:
        """Get hook effectiveness analysis"""
        hook_data = await InsightsRepository.aggregate_hook_performance(
            session
        )

        hooks = [
            HookAnalysis(
                hook = hook,
                video_count = stats["video_count"],
                avg_views = stats["avg_views"],
                avg_watch_time = stats["avg_watch_time"],
                avg_engagement_rate = stats["avg_engagement_rate"],
                total_views = stats["total_views"],
            ) for hook, stats in hook_data.items()
        ]

        # Sort by average views
        hooks.sort(key = lambda h: h.avg_views, reverse = True)

        return HookInsightsResponse(
            top_hooks = hooks[: limit],
            total_unique_hooks = len(hooks),
        )

    @staticmethod
    async def get_cta_insights(
        session: AsyncSession,
        limit: int = 10,
    ) -> CTAInsightsResponse:
        """Get CTA performance analysis"""
        cta_data = await InsightsRepository.aggregate_cta_performance(
            session
        )

        ctas = [
            CTAAnalysis(
                cta = cta,
                video_count = stats["video_count"],
                avg_shares = stats["avg_shares"],
                avg_new_followers = stats["avg_new_followers"],
                avg_engagement_rate = stats["avg_engagement_rate"],
                total_shares = stats["total_shares"],
                total_followers = stats["total_followers"],
            ) for cta, stats in cta_data.items()
        ]

        # Sort by average new followers
        ctas.sort(key = lambda c: c.avg_new_followers, reverse = True)

        return CTAInsightsResponse(
            top_ctas = ctas[: limit],
            total_unique_ctas = len(ctas),
        )

    @staticmethod
    async def get_traffic_source_insights(
        session: AsyncSession,
    ) -> TrafficSourceInsightsResponse:
        """Get traffic source breakdown"""
        source_data = await InsightsRepository.aggregate_traffic_sources(
            session
        )

        sources = [
            TrafficSourceData(
                source = source,
                percentage = stats["avg_percentage"],
                video_count = stats["video_count"],
            ) for source, stats in source_data.items()
        ]

        # Sort by percentage
        sources.sort(key = lambda s: s.percentage, reverse = True)

        return TrafficSourceInsightsResponse(sources = sources)

    @staticmethod
    async def get_search_query_insights(
        session: AsyncSession,
        limit: int = 20,
    ) -> SearchQueryInsightsResponse:
        """Get search query trends"""
        query_data = await InsightsRepository.aggregate_search_queries(
            session
        )

        queries = [
            SearchQueryData(
                query = query,
                percentage = stats["avg_percentage"],
                video_count = stats["video_count"],
            ) for query, stats in query_data.items()
        ]

        # Sort by percentage
        queries.sort(key = lambda q: q.percentage, reverse = True)

        return SearchQueryInsightsResponse(queries = queries[: limit])

    @staticmethod
    async def get_comment_word_insights(
        session: AsyncSession,
        limit: int = 50,
    ) -> CommentWordInsightsResponse:
        """Get comment word cloud data"""
        word_data = await InsightsRepository.aggregate_comment_words(
            session
        )

        words = [
            CommentWordData(
                word = word,
                count = stats["count"],
                video_count = stats["video_count"],
            ) for word, stats in word_data.items()
        ]

        # Sort by count
        words.sort(key = lambda w: w.count, reverse = True)

        return CommentWordInsightsResponse(words = words[: limit])

    @staticmethod
    async def get_video_length_insights(
        session: AsyncSession,
    ) -> VideoLengthInsightsResponse:
        """Get top performing video length ranges"""
        length_data = await InsightsRepository.aggregate_by_length_range(
            session
        )

        ranges = [
            VideoLengthRangeData(
                range_label = range_label,
                min_seconds = stats["min_seconds"],
                max_seconds = stats["max_seconds"],
                video_count = stats["video_count"],
                avg_views = stats["avg_views"],
                avg_engagement_rate = stats["avg_engagement_rate"],
                avg_watch_percentage = stats["avg_watch_percentage"],
            ) for range_label, stats in length_data.items()
        ]

        # Sort by average views
        ranges.sort(key = lambda r: r.avg_views, reverse = True)

        return VideoLengthInsightsResponse(ranges = ranges)

    @staticmethod
    async def get_hashtag_insights(
        session: AsyncSession,
        limit: int = 20,
    ) -> HashtagInsightsResponse:
        """Get best hashtag performance"""
        hashtag_data = await InsightsRepository.aggregate_hashtag_performance(
            session
        )

        hashtags = [
            HashtagPerformance(
                hashtag = hashtag,
                video_count = stats["video_count"],
                avg_views = stats["avg_views"],
                avg_engagement_rate = stats["avg_engagement_rate"],
                total_views = stats["total_views"],
            ) for hashtag, stats in hashtag_data.items()
        ]

        # Sort by total views
        hashtags.sort(key = lambda h: h.total_views, reverse = True)

        return HashtagInsightsResponse(
            top_hashtags = hashtags[: limit],
            total_unique_hashtags = len(hashtags),
        )

    @staticmethod
    async def get_posting_time_insights(
        session: AsyncSession,
    ) -> PostingTimeInsightsResponse:
        """Get optimal posting times"""
        day_data = await InsightsRepository.aggregate_by_posting_time(
            session
        )

        by_day = [
            PostingTimeData(
                day_of_week = day,
                hour_of_day = None,
                video_count = stats["video_count"],
                avg_views = stats["avg_views"],
                avg_engagement_rate = stats["avg_engagement_rate"],
            ) for day, stats in day_data.items()
        ]

        # Sort by average views
        by_day.sort(key = lambda d: d.avg_views, reverse = True)

        # Hour-based analysis not implemented yet (would need time data in model)
        by_hour = []

        return PostingTimeInsightsResponse(
            by_day = by_day,
            by_hour = by_hour,
        )

    @staticmethod
    async def get_time_series_insights(
        session: AsyncSession,
    ) -> TimeSeriesInsightsResponse:
        """Get performance over time"""
        time_series_data = await InsightsRepository.get_time_series_data(
            session
        )

        data_points = [
            TimeSeriesDataPoint(
                date = point["date"],
                views = point["views"],
                engagement_rate = point["engagement_rate"],
                new_followers = point["new_followers"],
                video_count = point["video_count"],
            ) for point in time_series_data
        ]

        date_range = ("", "")
        if data_points:
            date_range = (data_points[0].date, data_points[-1].date)

        return TimeSeriesInsightsResponse(
            data_points = data_points,
            date_range = date_range,
        )

    @staticmethod
    async def export_all_data(
        session: AsyncSession,
    ) -> ExportDataResponse:
        """Export all video data as JSON"""
        videos = await InsightsRepository.get_all_videos(session)

        video_dicts = [
            {
                "id": str(v.id),
                "rank": v.rank,
                "date_posted": v.date_posted.isoformat(),
                "video_url": v.video_url,
                "views": v.views,
                "comments": v.comments,
                "likes": v.likes,
                "bookmarks": v.bookmarks,
                "shares": v.shares,
                "avg_watch_time": v.avg_watch_time,
                "new_followers": v.new_followers,
                "watched_full_video_percentage": v.watched_full_video_percentage,
                "top_comment_words": v.top_comment_words,
                "search_queries": v.search_queries,
                "traffic_sources": v.traffic_sources,
                "hook": v.hook,
                "text_on_screen_hook": v.text_on_screen_hook,
                "length": v.length,
                "description": v.description,
                "hashtags": v.hashtags,
                "cta": v.cta,
                "full_transcription": v.full_transcription,
                "notes": v.notes,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "updated_at": v.updated_at.isoformat() if v.updated_at else None,
                # Calculated fields
                "engagement_rate": InsightsRepository.calculate_engagement_rate(v),
                "follower_conversion_rate": InsightsRepository.calculate_follower_conversion_rate(v),
            }
            for v in videos
        ]

        return ExportDataResponse(
            videos = video_dicts,
            total_count = len(video_dicts),
            export_date = datetime.utcnow().isoformat(),
        )
