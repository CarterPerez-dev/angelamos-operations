"""
ⒸAngelaMos | 2026
models.py
"""

from sqlalchemy import Column, String, Integer, Float, Date, Text
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from core.infrastructure.database.Base import Base, UUIDMixin, TimestampMixin


class TikTokVideo(Base, UUIDMixin, TimestampMixin):
    """
    TikTok video analytics data for performance tracking and content optimization
    """
    __tablename__ = "tiktok_videos"

    rank = Column(Integer, nullable=False)
    date_posted = Column(Date, nullable=False)
    video_url = Column(String(500), nullable=True)

    views = Column(Integer, nullable=False)
    comments = Column(Integer, nullable=False)
    likes = Column(Integer, nullable=False)
    bookmarks = Column(Integer, nullable=False)
    shares = Column(Integer, nullable=False)
    avg_watch_time = Column(Float, nullable=False)
    new_followers = Column(Integer, nullable=False)
    watched_full_video_percentage = Column(Float, nullable=False)

    top_comment_words = Column(JSONB, nullable=True)
    search_queries = Column(JSONB, nullable=True)
    traffic_sources = Column(JSONB, nullable=True)

    hook = Column(Text, nullable=False)
    text_on_screen_hook = Column(Text, nullable=True)
    length = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    hashtags = Column(ARRAY(String), nullable=True)
    cta = Column(Text, nullable=True)
    full_transcription = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
