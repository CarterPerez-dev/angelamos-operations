"""
ⒸAngelaMos | 2025
identity.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import date
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Text,
    Date,
    Numeric,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from core.enums import (
    PlatformType,
    ProficiencyLevel,
    PassionLevel,
    StrengthSource,
    PreferenceType,
    EngagementLevel,
)
from core.constants import (
    FULL_NAME_MAX_LENGTH,
    TOPIC_MAX_LENGTH,
)
from config import SafeEnum
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)

if TYPE_CHECKING:
    pass


class CoreIdentity(Base, UUIDMixin, TimestampMixin):
    """
    Carter's core identity profile

    SINGLETON: Only one row should exist
    """
    __tablename__ = "core_identity"
    __table_args__ = (
        sa.Index("idx_singleton_identity",
                 "is_singleton",
                 unique = True),
    )

    is_singleton: Mapped[bool] = mapped_column(Boolean, default = True)
    name: Mapped[str] = mapped_column(
        String(FULL_NAME_MAX_LENGTH),
        nullable = False
    )
    age: Mapped[int] = mapped_column(Integer, nullable = False)
    background: Mapped[str] = mapped_column(Text, nullable = False)
    current_role: Mapped[str] = mapped_column(Text, nullable = False)
    primary_goal: Mapped[str] = mapped_column(Text, nullable = False)
    target_audience: Mapped[str] = mapped_column(Text, nullable = False)

    skills: Mapped[list[IdentitySkill]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    interests: Mapped[list[IdentityInterest]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    certifications: Mapped[list[IdentityCertification]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    strengths: Mapped[list[IdentityStrength]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    weaknesses: Mapped[list[IdentityWeakness]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    brand_voice: Mapped[BrandVoice | None] = relationship(
        back_populates = "identity",
        uselist = False,
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    platform_goals: Mapped[list[PlatformGoal]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    revenue_goal: Mapped[RevenueGoal | None] = relationship(
        back_populates = "identity",
        uselist = False,
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    content_pillars: Mapped[list[ContentPillar]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )
    content_preferences: Mapped[list[ContentPreference]] = relationship(
        back_populates = "identity",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )


class IdentitySkill(Base, UUIDMixin, TimestampMixin):
    """
    Carter's skills with proficiency tracking
    """
    __tablename__ = "identity_skills"
    __table_args__ = (
        sa.Index("idx_skills_proficiency",
                 "proficiency"),
        sa.Index("idx_skills_identity",
                 "identity_id"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    skill: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    proficiency: Mapped[ProficiencyLevel] = mapped_column(
        SafeEnum(
            ProficiencyLevel,
            unknown_value = ProficiencyLevel.BEGINNER
        ),
        nullable = False,
    )
    years_experience: Mapped[float] = mapped_column(
        Numeric(3,
                1),
        nullable = False
    )
    context: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "skills"
    )


class IdentityInterest(Base, UUIDMixin, TimestampMixin):
    """
    Topics Carter is passionate about
    """
    __tablename__ = "identity_interests"
    __table_args__ = (
        sa.Index("idx_interests_passion",
                 "passion_level"),
        sa.Index("idx_interests_identity",
                 "identity_id"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    topic: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    passion_level: Mapped[PassionLevel] = mapped_column(
        SafeEnum(PassionLevel,
                 unknown_value = PassionLevel.INTERESTED),
        nullable = False,
    )
    why: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "interests"
    )


class IdentityCertification(Base, UUIDMixin, TimestampMixin):
    """
    Professional certifications earned
    """
    __tablename__ = "identity_certifications"
    __table_args__ = (
        sa.Index("idx_certs_identity",
                 "identity_id"),
        sa.Index("idx_certs_date",
                 "date_earned"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    name: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    date_earned: Mapped[date] = mapped_column(Date, nullable = False)
    time_to_complete: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "certifications"
    )


class IdentityStrength(Base, UUIDMixin, TimestampMixin):
    """
    Carter's strengths and what he excels at
    """
    __tablename__ = "identity_strengths"
    __table_args__ = (
        sa.Index("idx_strengths_identity",
                 "identity_id"),
        sa.Index("idx_strengths_source",
                 "source"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    strength: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    source: Mapped[StrengthSource] = mapped_column(
        SafeEnum(
            StrengthSource,
            unknown_value = StrengthSource.SELF_IDENTIFIED
        ),
        nullable = False,
    )
    evidence: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "strengths"
    )


class IdentityWeakness(Base, UUIDMixin, TimestampMixin):
    """
    Carter's weaknesses and struggles
    """
    __tablename__ = "identity_weaknesses"
    __table_args__ = (sa.Index("idx_weaknesses_identity",
                               "identity_id"),
                      )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    weakness: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    impact: Mapped[str] = mapped_column(Text, nullable = False)
    workaround: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "weaknesses"
    )


class BrandVoice(Base, UUIDMixin, TimestampMixin):
    """
    Carter's brand voice and communication style
    """
    __tablename__ = "brand_voice"
    __table_args__ = (
        sa.Index("idx_brand_voice_identity",
                 "identity_id"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
        unique = True,
    )
    tone: Mapped[str] = mapped_column(Text, nullable = False)
    sentence_structure: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    uses_analogies: Mapped[bool] = mapped_column(Boolean, default = True)
    explanation_method: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "brand_voice"
    )
    avoid_patterns: Mapped[list[BrandVoiceAvoid]] = relationship(
        back_populates = "brand_voice",
        cascade = "all, delete-orphan",
        lazy = "selectin",
    )


class BrandVoiceAvoid(Base, UUIDMixin, TimestampMixin):
    """
    Language patterns and phrases to never use
    """
    __tablename__ = "brand_voice_avoid"
    __table_args__ = (
        sa.Index("idx_voice_avoid_brand",
                 "brand_voice_id"),
    )

    brand_voice_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("brand_voice.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    pattern: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    reason: Mapped[str] = mapped_column(Text, nullable = False)

    brand_voice: Mapped[BrandVoice] = relationship(
        back_populates = "avoid_patterns"
    )


class PlatformGoal(Base, UUIDMixin, TimestampMixin):
    """
    12-month goals per social media platform
    """
    __tablename__ = "platform_goals"
    __table_args__ = (
        sa.Index("idx_platform_goals_platform",
                 "platform"),
        sa.Index("idx_platform_goals_identity",
                 "identity_id"),
        sa.UniqueConstraint(
            "identity_id",
            "platform",
            name = "uq_identity_platform"
        ),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    platform: Mapped[PlatformType] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = False,
    )
    current_followers: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    goal_followers: Mapped[int | None] = mapped_column(
        Integer,
        nullable = True
    )
    time_to_goal: Mapped[str | None] = mapped_column(
        String(100),
        nullable = True
    )
    current_status: Mapped[str | None] = mapped_column(
        Text,
        nullable = True
    )
    strategy: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "platform_goals"
    )


class RevenueGoal(Base, UUIDMixin, TimestampMixin):
    """
    CertGames revenue and financial targets
    """
    __tablename__ = "revenue_goals"
    __table_args__ = (
        sa.Index("idx_revenue_goals_identity",
                 "identity_id"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
        unique = True,
    )
    paying_users_target: Mapped[int] = mapped_column(
        Integer,
        nullable = False
    )
    monthly_price: Mapped[int] = mapped_column(Integer, nullable = False)
    monthly_revenue_target: Mapped[int] = mapped_column(
        Integer,
        nullable = False
    )
    current_paying_users: Mapped[int] = mapped_column(
        Integer,
        nullable = False,
        default = 0
    )
    note: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "revenue_goal"
    )


class ContentPillar(Base, UUIDMixin, TimestampMixin):
    """
    Core content themes across all platforms
    """
    __tablename__ = "content_pillars"
    __table_args__ = (sa.Index("idx_pillars_identity",
                               "identity_id"),
                      )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    pillar: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "content_pillars"
    )


class ContentPreference(Base, UUIDMixin, TimestampMixin):
    """
    Content preferences: what works vs what he enjoys vs what he's burnt out on
    """
    __tablename__ = "content_preferences"
    __table_args__ = (
        sa.Index("idx_content_prefs_type",
                 "preference_type"),
        sa.Index("idx_content_prefs_platform",
                 "platform"),
        sa.Index("idx_content_prefs_identity",
                 "identity_id"),
    )

    identity_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("core_identity.id",
                      ondelete = "CASCADE"),
        nullable = False,
    )
    preference_type: Mapped[PreferenceType] = mapped_column(
        SafeEnum(PreferenceType,
                 unknown_value = None),
        nullable = False,
    )
    content_type: Mapped[str] = mapped_column(
        String(TOPIC_MAX_LENGTH),
        nullable = False
    )
    platform: Mapped[PlatformType | None] = mapped_column(
        SafeEnum(PlatformType,
                 unknown_value = None),
        nullable = True,
    )
    evidence: Mapped[str | None] = mapped_column(Text, nullable = True)
    engagement_level: Mapped[EngagementLevel | None] = mapped_column(
        SafeEnum(EngagementLevel,
                 unknown_value = None),
        nullable = True,
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable = True)
    challenge: Mapped[str | None] = mapped_column(Text, nullable = True)

    identity: Mapped[CoreIdentity] = relationship(
        back_populates = "content_preferences"
    )
