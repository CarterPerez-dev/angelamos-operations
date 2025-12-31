"""
ⒸAngelaMos | 2025
platform_rules.py
"""

from __future__ import annotations

from uuid import UUID
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Text,
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
    ForbiddenPatternType,
    PatternSeverity,
    TikTokRuleCategory,
    LinkedInPageType,
    SubredditPriority,
)
from config import SafeEnum
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)

if TYPE_CHECKING:
    pass


class PlatformRule(Base, UUIDMixin, TimestampMixin):
    """
    Platform-specific core rules
    """
    __tablename__ = "platform_rules"

    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = False,
        unique = True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable = True)


class RedditSubreddit(Base, UUIDMixin, TimestampMixin):
    """
    Target Reddit subreddits with priority levels
    """
    __tablename__ = "reddit_subreddits"
    __table_args__ = (
        sa.Index("idx_subreddits_self_promo",
                 "self_promotion_allowed"),
        sa.Index("idx_subreddits_priority",
                 "priority"),
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
    self_promotion_allowed: Mapped[bool] = mapped_column(
        Boolean,
        default = False
    )
    priority: Mapped[SubredditPriority | None] = mapped_column(
        SafeEnum(SubredditPriority,
                 unknown_value = SubredditPriority.LOW),
        nullable = True,
    )

    rules: Mapped[list[RedditSubredditRule]] = relationship(
        back_populates = "subreddit",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )


class RedditSubredditRule(Base, UUIDMixin, TimestampMixin):
    """
    Special rules per subreddit
    """
    __tablename__ = "reddit_subreddit_rules"

    subreddit_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("reddit_subreddits.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    rule: Mapped[str] = mapped_column(Text, nullable = False)

    subreddit: Mapped[RedditSubreddit] = relationship(
        back_populates = "rules"
    )


class RedditForbiddenPattern(Base, UUIDMixin, TimestampMixin):
    """
    CRITICAL AI detection patterns for Reddit
    EM DASHES ARE #1 GIVEAWAY
    """
    __tablename__ = "reddit_forbidden_patterns"
    __table_args__ = (sa.Index("idx_forbidden_severity",
                               "severity"),
                      )

    pattern_type: Mapped[ForbiddenPatternType] = mapped_column(
        SafeEnum(ForbiddenPatternType,
                 unknown_value = None),
        nullable = False,
    )
    pattern: Mapped[str] = mapped_column(String(200), nullable = False)
    severity: Mapped[PatternSeverity] = mapped_column(
        SafeEnum(PatternSeverity,
                 unknown_value = PatternSeverity.WARNING),
        nullable = False,
    )
    rule: Mapped[str] = mapped_column(Text, nullable = False)
    example_wrong: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    example_right: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable = True)


class RedditUpvoteDriver(Base, UUIDMixin, TimestampMixin):
    """
    What gets upvotes on Reddit
    Hierarchy: Useful > Relatable > Unique > Funny
    """
    __tablename__ = "reddit_upvote_drivers"

    criterion: Mapped[str] = mapped_column(
        String(50),
        nullable = False,
        unique = True,
    )
    priority: Mapped[int] = mapped_column(Integer, nullable = False)
    description: Mapped[str] = mapped_column(Text, nullable = False)


class TikTokRule(Base, UUIDMixin, TimestampMixin):
    """
    TikTok platform rules with flexible JSON storage
    """
    __tablename__ = "tiktok_rules"

    rule_category: Mapped[TikTokRuleCategory] = mapped_column(
        SafeEnum(TikTokRuleCategory,
                 unknown_value = None),
        nullable = False,
        unique = True,
    )
    rule_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class LinkedInRule(Base, UUIDMixin, TimestampMixin):
    """
    LinkedIn posting rules for personal and company pages
    """
    __tablename__ = "linkedin_rules"

    page_type: Mapped[LinkedInPageType] = mapped_column(
        SafeEnum(LinkedInPageType,
                 unknown_value = None),
        nullable = False,
        unique = True,
    )
    content_types: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False,
    )
    strategy: Mapped[str | None] = mapped_column(Text, nullable = True)
    character_limit: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    first_visible_chars: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    emoji_usage: Mapped[str | None] = mapped_column(Text, nullable = True)


class TwitterRule(Base, UUIDMixin, TimestampMixin):
    """
    Twitter hit tweet strategy
    """
    __tablename__ = "twitter_rules"

    strategy: Mapped[str] = mapped_column(Text, nullable = False)
    tweet_length_target: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )
    what_hits: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False
    )
    growth_pattern: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    topics_approach: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    tone: Mapped[str | None] = mapped_column(Text, nullable = True)
    use_hashtags: Mapped[bool] = mapped_column(Boolean, default = False)
    difficulty_note: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )


class YouTubeRule(Base, UUIDMixin, TimestampMixin):
    """
    YouTube long-form video rules
    """
    __tablename__ = "youtube_rules"

    video_length_philosophy: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    format: Mapped[str | None] = mapped_column(Text, nullable = True)
    script_structure_approach: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    seo_importance: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    thumbnail_importance: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )


class HashtagStrategy(Base, UUIDMixin, TimestampMixin):
    """
    Hashtag strategy across all platforms
    Max 5 hashtags in specific order
    """
    __tablename__ = "hashtag_strategy"

    max_count: Mapped[int] = mapped_column(Integer, default = 5)
    position: Mapped[int] = mapped_column(
        Integer,
        nullable = False,
        unique = True
    )
    purpose: Mapped[str] = mapped_column(Text, nullable = False)


class CrossPlatformRule(Base, UUIDMixin, TimestampMixin):
    """
    Universal rules applying across all platforms
    """
    __tablename__ = "cross_platform_rules"

    rule: Mapped[str] = mapped_column(
        Text,
        nullable = False,
        unique = True
    )
    applies_to: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False
    )


class ContentRepurposing(Base, UUIDMixin, TimestampMixin):
    """
    Content repurposing strategy
    """
    __tablename__ = "content_repurposing"

    source_platform: Mapped[str] = mapped_column(
        String(50),
        nullable = False
    )
    target_platform: Mapped[str] = mapped_column(
        String(50),
        nullable = False
    )
    adaptation_strategy: Mapped[str] = mapped_column(
        Text,
        nullable = False
    )
