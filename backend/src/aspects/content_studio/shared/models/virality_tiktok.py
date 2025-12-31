"""
ⒸAngelaMos | 2025
virality_tiktok.py
"""

from __future__ import annotations

from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from core.enums import TikTokHookType, TikTokMistakeType
from config import SafeEnum
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


class TikTokHookSystem(Base, UUIDMixin, TimestampMixin):
    """
    TikTok three-hook system: visual, text, verbal hooks
    """
    __tablename__ = "tiktok_hook_system"

    hook_type: Mapped[TikTokHookType] = mapped_column(
        SafeEnum(TikTokHookType,
                 unknown_value = None),
        nullable = False,
    )
    timing: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )
    requirements: Mapped[str | None] = mapped_column(Text, nullable = True)
    max_words: Mapped[int | None] = mapped_column(Integer, nullable = True)
    examples: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False
    )
    performance_stat: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )


class TikTokHookFormula(Base, UUIDMixin, TimestampMixin):
    """
    Hook formulas and templates
    """
    __tablename__ = "tiktok_hook_formulas"

    formula_name: Mapped[str] = mapped_column(
        String(200),
        nullable = False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
    examples: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False
    )


class TikTokStructureTemplate(Base, UUIDMixin, TimestampMixin):
    """
    Video structure templates by length
    """
    __tablename__ = "tiktok_structure_templates"

    video_length: Mapped[str] = mapped_column(String(50), nullable = False)
    timestamp_range: Mapped[str] = mapped_column(
        String(50),
        nullable = False
    )
    purpose: Mapped[str] = mapped_column(Text, nullable = False)
    energy_level: Mapped[str | None] = mapped_column(
        String(50),
        nullable = True
    )


class TikTokPacing(Base, UUIDMixin, TimestampMixin):
    """
    Pacing rules: sentence length, speaking pace, voice modulation
    """
    __tablename__ = "tiktok_pacing"

    rule_type: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    rule_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class TikTokRetentionTactic(Base, UUIDMixin, TimestampMixin):
    """
    Retention tactics: pattern interrupts, breadcrumbs, text overlays
    """
    __tablename__ = "tiktok_retention_tactics"

    tactic_category: Mapped[str] = mapped_column(
        String(100),
        nullable = False
    )
    tactic_data: Mapped[dict] = mapped_column(JSONB, nullable = False)


class TikTokCTAStrategy(Base, UUIDMixin, TimestampMixin):
    """
    Call-to-action strategies by video length
    """
    __tablename__ = "tiktok_cta_strategies"

    video_length: Mapped[str] = mapped_column(String(50), nullable = False)
    placement: Mapped[str] = mapped_column(Text, nullable = False)
    high_converting_examples: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable = False,
    )


class TikTokCommonMistake(Base, UUIDMixin, TimestampMixin):
    """
    Common mistakes to avoid
    """
    __tablename__ = "tiktok_common_mistakes"

    mistake_type: Mapped[TikTokMistakeType] = mapped_column(
        SafeEnum(TikTokMistakeType,
                 unknown_value = None),
        nullable = False,
    )
    mistake: Mapped[str] = mapped_column(Text, nullable = False)
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
    performance_impact: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    solution: Mapped[str | None] = mapped_column(Text, nullable = True)


class TikTokPlatformSpecific(Base, UUIDMixin, TimestampMixin):
    """
    TikTok platform-specific metrics and settings
    """
    __tablename__ = "tiktok_platform_specifics"

    metric_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    metric_value: Mapped[str] = mapped_column(Text, nullable = False)
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
