"""
ⒸAngelaMos | 2025
virality_linkedin.py
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


class LinkedInPostFormat(Base, UUIDMixin, TimestampMixin):
    """
    LinkedIn post formats
    Carousels have 3x engagement, video has 5x
    """
    __tablename__ = "linkedin_post_formats"

    format_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    engagement_multiplier: Mapped[str | None] = mapped_column(
        String(50),
        nullable = True
    )
    optimal_specs: Mapped[dict] = mapped_column(JSONB, nullable = False)


class LinkedInHook(Base, UUIDMixin, TimestampMixin):
    """
    LinkedIn hook types and formulas
    """
    __tablename__ = "linkedin_hooks"

    hook_type: Mapped[str] = mapped_column(String(100), nullable = False)
    description: Mapped[str | None] = mapped_column(Text, nullable = True)
    example: Mapped[str | None] = mapped_column(Text, nullable = True)
    best_for: Mapped[str | None] = mapped_column(Text, nullable = True)


class LinkedInFormatting(Base, UUIDMixin, TimestampMixin):
    """
    LinkedIn formatting rules
    """
    __tablename__ = "linkedin_formatting"

    rule_name: Mapped[str] = mapped_column(
        String(100),
        nullable = False,
        unique = True
    )
    rule_data: Mapped[dict] = mapped_column(JSONB, nullable = False)
