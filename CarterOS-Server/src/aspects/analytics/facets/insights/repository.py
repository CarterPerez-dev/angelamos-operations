"""
ⒸAngelaMos | 2026
repository.py
"""

from collections import defaultdict
from datetime import date
from collections.abc import Sequence

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.analytics.facets.data_input.models import TikTokVideo


class InsightsRepository:
    """
    Repository for analytics insights calculations
    """
    @staticmethod
    async def get_all_videos(
        session: AsyncSession
    ) -> Sequence[TikTokVideo]:
        """Get all videos for analysis"""
        result = await session.execute(
            select(TikTokVideo).order_by(TikTokVideo.date_posted.desc())
        )
        return result.scalars().all()

    @staticmethod
    def calculate_engagement_rate(video: TikTokVideo) -> float:
        """Calculate engagement rate for a video"""
        if video.views == 0:
            return 0.0
        total_engagement = video.likes + video.comments + video.shares + video.bookmarks
        return (total_engagement / video.views) * 100

    @staticmethod
    def calculate_follower_conversion_rate(video: TikTokVideo) -> float:
        """Calculate follower conversion rate"""
        if video.views == 0:
            return 0.0
        return (video.new_followers / video.views) * 100

    @staticmethod
    def convert_length_to_seconds(length: float) -> int:
        """Convert TikTok format length to seconds (1.32 -> 92 seconds)"""
        minutes = int(length)
        seconds = int((length % 1) * 100)
        return minutes * 60 + seconds

    @staticmethod
    def get_length_range_label(seconds: int) -> str:
        """Get human-readable length range label"""
        ranges = [
            (30,
             "0:00-0:30"),
            (60,
             "0:30-1:00"),
            (90,
             "1:00-1:30"),
            (120,
             "1:30-2:00"),
            (150,
             "2:00-2:30"),
            (180,
             "2:30-3:00"),
        ]
        for max_sec, label in ranges:
            if seconds <= max_sec:
                return label
        return "3:00+"

    @staticmethod
    def get_day_of_week(date_posted: date) -> str:
        """Get day of week from date"""
        return date_posted.strftime("%A")

    @staticmethod
    async def get_overview_metrics(session: AsyncSession) -> dict:
        """Calculate overall performance metrics"""
        result = await session.execute(
            select(
                func.count(TikTokVideo.id).label("total_videos"),
                func.sum(TikTokVideo.views).label("total_views"),
                func.sum(TikTokVideo.likes).label("total_likes"),
                func.sum(TikTokVideo.comments).label("total_comments"),
                func.sum(TikTokVideo.shares).label("total_shares"),
                func.sum(TikTokVideo.bookmarks).label("total_bookmarks"),
                func.sum(TikTokVideo.new_followers
                         ).label("total_new_followers"),
                func.avg(TikTokVideo.avg_watch_time
                         ).label("avg_watch_time"),
                func.avg(TikTokVideo.watched_full_video_percentage
                         ).label("avg_watch_percentage"),
                func.min(TikTokVideo.date_posted).label("min_date"),
                func.max(TikTokVideo.date_posted).label("max_date"),
            )
        )
        row = result.one()
        return {
            "total_videos": row.total_videos or 0,
            "total_views": row.total_views or 0,
            "total_likes": row.total_likes or 0,
            "total_comments": row.total_comments or 0,
            "total_shares": row.total_shares or 0,
            "total_bookmarks": row.total_bookmarks or 0,
            "total_new_followers": row.total_new_followers or 0,
            "avg_watch_time": float(row.avg_watch_time or 0),
            "avg_watch_percentage": float(row.avg_watch_percentage or 0),
            "min_date": row.min_date,
            "max_date": row.max_date,
        }

    @classmethod
    async def aggregate_hook_performance(cls,
                                         session: AsyncSession
                                         ) -> dict[str,
                                                   dict]:
        """Aggregate performance metrics by hook"""
        videos = await cls.get_all_videos(session)

        hook_stats = defaultdict(
            lambda: {
                "videos": [],
                "total_views": 0,
                "total_watch_time": 0,
                "total_engagement": 0,}
        )

        for video in videos:
            hook = video.hook
            engagement_rate = cls.calculate_engagement_rate(video)

            hook_stats[hook]["videos"].append(video)
            hook_stats[hook]["total_views"] += video.views
            hook_stats[hook]["total_watch_time"] += video.avg_watch_time
            hook_stats[hook]["total_engagement"] += engagement_rate

        # Calculate averages
        result = {}
        for hook, stats in hook_stats.items():
            count = len(stats["videos"])
            result[hook] = {
                "video_count": count,
                "avg_views": stats["total_views"] / count,
                "avg_watch_time": stats["total_watch_time"] / count,
                "avg_engagement_rate": stats["total_engagement"] / count,
                "total_views": stats["total_views"],
            }

        return result

    @classmethod
    async def aggregate_cta_performance(cls,
                                        session: AsyncSession
                                        ) -> dict[str,
                                                  dict]:
        """Aggregate performance metrics by CTA"""
        videos = await cls.get_all_videos(session)

        cta_stats = defaultdict(
            lambda: {
                "videos": [],
                "total_shares": 0,
                "total_followers": 0,
                "total_engagement": 0,}
        )

        for video in videos:
            if not video.cta:
                continue

            cta = video.cta
            engagement_rate = cls.calculate_engagement_rate(video)

            cta_stats[cta]["videos"].append(video)
            cta_stats[cta]["total_shares"] += video.shares
            cta_stats[cta]["total_followers"] += video.new_followers
            cta_stats[cta]["total_engagement"] += engagement_rate

        # Calculate averages
        result = {}
        for cta, stats in cta_stats.items():
            count = len(stats["videos"])
            result[cta] = {
                "video_count": count,
                "avg_shares": stats["total_shares"] / count,
                "avg_new_followers": stats["total_followers"] / count,
                "avg_engagement_rate": stats["total_engagement"] / count,
                "total_shares": stats["total_shares"],
                "total_followers": stats["total_followers"],
            }

        return result

    @classmethod
    async def aggregate_hashtag_performance(cls,
                                            session: AsyncSession
                                            ) -> dict[str,
                                                      dict]:
        """Aggregate performance metrics by hashtag"""
        videos = await cls.get_all_videos(session)

        hashtag_stats = defaultdict(
            lambda: {
                "videos": [],
                "total_views": 0,
                "total_engagement": 0,}
        )

        for video in videos:
            if not video.hashtags:
                continue

            for hashtag in video.hashtags:
                engagement_rate = cls.calculate_engagement_rate(video)

                hashtag_stats[hashtag]["videos"].append(video)
                hashtag_stats[hashtag]["total_views"] += video.views
                hashtag_stats[hashtag]["total_engagement"
                                       ] += engagement_rate

        # Calculate averages
        result = {}
        for hashtag, stats in hashtag_stats.items():
            count = len(stats["videos"])
            result[hashtag] = {
                "video_count": count,
                "avg_views": stats["total_views"] / count,
                "avg_engagement_rate": stats["total_engagement"] / count,
                "total_views": stats["total_views"],
            }

        return result

    @classmethod
    async def aggregate_traffic_sources(cls,
                                        session: AsyncSession
                                        ) -> dict[str,
                                                  dict]:
        """Aggregate traffic source data"""
        videos = await cls.get_all_videos(session)

        source_stats = defaultdict(
            lambda: {
                "total_percentage": 0.0, "video_count": 0
            }
        )

        for video in videos:
            if not video.traffic_sources:
                continue

            for source, percentage in video.traffic_sources.items():
                source_stats[source]["total_percentage"] += percentage
                source_stats[source]["video_count"] += 1

        # Calculate averages
        result = {}
        for source, stats in source_stats.items():
            count = stats["video_count"]
            result[source] = {
                "avg_percentage": stats["total_percentage"] / count,
                "video_count": count,
            }

        return result

    @classmethod
    async def aggregate_search_queries(cls,
                                       session: AsyncSession
                                       ) -> dict[str,
                                                 dict]:
        """Aggregate search query data"""
        videos = await cls.get_all_videos(session)

        query_stats = defaultdict(
            lambda: {
                "total_percentage": 0.0, "video_count": 0
            }
        )

        for video in videos:
            if not video.search_queries:
                continue

            for query, percentage in video.search_queries.items():
                query_stats[query]["total_percentage"] += percentage
                query_stats[query]["video_count"] += 1

        # Calculate averages
        result = {}
        for query, stats in query_stats.items():
            count = stats["video_count"]
            result[query] = {
                "avg_percentage": stats["total_percentage"] / count,
                "video_count": count,
            }

        return result

    @classmethod
    async def aggregate_comment_words(cls,
                                      session: AsyncSession) -> dict[str,
                                                                     dict]:
        """Aggregate comment word frequency"""
        videos = await cls.get_all_videos(session)

        word_stats = defaultdict(
            lambda: {
                "total_count": 0, "video_count": 0
            }
        )

        for video in videos:
            if not video.top_comment_words:
                continue

            for word, count in video.top_comment_words.items():
                word_stats[word]["total_count"] += count
                word_stats[word]["video_count"] += 1

        # Return totals
        return {
            word: {
                "count": stats["total_count"],
                "video_count": stats["video_count"],
            }
            for word, stats in word_stats.items()
        }

    @classmethod
    async def aggregate_by_length_range(cls,
                                        session: AsyncSession
                                        ) -> dict[str,
                                                  dict]:
        """Aggregate performance by video length ranges"""
        videos = await cls.get_all_videos(session)

        range_stats = defaultdict(
            lambda: {
                "videos": [],
                "total_views": 0,
                "total_engagement": 0,
                "total_watch_percentage": 0,}
        )

        for video in videos:
            seconds = cls.convert_length_to_seconds(video.length)
            range_label = cls.get_length_range_label(seconds)
            engagement_rate = cls.calculate_engagement_rate(video)

            range_stats[range_label]["videos"].append(video)
            range_stats[range_label]["total_views"] += video.views
            range_stats[range_label]["total_engagement"] += engagement_rate
            range_stats[range_label
                        ]["total_watch_percentage"
                          ] += video.watched_full_video_percentage

        # Calculate averages and add min/max seconds
        result = {}
        for range_label, stats in range_stats.items():
            count = len(stats["videos"])
            # Extract min/max from range label (e.g., "1:00-1:30" -> 60, 90)
            if range_label == "3:00+":
                min_sec, max_sec = 180, 999
            else:
                parts = range_label.split("-")
                min_sec = sum(
                    int(x) * 60**i
                    for i, x in enumerate(reversed(parts[0].split(":")))
                )
                max_sec = sum(
                    int(x) * 60**i
                    for i, x in enumerate(reversed(parts[1].split(":")))
                )

            result[range_label] = {
                "min_seconds":
                min_sec,
                "max_seconds":
                max_sec,
                "video_count":
                count,
                "avg_views":
                stats["total_views"] / count,
                "avg_engagement_rate":
                stats["total_engagement"] / count,
                "avg_watch_percentage":
                stats["total_watch_percentage"] / count,
            }

        return result

    @classmethod
    async def aggregate_by_posting_time(
        cls,
        session: AsyncSession
    ) -> dict:
        """Aggregate performance by posting day of week"""
        videos = await cls.get_all_videos(session)

        day_stats = defaultdict(
            lambda: {
                "videos": [],
                "total_views": 0,
                "total_engagement": 0,}
        )

        for video in videos:
            day = cls.get_day_of_week(video.date_posted)
            engagement_rate = cls.calculate_engagement_rate(video)

            day_stats[day]["videos"].append(video)
            day_stats[day]["total_views"] += video.views
            day_stats[day]["total_engagement"] += engagement_rate

        # Calculate averages
        result = {}
        for day, stats in day_stats.items():
            count = len(stats["videos"])
            result[day] = {
                "video_count": count,
                "avg_views": stats["total_views"] / count,
                "avg_engagement_rate": stats["total_engagement"] / count,
            }

        return result

    @classmethod
    async def get_time_series_data(cls,
                                   session: AsyncSession) -> list[dict]:
        """Get performance metrics over time"""
        videos = await cls.get_all_videos(session)

        # Group by date
        date_stats = defaultdict(
            lambda: {
                "views": 0,
                "engagement": 0,
                "new_followers": 0,
                "count": 0,}
        )

        for video in videos:
            date_str = video.date_posted.isoformat()
            engagement_rate = cls.calculate_engagement_rate(video)

            date_stats[date_str]["views"] += video.views
            date_stats[date_str]["engagement"] += engagement_rate
            date_stats[date_str]["new_followers"] += video.new_followers
            date_stats[date_str]["count"] += 1

        # Convert to list and calculate averages
        result = []
        for date_str, stats in sorted(date_stats.items()):
            count = stats["count"]
            result.append(
                {
                    "date": date_str,
                    "views": stats["views"],
                    "engagement_rate": stats["engagement"] / count,
                    "new_followers": stats["new_followers"],
                    "video_count": count,
                }
            )

        return result
