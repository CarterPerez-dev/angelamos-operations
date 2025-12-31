"""
ⒸAngelaMos | 2025
content_tracking.py
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
    ContentType,
    ContentStatus,
    WorkflowStage,
    GeneratedContentStatus,
    WorkflowMode,
)
from core.constants import (
    TITLE_MAX_LENGTH,
    TOPIC_MAX_LENGTH,
    URL_MAX_LENGTH,
    TAG_MAX_LENGTH,
)
from config import SafeEnum
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)

if TYPE_CHECKING:
    pass


class WorkflowSession(Base, UUIDMixin, TimestampMixin):
    """
    Tracks entire workflow session from start to finish
    """
    __tablename__ = "workflow_sessions"
    __table_args__ = (
        sa.Index("idx_sessions_platform",
                 "platform"),
        sa.Index("idx_sessions_stage",
                 "current_stage"),
    )

    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = False,
    )
    mode: Mapped[WorkflowMode] = mapped_column(
        SafeEnum(WorkflowMode,
                 unknown_value = None),
        nullable = False,
    )
    current_stage: Mapped[WorkflowStage] = mapped_column(
        SafeEnum(WorkflowStage,
                 unknown_value = None),
        nullable = False,
    )
    initial_idea: Mapped[str | None] = mapped_column(Text, nullable = True)
    final_content_id: Mapped[UUID | None] = mapped_column(
        sa.ForeignKey("content_history.id"),
        nullable = True,
    )

    generations: Mapped[list[GeneratedContent]] = relationship(
        back_populates = "session",
        cascade = "all, delete-orphan",
        lazy = "raise",
    )
    final_content: Mapped[ContentHistory | None] = relationship(
        foreign_keys = [final_content_id],
        lazy = "raise",
    )


class ContentHistory(Base, UUIDMixin, TimestampMixin):
    """
    Tracks all published content across platforms
    """
    __tablename__ = "content_history"
    __table_args__ = (
        sa.Index("idx_content_platform",
                 "platform"),
        sa.Index("idx_content_topic",
                 "topic"),
        sa.Index(
            "idx_content_published",
            "published_at",
            postgresql_ops = {"published_at": "DESC"}
        ),
        sa.Index(
            "idx_content_engagement",
            "engagement_rate",
            postgresql_ops = {"engagement_rate": "DESC"}
        ),
        sa.Index("idx_content_status",
                 "status"),
        sa.Index("idx_content_tags",
                 "tags",
                 postgresql_using = "gin"),
    )

    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = False,
    )
    content_type: Mapped[ContentType] = mapped_column(
        SafeEnum(ContentType,
                 unknown_value = None),
        nullable = False,
    )
    title: Mapped[str | None] = mapped_column(
        String(TITLE_MAX_LENGTH),
        nullable = True
    )
    topic: Mapped[str | None] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = True
    )
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(TAG_MAX_LENGTH)),
        nullable = False
    )
    script_or_content: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    url: Mapped[str | None] = mapped_column(
        String(URL_MAX_LENGTH),
        nullable = True
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone = True),
        nullable = True,
    )
    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone = True),
        nullable = True,
    )
    status: Mapped[ContentStatus] = mapped_column(
        SafeEnum(ContentStatus,
                 unknown_value = ContentStatus.DRAFT),
        nullable = False,
    )
    views: Mapped[int] = mapped_column(Integer, default = 0)
    likes: Mapped[int] = mapped_column(Integer, default = 0)
    comments: Mapped[int] = mapped_column(Integer, default = 0)
    shares: Mapped[int] = mapped_column(Integer, default = 0)
    saves: Mapped[int] = mapped_column(Integer, default = 0)
    engagement_rate: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    what_worked: Mapped[str | None] = mapped_column(Text, nullable = True)
    what_didnt: Mapped[str | None] = mapped_column(Text, nullable = True)
    notes: Mapped[str | None] = mapped_column(Text, nullable = True)


class HookList(Base, UUIDMixin, TimestampMixin):
    """
    Master hook list (150+ hooks) with performance tracking
    """
    __tablename__ = "hook_list"
    __table_args__ = (
        sa.Index("idx_hook_category",
                 "hook_category"),
        sa.Index("idx_hook_platform",
                 "platform"),
        sa.Index(
            "idx_hook_performance",
            "avg_performance",
            postgresql_ops = {"avg_performance": "DESC"}
        ),
        sa.Index(
            "idx_hook_times_used",
            "times_used",
            postgresql_ops = {"times_used": "DESC"}
        ),
    )

    hook_text: Mapped[str] = mapped_column(Text, nullable = False)
    hook_category: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )
    platform: Mapped[PlatformType | None] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = True,
    )
    times_used: Mapped[int] = mapped_column(Integer, default = 0)
    avg_performance: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone = True),
        nullable = True,
    )
    example_video_id: Mapped[UUID | None] = mapped_column(
        sa.ForeignKey("content_history.id"),
        nullable = True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable = True)

    example_video: Mapped[ContentHistory | None] = relationship(
        foreign_keys = [example_video_id],
        lazy = "raise",
    )


class GeneratedContent(Base, UUIDMixin, TimestampMixin):
    """
    Tracks AI-generated content through workflow stages
    Parent-child chain for stage linking
    """
    __tablename__ = "generated_content"
    __table_args__ = (
        sa.Index("idx_generated_platform", "platform"),
        sa.Index("idx_generated_stage", "workflow_stage"),
        sa.Index("idx_generated_parent", "parent_id"),
        sa.Index("idx_generated_status", "status"),
        sa.Index("idx_generated_session", "session_id"),
        sa.Index(
            "idx_generated_created",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
    )

    session_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("workflow_sessions.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = False,
    )
    workflow_stage: Mapped[WorkflowStage] = mapped_column(
        SafeEnum(WorkflowStage,
                 unknown_value = None),
        nullable = False,
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        sa.ForeignKey("generated_content.id",
                      ondelete = "SET NULL"),
        nullable = True,
    )
    input_data: Mapped[dict] = mapped_column(JSONB, nullable = False)
    output_data: Mapped[dict] = mapped_column(JSONB, nullable = False)
    user_selected: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable = True
    )
    ai_model: Mapped[str] = mapped_column(String(100), nullable = False)
    tokens_used: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    generation_time_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    status: Mapped[GeneratedContentStatus] = mapped_column(
        SafeEnum(
            GeneratedContentStatus,
            unknown_value = GeneratedContentStatus.GENERATED
        ),
        nullable = False,
    )
    published_content_id: Mapped[UUID | None] = mapped_column(
        sa.ForeignKey("content_history.id"),
        nullable = True,
    )

    session: Mapped[WorkflowSession] = relationship(back_populates="generations")
    parent: Mapped[GeneratedContent | None] = relationship(
        remote_side="GeneratedContent.id",
        back_populates="children",
        foreign_keys=[parent_id],
        lazy="raise",
    )
    children: Mapped[list[GeneratedContent]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys=[parent_id],
        lazy="raise",
    )
    published_content: Mapped[ContentHistory | None] = relationship(
        foreign_keys = [published_content_id],
        lazy = "raise",
    )
