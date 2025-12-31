"""
ⒸAngelaMos | 2025
models.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import date

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Date,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


CHALLENGE_NAME_MAX_LENGTH = 100


class Challenge(Base, UUIDMixin, TimestampMixin):
    """
    A 30-day challenge cycle for content creation and job applications
    """
    __tablename__ = "challenges"
    __table_args__ = (
        sa.Index("idx_challenge_active", "is_active"),
        sa.Index(
            "idx_challenge_start",
            "start_date",
            postgresql_ops={"start_date": "DESC"},
        ),
    )

    name: Mapped[str] = mapped_column(
        String(CHALLENGE_NAME_MAX_LENGTH),
        default="1500/1000 Challenge",
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    content_goal: Mapped[int] = mapped_column(
        Integer,
        default=1500,
        nullable=False,
    )
    jobs_goal: Mapped[int] = mapped_column(
        Integer,
        default=1000,
        nullable=False,
    )

    logs: Mapped[list[ChallengeLog]] = relationship(
        back_populates="challenge",
        cascade="all, delete-orphan",
        lazy="raise",
    )


class ChallengeLog(Base, UUIDMixin, TimestampMixin):
    """
    Daily log entry for a challenge
    """
    __tablename__ = "challenge_logs"
    __table_args__ = (
        sa.Index("idx_log_challenge", "challenge_id"),
        sa.Index("idx_log_date", "log_date"),
        sa.UniqueConstraint(
            "challenge_id",
            "log_date",
            name="uq_challenge_log_date",
        ),
    )

    challenge_id: Mapped[UUID] = mapped_column(
        sa.ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
    )
    log_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    tiktok: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    instagram_reels: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    youtube_shorts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    twitter: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reddit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    linkedin_personal: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    linkedin_company: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    youtube_full: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    jobs_applied: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    challenge: Mapped[Challenge] = relationship(
        back_populates="logs",
    )

    @property
    def total_content(self) -> int:
        """
        Calculate total content pieces for this day
        """
        return (
            self.tiktok +
            self.instagram_reels +
            self.youtube_shorts +
            self.twitter +
            self.reddit +
            self.linkedin_personal +
            self.linkedin_company +
            self.youtube_full +
            self.medium
        )
