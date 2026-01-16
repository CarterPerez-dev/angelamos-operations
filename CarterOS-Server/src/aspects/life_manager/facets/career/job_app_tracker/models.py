"""
ⒸAngelaMos | 2025
models.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from config import (
    CONTACT_EMAIL_MAX_LENGTH,
    CONTACT_NAME_MAX_LENGTH,
    IDENTITY_NAME_MAX_LENGTH,
    JOB_URL_MAX_LENGTH,
    LOCATION_MAX_LENGTH,
    NOTES_MAX_LENGTH,
    POSITION_TITLE_MAX_LENGTH,
    SOURCE_MAX_LENGTH,
    SafeEnum,
)
from core.infrastructure.database.Base import Base, UUIDMixin, TimestampMixin
from aspects.life_manager.facets.career.job_app_tracker.enums import (
    ApplicationStatus,
    ExperienceLevel,
    JobType,
    Outcome,
    Priority,
    RemoteType,
)


class JobApplication(Base, UUIDMixin, TimestampMixin):
    """
    A job application entry for tracking the full job hunt lifecycle
    """
    __tablename__ = "job_applications"
    __table_args__ = (
        sa.Index("idx_job_app_user", "user_id"),
        sa.Index("idx_job_app_status", "application_status"),
        sa.Index("idx_job_app_outcome", "outcome"),
        sa.Index("idx_job_app_date_applied", "date_applied"),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    identity_name: Mapped[str] = mapped_column(
        String(IDENTITY_NAME_MAX_LENGTH),
        nullable=False,
    )
    position_title: Mapped[str] = mapped_column(
        String(POSITION_TITLE_MAX_LENGTH),
        nullable=False,
    )
    job_url: Mapped[str | None] = mapped_column(
        String(JOB_URL_MAX_LENGTH),
        nullable=True,
    )

    salary_min: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    salary_max: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    offer_amount: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(LOCATION_MAX_LENGTH),
        nullable=True,
    )
    remote_type: Mapped[RemoteType] = mapped_column(
        SafeEnum(RemoteType, unknown_value=RemoteType.UNKNOWN),
        default=RemoteType.UNKNOWN,
    )

    source: Mapped[str | None] = mapped_column(
        String(SOURCE_MAX_LENGTH),
        nullable=True,
    )

    contact_name: Mapped[str | None] = mapped_column(
        String(CONTACT_NAME_MAX_LENGTH),
        nullable=True,
    )
    contact_email: Mapped[str | None] = mapped_column(
        String(CONTACT_EMAIL_MAX_LENGTH),
        nullable=True,
    )

    application_status: Mapped[ApplicationStatus] = mapped_column(
        SafeEnum(ApplicationStatus, unknown_value=ApplicationStatus.UNKNOWN),
        default=ApplicationStatus.SAVED,
    )
    interview_rounds: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    outcome: Mapped[Outcome] = mapped_column(
        SafeEnum(Outcome, unknown_value=Outcome.UNKNOWN),
        default=Outcome.PENDING,
    )

    job_type: Mapped[JobType] = mapped_column(
        SafeEnum(JobType, unknown_value=JobType.UNKNOWN),
        default=JobType.UNKNOWN,
    )
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        SafeEnum(ExperienceLevel, unknown_value=ExperienceLevel.UNKNOWN),
        default=ExperienceLevel.UNKNOWN,
    )
    priority: Mapped[Priority] = mapped_column(
        SafeEnum(Priority, unknown_value=Priority.UNKNOWN),
        default=Priority.MEDIUM,
    )

    date_saved: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    date_applied: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    date_first_response: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    date_outcome: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    followup_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
