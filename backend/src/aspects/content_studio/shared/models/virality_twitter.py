"""
ⒸAngelaMos | 2025
virality_twitter.py
"""

from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


class TwitterFormatStrategy(Base, UUIDMixin, TimestampMixin):
    """
    Twitter format strategies
    Single tweets vs threads
    """
    __tablename__ = "twitter_format_strategy"

    format_type: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    format_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class TwitterHook(Base, UUIDMixin, TimestampMixin):
    """
    Twitter hook formulas
    """
    __tablename__ = "twitter_hooks"

    hook_formula: Mapped[str] = mapped_column(Text, nullable = False)
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
    example: Mapped[str | None] = mapped_column(Text, nullable = True)
    psychological_trigger: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )


class TwitterThreadArchitecture(Base, UUIDMixin, TimestampMixin):
    """
    Thread architecture frameworks
    Problem/solution, storytelling, listicle
    """
    __tablename__ = "twitter_thread_architecture"

    framework_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    structure: Mapped[dict] = mapped_column(JSONB, nullable = False)


class TwitterEngagementTactic(Base, UUIDMixin, TimestampMixin):
    """
    Twitter engagement tactics
    CQSR framework, SWYX strategy
    """
    __tablename__ = "twitter_engagement_tactics"

    tactic_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    description: Mapped[str] = mapped_column(Text, nullable = False)
    implementation: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )


class TwitterViralPattern(Base, UUIDMixin, TimestampMixin):
    """
    Twitter viral patterns
    High arousal emotions, novelty, social currency
    """
    __tablename__ = "twitter_viral_patterns"

    pattern_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    description: Mapped[str] = mapped_column(Text, nullable = False)
    examples: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False
    )
