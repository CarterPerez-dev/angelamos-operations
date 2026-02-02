"""
ⒸAngelaMos | 2026
schemas.py
"""

from uuid import UUID
from datetime import datetime

from pydantic import Field

from config import (
    CONTACT_EMAIL_MAX_LENGTH,
    CONTACT_NAME_MAX_LENGTH,
    IDENTITY_NAME_MAX_LENGTH,
    JOB_URL_MAX_LENGTH,
    LOCATION_MAX_LENGTH,
    POSITION_TITLE_MAX_LENGTH,
    SOURCE_MAX_LENGTH,
)
from core.foundation.schemas.base import BaseSchema, BaseResponseSchema
from aspects.life_manager.facets.career.job_app_tracker.enums import (
    ApplicationStatus,
    ExperienceLevel,
    JobType,
    Outcome,
    Priority,
    RemoteType,
)


class JobApplicationCreate(BaseSchema):
    """
    Schema for creating a job application
    """
    identity_name: str = Field(max_length=IDENTITY_NAME_MAX_LENGTH)
    position_title: str = Field(max_length=POSITION_TITLE_MAX_LENGTH)
    job_url: str | None = Field(default=None, max_length=JOB_URL_MAX_LENGTH)

    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    location: str | None = Field(default=None, max_length=LOCATION_MAX_LENGTH)
    remote_type: RemoteType = RemoteType.UNKNOWN

    source: str | None = Field(default=None, max_length=SOURCE_MAX_LENGTH)

    contact_name: str | None = Field(default=None, max_length=CONTACT_NAME_MAX_LENGTH)
    contact_email: str | None = Field(default=None, max_length=CONTACT_EMAIL_MAX_LENGTH)

    application_status: ApplicationStatus = ApplicationStatus.SAVED
    job_type: JobType = JobType.UNKNOWN
    experience_level: ExperienceLevel = ExperienceLevel.UNKNOWN
    priority: Priority = Priority.MEDIUM

    date_saved: datetime | None = None
    date_applied: datetime | None = None
    followup_date: datetime | None = None

    notes: str | None = None


class JobApplicationUpdate(BaseSchema):
    """
    Schema for updating a job application
    """
    identity_name: str | None = Field(default=None, max_length=IDENTITY_NAME_MAX_LENGTH)
    position_title: str | None = Field(default=None, max_length=POSITION_TITLE_MAX_LENGTH)
    job_url: str | None = Field(default=None, max_length=JOB_URL_MAX_LENGTH)

    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    offer_amount: int | None = Field(default=None, ge=0)

    location: str | None = Field(default=None, max_length=LOCATION_MAX_LENGTH)
    remote_type: RemoteType | None = None

    source: str | None = Field(default=None, max_length=SOURCE_MAX_LENGTH)

    contact_name: str | None = Field(default=None, max_length=CONTACT_NAME_MAX_LENGTH)
    contact_email: str | None = Field(default=None, max_length=CONTACT_EMAIL_MAX_LENGTH)

    application_status: ApplicationStatus | None = None
    interview_rounds: int | None = Field(default=None, ge=0)
    outcome: Outcome | None = None

    job_type: JobType | None = None
    experience_level: ExperienceLevel | None = None
    priority: Priority | None = None

    date_saved: datetime | None = None
    date_applied: datetime | None = None
    date_first_response: datetime | None = None
    date_outcome: datetime | None = None
    followup_date: datetime | None = None

    notes: str | None = None


class JobApplicationResponse(BaseResponseSchema):
    """
    Schema for job application response
    """
    user_id: UUID

    identity_name: str
    position_title: str
    job_url: str | None

    salary_min: int | None
    salary_max: int | None
    offer_amount: int | None

    location: str | None
    remote_type: RemoteType

    source: str | None

    contact_name: str | None
    contact_email: str | None

    application_status: ApplicationStatus
    interview_rounds: int
    outcome: Outcome

    job_type: JobType
    experience_level: ExperienceLevel
    priority: Priority

    date_saved: datetime | None
    date_applied: datetime | None
    date_first_response: datetime | None
    date_outcome: datetime | None
    followup_date: datetime | None

    notes: str | None


class JobApplicationListResponse(BaseSchema):
    """
    Schema for paginated job application list
    """
    items: list[JobApplicationResponse]
    total: int
