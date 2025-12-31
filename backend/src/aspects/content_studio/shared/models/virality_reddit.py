"""
ⒸAngelaMos | 2025
virality_reddit.py
"""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


class RedditPostType(Base, UUIDMixin, TimestampMixin):
    """
    Reddit post type patterns and best practices
    """
    __tablename__ = "reddit_post_types"

    post_type: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    description: Mapped[str] = mapped_column(Text, nullable = False)
    what_works: Mapped[str | None] = mapped_column(Text, nullable = True)
    example_good: Mapped[str | None] = mapped_column(Text, nullable = True)
    example_bad: Mapped[str | None] = mapped_column(Text, nullable = True)
    performance: Mapped[str | None] = mapped_column(Text, nullable = True)


class RedditFormatting(Base, UUIDMixin, TimestampMixin):
    """
    Reddit formatting rules
    """
    __tablename__ = "reddit_formatting"

    rule_category: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    rule_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class RedditTiming(Base, UUIDMixin, TimestampMixin):
    """
    Optimal posting times for Reddit
    """
    __tablename__ = "reddit_timing"

    time_window: Mapped[str] = mapped_column(String(100), nullable = False)
    description: Mapped[str] = mapped_column(Text, nullable = False)
    day_of_week: Mapped[str | None] = mapped_column(
        String(50),
        nullable = True
    )
    performance_note: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )


class RedditEngagementTactic(Base, UUIDMixin, TimestampMixin):
    """
    Reddit engagement tactics and strategies
    """
    __tablename__ = "reddit_engagement_tactics"

    tactic: Mapped[str] = mapped_column(Text, nullable = False)
    description: Mapped[str] = mapped_column(Text, nullable = False)
