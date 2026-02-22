"""
ⒸAngelaMos | 2026
schemas.py
"""

from datetime import date

from pydantic import Field

from core.foundation.schemas.base import BaseSchema, BaseResponseSchema


class TikTokVideoCreate(BaseSchema):
    """
    Schema for creating a TikTok video record
    """
    rank: int = Field(ge = 1)
    date_posted: date
    video_url: str | None = Field(default = None, max_length = 500)

    views: int = Field(ge = 0)
    comments: int = Field(ge = 0)
    likes: int = Field(ge = 0)
    bookmarks: int = Field(ge = 0)
    shares: int = Field(ge = 0)
    avg_watch_time: float = Field(ge = 0.0)
    new_followers: int = Field(ge = 0)
    watched_full_video_percentage: float = Field(ge = 0.0, le = 100.0)

    top_comment_words: dict[str, int] | None = None
    search_queries: dict[str, float] | None = None
    traffic_sources: dict[str, float] | None = None

    hook: str = Field(min_length = 1)
    text_on_screen_hook: str | None = None
    length: float = Field(gt = 0.0)
    description: str = Field(min_length = 1)
    hashtags: list[str] | None = None
    cta: str | None = None
    full_transcription: str | None = None
    notes: str | None = None


class TikTokVideoUpdate(BaseSchema):
    """
    Schema for updating a TikTok video record
    """
    rank: int | None = Field(default = None, ge = 1)
    date_posted: date | None = None
    video_url: str | None = Field(default = None, max_length = 500)

    views: int | None = Field(default = None, ge = 0)
    comments: int | None = Field(default = None, ge = 0)
    likes: int | None = Field(default = None, ge = 0)
    bookmarks: int | None = Field(default = None, ge = 0)
    shares: int | None = Field(default = None, ge = 0)
    avg_watch_time: float | None = Field(default = None, ge = 0.0)
    new_followers: int | None = Field(default = None, ge = 0)
    watched_full_video_percentage: float | None = Field(
        default = None,
        ge = 0.0,
        le = 100.0
    )

    top_comment_words: dict[str, int] | None = None
    search_queries: dict[str, float] | None = None
    traffic_sources: dict[str, float] | None = None

    hook: str | None = Field(default = None, min_length = 1)
    text_on_screen_hook: str | None = None
    length: float | None = Field(default = None, gt = 0.0)
    description: str | None = Field(default = None, min_length = 1)
    hashtags: list[str] | None = None
    cta: str | None = None
    full_transcription: str | None = None
    notes: str | None = None


class TikTokVideoResponse(BaseResponseSchema):
    """
    Schema for TikTok video response
    """
    rank: int
    date_posted: date
    video_url: str | None

    views: int
    comments: int
    likes: int
    bookmarks: int
    shares: int
    avg_watch_time: float
    new_followers: int
    watched_full_video_percentage: float

    top_comment_words: dict[str, int] | None
    search_queries: dict[str, float] | None
    traffic_sources: dict[str, float] | None

    hook: str
    text_on_screen_hook: str | None
    length: float
    description: str
    hashtags: list[str] | None
    cta: str | None
    full_transcription: str | None
    notes: str | None


class TikTokVideoListResponse(BaseSchema):
    """
    Schema for list of TikTok videos with pagination
    """
    items: list[TikTokVideoResponse]
    total: int
    page: int
    page_size: int
