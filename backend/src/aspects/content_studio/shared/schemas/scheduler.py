"""
ⒸAngelaMos | 2025
scheduler.py
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from core.enums import (
    PlatformType,
    ScheduleStatus,
    LatePostStatus,
    ScheduleMode,
    ContentLibraryType,
    MediaType,
)


class ConnectedAccountResponse(BaseModel):
    """
    Connected social account
    """

    id: UUID
    late_account_id: str
    platform: PlatformType
    platform_username: str
    platform_display_name: str | None = None
    profile_image_url: str | None = None
    followers_count: int | None = None
    is_active: bool
    connected_at: datetime
    last_sync_at: datetime | None = None


class ConnectAccountRequest(BaseModel):
    """
    Request OAuth URL to connect account
    """

    platform: PlatformType
    redirect_url: str | None = None


class ConnectAccountResponse(BaseModel):
    """
    OAuth URL response
    """

    auth_url: str
    platform: PlatformType


class ContentLibraryItemCreate(BaseModel):
    """
    Create content library item request
    """

    content_type: ContentLibraryType
    title: str | None = None
    body: str | None = None
    target_platform: PlatformType | None = None
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    platform_specific_data: dict | None = None
    notes: str | None = None


class ContentLibraryItemUpdate(BaseModel):
    """
    Update content library item request
    """

    title: str | None = None
    body: str | None = None
    target_platform: PlatformType | None = None
    hashtags: list[str] | None = None
    mentions: list[str] | None = None
    tags: list[str] | None = None
    platform_specific_data: dict | None = None
    notes: str | None = None


class MediaAttachmentResponse(BaseModel):
    """
    Media attachment response
    """

    id: UUID
    file_path: str
    file_name: str
    file_size: int
    mime_type: str
    media_type: MediaType
    width: int | None = None
    height: int | None = None
    duration_seconds: float | None = None
    thumbnail_path: str | None = None
    alt_text: str | None = None
    late_media_id: str | None = None
    late_media_url: str | None = None
    display_order: int
    created_at: datetime


class ContentLibraryItemResponse(BaseModel):
    """
    Content library item response
    """

    id: UUID
    title: str | None = None
    body: str | None = None
    content_type: ContentLibraryType
    target_platform: PlatformType | None = None
    hashtags: list[str]
    mentions: list[str]
    tags: list[str]
    workflow_session_id: UUID | None = None
    platform_specific_data: dict | None = None
    notes: str | None = None
    media_attachments: list[MediaAttachmentResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime | None = None


class ContentLibraryListResponse(BaseModel):
    """
    Paginated content library list
    """

    items: list[ContentLibraryItemResponse]
    total: int
    skip: int
    limit: int


class ScheduleAccountConfig(BaseModel):
    """
    Per-account schedule configuration for multi-platform scheduling
    """

    connected_account_id: UUID
    scheduled_for: datetime
    platform_specific_config: dict | None = None


class ScheduleSingleRequest(BaseModel):
    """
    Schedule to single platform request
    """

    content_library_item_id: UUID
    connected_account_id: UUID
    scheduled_for: datetime
    timezone: str = "UTC"
    platform_specific_config: dict | None = None


class ScheduleMultiRequest(BaseModel):
    """
    Schedule to multiple platforms request
    """

    content_library_item_id: UUID
    account_schedules: list[ScheduleAccountConfig]
    timezone: str = "UTC"


class RescheduleRequest(BaseModel):
    """
    Reschedule post request
    """

    scheduled_for: datetime
    timezone: str | None = None


class ScheduledPostContentResponse(BaseModel):
    """
    Abbreviated content data in scheduled post
    """

    id: UUID
    title: str | None = None
    body: str | None = None


class ScheduledPostAccountResponse(BaseModel):
    """
    Abbreviated account data in scheduled post
    """

    id: UUID
    platform: PlatformType
    username: str
    display_name: str | None = None
    profile_image_url: str | None = None


class ScheduledPostResponse(BaseModel):
    """
    Scheduled post response
    """

    id: UUID
    content_library_item_id: UUID
    connected_account_id: UUID
    platform: PlatformType
    scheduled_for: datetime
    timezone: str
    status: ScheduleStatus
    late_status: LatePostStatus | None = None
    schedule_mode: ScheduleMode
    batch_id: str | None = None
    late_post_id: str | None = None
    platform_post_id: str | None = None
    platform_post_url: str | None = None
    published_at: datetime | None = None
    failed_at: datetime | None = None
    error_message: str | None = None
    retry_count: int = 0
    created_at: datetime
    content: ScheduledPostContentResponse | None = None
    account: ScheduledPostAccountResponse | None = None


class ScheduleBatchResponse(BaseModel):
    """
    Multi-platform schedule batch response
    """

    batch_id: str
    posts: list[ScheduledPostResponse]


class CalendarQueryParams(BaseModel):
    """
    Calendar view query parameters
    """

    from_date: datetime
    to_date: datetime
    account_ids: list[UUID] | None = None


class CalendarRescheduleRequest(BaseModel):
    """
    Drag-and-drop reschedule request
    """

    post_id: UUID
    scheduled_for: datetime
    timezone: str | None = None


class PostAnalyticsResponse(BaseModel):
    """
    Post analytics response
    """

    id: UUID
    scheduled_post_id: UUID
    platform: PlatformType
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    impressions: int = 0
    reach: int = 0
    engagement_rate: float = 0.0
    watch_time_seconds: float | None = None
    avg_watch_percentage: float | None = None
    synced_at: datetime


class FollowerStatsResponse(BaseModel):
    """
    Follower statistics response
    """

    id: UUID
    connected_account_id: UUID
    platform: PlatformType
    recorded_date: datetime
    follower_count: int
    following_count: int | None = None
    posts_count: int | None = None
    daily_change: int | None = None
    weekly_change: int | None = None
    monthly_change: int | None = None


class FollowerGrowthResponse(BaseModel):
    """
    Follower growth data
    """

    account_id: UUID
    period_days: int
    growth: dict
    history: list[FollowerStatsResponse]


class AnalyticsOverviewResponse(BaseModel):
    """
    Analytics dashboard overview
    """

    period_days: int
    post_metrics: dict
    total_followers_by_platform: dict[str, int]
    posts_by_platform: dict[str, int]
    posts_by_status: dict[str, int]


class BestTimeSlot(BaseModel):
    """
    Best posting time slot
    """

    day_name: str
    hour: int
    avg_engagement: float
    post_count: int


class BestTimesResponse(BaseModel):
    """
    Best posting times response
    """

    heatmap: dict
    top_times: list[BestTimeSlot]


class SyncResponse(BaseModel):
    """
    Sync operation response
    """

    synced: int
    failed: int


class FollowerStatsCreate(BaseModel):
    """
    Create/update follower stats for a date
    """

    connected_account_id: UUID
    follower_count: int
    recorded_date: datetime | None = None


class FollowerStatsBulkCreate(BaseModel):
    """
    Bulk create/update follower stats
    """

    stats: list[FollowerStatsCreate]
