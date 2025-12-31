"""
ⒸAngelaMos | 2025
virality_youtube.py
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


class YouTubeStructureFramework(Base, UUIDMixin, TimestampMixin):
    """
    YouTube video structure frameworks
    HICC, intro optimization, etc.
    """
    __tablename__ = "youtube_structure_frameworks"

    framework_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    framework_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class YouTubeHookType(Base, UUIDMixin, TimestampMixin):
    """
    YouTube hook types ranked by effectiveness
    """
    __tablename__ = "youtube_hook_types"

    hook_type: Mapped[str] = mapped_column(String(100), nullable = False)
    example: Mapped[str | None] = mapped_column(Text, nullable = True)
    best_for: Mapped[str | None] = mapped_column(Text, nullable = True)
    rank: Mapped[int | None] = mapped_column(Integer, nullable = True)


class YouTubePacing(Base, UUIDMixin, TimestampMixin):
    """
    Optimal video lengths and pacing strategies
    """
    __tablename__ = "youtube_pacing"

    video_type: Mapped[str] = mapped_column(String(100), nullable = False)
    optimal_length: Mapped[str] = mapped_column(
        String(50),
        nullable = False
    )
    rationale: Mapped[str] = mapped_column(Text, nullable = False)


class YouTubeSEO(Base, UUIDMixin, TimestampMixin):
    """
    SEO optimization rules
    Title formulas, descriptions, thumbnails
    """
    __tablename__ = "youtube_seo"

    seo_category: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    seo_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class YouTubeViralPattern(Base, UUIDMixin, TimestampMixin):
    """
    Viral content patterns
    X in Y seconds, crash courses, hot takes
    """
    __tablename__ = "youtube_viral_patterns"

    pattern_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    description: Mapped[str] = mapped_column(Text, nullable = False)
    examples: Mapped[list[str]] = mapped_column(
        sa.dialects.postgresql.ARRAY(String),
        nullable = False,
    )
