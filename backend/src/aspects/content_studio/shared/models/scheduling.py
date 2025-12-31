"""
ⒸAngelaMos | 2025
scheduling.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Integer,
    Float,
    Text,
    DateTime,
    Boolean,
    BigInteger,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from sqlalchemy.dialects.postgresql import (
    JSONB,
    ARRAY,
)
from core.enums import (
    PlatformType,
    ScheduleStatus,
    LatePostStatus,
    MediaType,
    ScheduleMode,
    ContentLibraryType,
)
from core.constants import (
    TITLE_MAX_LENGTH,
    URL_MAX_LENGTH,
    TAG_MAX_LENGTH,
)
from config import SafeEnum
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
)

if TYPE_CHECKING:
    from aspects.content_studio.shared.models.content_tracking import WorkflowSession


LATE_ID_MAX_LENGTH = 64
PLATFORM_USERNAME_MAX_LENGTH = 100
MIME_TYPE_MAX_LENGTH = 100
FILE_PATH_MAX_LENGTH = 500
TIMEZONE_MAX_LENGTH = 50
BATCH_ID_MAX_LENGTH = 64


class ConnectedAccount(Base, UUIDMixin, TimestampMixin):
    """
    Social accounts connected via Late API OAuth
    """
    __tablename__ = "connected_accounts"
    __table_args__ = (
        sa.Index("idx_connected_platform", "platform"),
        sa.Index("idx_connected_late_id", "late_account_id"),
        sa.Index("idx_connected_active", "is_active"),
        sa.UniqueConstraint("late_account_id", name="uq_connected_late_account_id"),
    )

    late_account_id: Mapped[str] = mapped_column(
        String(LATE_ID_MAX_LENGTH),
        nullable=False,
    )
    late_profile_id: Mapped[str] = mapped_column(
        String(LATE_ID_MAX_LENGTH),
        nullable=False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType, unknown_value=None),
        nullable=False,
    )
    platform_username: Mapped[str] = mapped_column(
        String(PLATFORM_USERNAME_MAX_LENGTH),
        nullable=False,
    )
    platform_display_name: Mapped[str | None] = mapped_column(
        String(PLATFORM_USERNAME_MAX_LENGTH),
        nullable=True,
    )
    profile_image_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH),
        nullable=True,
    )
    followers_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    last_sync_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    platform_metadata: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    scheduled_posts: Mapped[list[ScheduledPost]] = relationship(
        back_populates="connected_account",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    follower_stats: Mapped[list[FollowerStats]] = relationship(
        back_populates="connected_account",
        cascade="all, delete-orphan",
        lazy="raise",
    )


class ContentLibraryItem(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Content storage for posts, scripts, threads
    """
    __tablename__ = "content_library_items"
    __table_args__ = (
        sa.Index("idx_library_type", "content_type"),
        sa.Index("idx_library_platform", "target_platform"),
        sa.Index("idx_library_deleted", "is_deleted"),
        sa.Index(
            "idx_library_created",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        sa.Index(
            "idx_library_tags",
            "tags",
            postgresql_using="gin",
        ),
    )

    title: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH),
        nullable=True,
    )
    body: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    content_type: Mapped[ContentLibraryType] = mapped_column(
        SafeEnum(ContentLibraryType, unknown_value=None),
        nullable=False,
    )
    target_platform: Mapped[PlatformType | None] = mapped_column(
        SafeEnum(PlatformType, unknown_value=None),
        nullable=True,
    )
    hashtags: Mapped[list[str]] = mapped_column(
        ARRAY(String(TAG_MAX_LENGTH)),
        default=list,
        nullable=False,
    )
    mentions: Mapped[list[str]] = mapped_column(
        ARRAY(String(PLATFORM_USERNAME_MAX_LENGTH)),
        default=list,
        nullable=False,
    )
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(TAG_MAX_LENGTH)),
        default=list,
        nullable=False,
    )
    workflow_session_id: Mapped[UUID | None] = mapped_column(
        sa.ForeignKey("workflow_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    platform_specific_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    workflow_session: Mapped[WorkflowSession | None] = relationship(
        foreign_keys=[workflow_session_id],
        lazy="raise",
    )
    media_attachments: Mapped[list[MediaAttachment]] = relationship(
        back_populates="content_library_item",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    scheduled_posts: Mapped[list[ScheduledPost]] = relationship(
        back_populates="content_library_item",
        cascade="all, delete-orphan",
        lazy="raise",
    )


class MediaAttachment(Base, UUIDMixin, TimestampMixin):
    """
    Media files attached to content library items
    """
    __tablename__ = "media_attachments"
    __table_args__ = (
        sa.Index("idx_media_content", "content_library_item_id"),
        sa.Index("idx_media_type", "media_type"),
        sa.Index("idx_media_late_id", "late_media_id"),
    )

    content_library_item_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("content_library_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_path: Mapped[str] = mapped_column(
        String(FILE_PATH_MAX_LENGTH),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    file_size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(
        String(MIME_TYPE_MAX_LENGTH),
        nullable=False,
    )
    media_type: Mapped[MediaType] = mapped_column(
        SafeEnum(MediaType, unknown_value=None),
        nullable=False,
    )
    width: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    height: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    duration_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    thumbnail_path: Mapped[str | None] = mapped_column(
        String(FILE_PATH_MAX_LENGTH),
        nullable=True,
    )
    alt_text: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    late_media_id: Mapped[str | None] = mapped_column(
        String(LATE_ID_MAX_LENGTH),
        nullable=True,
    )
    late_media_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH),
        nullable=True,
    )
    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    content_library_item: Mapped[ContentLibraryItem] = relationship(
        back_populates="media_attachments",
    )


class ScheduledPost(Base, UUIDMixin, TimestampMixin):
    """
    Scheduled posts to social platforms via Late API
    """
    __tablename__ = "scheduled_posts"
    __table_args__ = (
        sa.Index("idx_scheduled_status", "status"),
        sa.Index("idx_scheduled_platform", "platform"),
        sa.Index("idx_scheduled_account", "connected_account_id"),
        sa.Index("idx_scheduled_content", "content_library_item_id"),
        sa.Index("idx_scheduled_late_post", "late_post_id"),
        sa.Index("idx_scheduled_batch", "batch_id"),
        sa.Index(
            "idx_scheduled_for",
            "scheduled_for",
            postgresql_ops={"scheduled_for": "ASC"},
        ),
        sa.Index(
            "idx_scheduled_published",
            "published_at",
            postgresql_ops={"published_at": "DESC"},
        ),
    )

    content_library_item_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("content_library_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    connected_account_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("connected_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType, unknown_value=None),
        nullable=False,
    )
    scheduled_for: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    timezone: Mapped[str] = mapped_column(
        String(TIMEZONE_MAX_LENGTH),
        default="UTC",
        nullable=False,
    )
    status: Mapped[ScheduleStatus] = mapped_column(
        SafeEnum(ScheduleStatus, unknown_value=ScheduleStatus.DRAFT),
        default=ScheduleStatus.DRAFT,
        nullable=False,
    )
    late_status: Mapped[LatePostStatus | None] = mapped_column(
        SafeEnum(LatePostStatus, unknown_value=None),
        nullable=True,
    )
    schedule_mode: Mapped[ScheduleMode] = mapped_column(
        SafeEnum(ScheduleMode, unknown_value=None),
        nullable=False,
    )
    batch_id: Mapped[str | None] = mapped_column(
        String(BATCH_ID_MAX_LENGTH),
        nullable=True,
    )
    late_post_id: Mapped[str | None] = mapped_column(
        String(LATE_ID_MAX_LENGTH),
        nullable=True,
    )
    platform_post_id: Mapped[str | None] = mapped_column(
        String(LATE_ID_MAX_LENGTH),
        nullable=True,
    )
    platform_post_url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH),
        nullable=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    retry_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    platform_specific_config: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    content_library_item: Mapped[ContentLibraryItem] = relationship(
        back_populates="scheduled_posts",
    )
    connected_account: Mapped[ConnectedAccount] = relationship(
        back_populates="scheduled_posts",
    )
    analytics: Mapped[PostAnalytics | None] = relationship(
        back_populates="scheduled_post",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="raise",
    )


