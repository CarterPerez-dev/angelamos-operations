"""
ⒸAngelaMos | 2025
models.py
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class LateProfile(BaseModel):
    """
    Late API Profile (container for social accounts)
    """

    id: str = Field(alias="_id")
    name: str
    description: str | None = None
    color: str | None = None
    is_default: bool = Field(default=False, alias="isDefault")
    created_at: datetime = Field(alias="createdAt")

    class Config:
        populate_by_name = True


class LateAccount(BaseModel):
    """
    Late API Connected Account
    """

    id: str = Field(alias="_id")
    platform: str
    username: str
    display_name: str | None = Field(default=None, alias="displayName")
    profile_id: str = Field(alias="profileId")
    profile_image_url: str | None = Field(default=None, alias="profileImageUrl")
    followers_count: int | None = Field(default=None, alias="followersCount")
    followers_last_updated: datetime | None = Field(
        default=None, alias="followersLastUpdated"
    )
    is_connected: bool = Field(default=True, alias="isConnected")
    created_at: datetime | None = Field(default=None, alias="createdAt")

    @field_validator("profile_id", mode="before")
    @classmethod
    def extract_profile_id(cls, v: Any) -> str:
        """
        Late API returns profileId as an object or string
        """
        if isinstance(v, dict):
            return v.get("_id", "")
        return v

    class Config:
        populate_by_name = True


class LateMediaItem(BaseModel):
    """
    Media item for Late API posts
    """

    url: str | None = None
    type: str
    thumbnail: str | None = None
    alt_text: str | None = Field(default=None, alias="altText")
    width: int | None = None
    height: int | None = None
    duration: float | None = None


class LatePlatformTarget(BaseModel):
    """
    Platform target for scheduling
    """

    platform: str
    account_id: str = Field(alias="accountId")
    status: str | None = None
    platform_post_id: str | None = Field(default=None, alias="platformPostId")
    platform_post_url: str | None = Field(default=None, alias="platformPostUrl")
    error: str | None = None
    platform_specific_data: dict[str, Any] | None = Field(
        default=None, alias="platformSpecificData"
    )

    class Config:
        populate_by_name = True


class LatePost(BaseModel):
    """
    Late API Post
    """

    id: str = Field(alias="_id")
    content: str | None = None
    title: str | None = None
    status: str
    scheduled_for: datetime | None = Field(default=None, alias="scheduledFor")
    published_at: datetime | None = Field(default=None, alias="publishedAt")
    timezone: str | None = None
    platforms: list[LatePlatformTarget] = []
    media_items: list[LateMediaItem] = Field(default_factory=list, alias="mediaItems")
    tags: list[str] = []
    hashtags: list[str] = []
    mentions: list[str] = []
    metadata: dict[str, Any] = {}
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime | None = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True


class LatePostCreate(BaseModel):
    """
    Request body for creating a Late post
    """

    content: str | None = None
    title: str | None = None
    media_items: list[LateMediaItem] = Field(default_factory=list, alias="mediaItems")
    platforms: list[LatePlatformTarget]
    scheduled_for: datetime | None = Field(default=None, alias="scheduledFor")
    publish_now: bool = Field(default=False, alias="publishNow")
    is_draft: bool = Field(default=False, alias="isDraft")
    timezone: str | None = None
    tags: list[str] = []
    hashtags: list[str] = []
    mentions: list[str] = []
    metadata: dict[str, Any] = {}
    tiktok_settings: dict[str, Any] | None = Field(
        default=None, alias="tiktokSettings"
    )

    class Config:
        populate_by_name = True


class LatePostUpdate(BaseModel):
    """
    Request body for updating a Late post
    """

    content: str | None = None
    title: str | None = None
    media_items: list[LateMediaItem] | None = Field(default=None, alias="mediaItems")
    scheduled_for: datetime | None = Field(default=None, alias="scheduledFor")
    timezone: str | None = None
    tags: list[str] | None = None
    hashtags: list[str] | None = None
    status: str | None = None

    class Config:
        populate_by_name = True


class LateAnalytics(BaseModel):
    """
    Post analytics from Late API
    """

    post_id: str = Field(alias="postId")
    platform: str
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    impressions: int = 0
    reach: int = 0
    engagement_rate: float = Field(default=0.0, alias="engagementRate")
    watch_time_seconds: float | None = Field(default=None, alias="watchTimeSeconds")
    avg_watch_percentage: float | None = Field(
        default=None, alias="avgWatchPercentage"
    )
    synced_at: datetime = Field(alias="syncedAt")

    class Config:
        populate_by_name = True


class LateFollowerStats(BaseModel):
    """
    Follower statistics from Late API
    """

    account_id: str = Field(alias="accountId")
    platform: str
    date: datetime
    follower_count: int = Field(alias="followerCount")
    following_count: int | None = Field(default=None, alias="followingCount")
    posts_count: int | None = Field(default=None, alias="postsCount")
    daily_change: int | None = Field(default=None, alias="dailyChange")
    weekly_change: int | None = Field(default=None, alias="weeklyChange")
    monthly_change: int | None = Field(default=None, alias="monthlyChange")

    class Config:
        populate_by_name = True


class LateOAuthResponse(BaseModel):
    """
    OAuth URL response from Late API
    """

    auth_url: str = Field(alias="authUrl")


class LatePaginatedResponse(BaseModel):
    """
    Generic paginated response
    """

    items: list[Any] = []
    total: int = 0
    page: int = 1
    limit: int = 50
    has_more: bool = Field(default=False, alias="hasMore")

    class Config:
        populate_by_name = True