class PostAnalytics(Base, UUIDMixin, TimestampMixin):
    """
    Performance metrics for published posts
    """
    __tablename__ = "post_analytics"
    __table_args__ = (
        sa.Index("idx_analytics_post", "scheduled_post_id"),
        sa.Index("idx_analytics_platform", "platform"),
        sa.Index(
            "idx_analytics_synced",
            "synced_at",
            postgresql_ops={"synced_at": "DESC"},
        ),
        sa.Index(
            "idx_analytics_engagement",
            "engagement_rate",
            postgresql_ops={"engagement_rate": "DESC"},
        ),
        sa.UniqueConstraint(
            "scheduled_post_id",
            name="uq_analytics_scheduled_post",
        ),
    )

    scheduled_post_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("scheduled_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType, unknown_value=None),
        nullable=False,
    )
    views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shares: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    saves: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reach: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    watch_time_seconds: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    avg_watch_percentage: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    raw_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    scheduled_post: Mapped[ScheduledPost] = relationship(
        back_populates="analytics",
    )


class FollowerStats(Base, UUIDMixin, TimestampMixin):
    """
    Follower growth tracking for connected accounts
    """
    __tablename__ = "follower_stats"
    __table_args__ = (
        sa.Index("idx_follower_account", "connected_account_id"),
        sa.Index("idx_follower_platform", "platform"),
        sa.Index(
            "idx_follower_date",
            "recorded_date",
            postgresql_ops={"recorded_date": "DESC"},
        ),
        sa.UniqueConstraint(
            "connected_account_id",
            "recorded_date",
            name="uq_follower_account_date",
        ),
    )

    connected_account_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("connected_accounts.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType, unknown_value=None),
        nullable=False,
    )
    recorded_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    follower_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    following_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    posts_count: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    daily_change: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    weekly_change: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    monthly_change: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    connected_account: Mapped[ConnectedAccount] = relationship(
        back_populates="follower_stats",
    )
