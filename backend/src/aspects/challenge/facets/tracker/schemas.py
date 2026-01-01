"""
ⒸAngelaMos | 2025
schemas.py
"""

from uuid import UUID
from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
)


class BaseSchema(BaseModel):
    """
    Base schema with common configuration
    """
    model_config = ConfigDict(
        from_attributes = True,
        str_strip_whitespace = True,
    )


class BaseResponseSchema(BaseSchema):
    """
    Base schema for API responses with common fields
    """
    id: UUID
    created_at: datetime
    updated_at: datetime | None = None


class ChallengeStart(BaseSchema):
    """
    Schema for starting a new challenge
    """
    start_date: date = Field(
        default_factory = date.today,
        description = "Start date of the challenge (defaults to today)"
    )
    content_goal: int = Field(
        default = 450,
        ge = 1,
        description = "Content creation goal"
    )
    jobs_goal: int = Field(
        default = 150,
        ge = 1,
        description = "Job applications goal"
    )


class LogCreate(BaseSchema):
    """
    Schema for creating a daily log
    """
    log_date: date = Field(
        default_factory = date.today,
        description = "Date of the log entry"
    )
    tiktok: int = Field(default = 0, ge = 0)
    instagram_reels: int = Field(default = 0, ge = 0)
    youtube_shorts: int = Field(default = 0, ge = 0)
    twitter: int = Field(default = 0, ge = 0)
    reddit: int = Field(default = 0, ge = 0)
    linkedin_personal: int = Field(default = 0, ge = 0)
    linkedin_company: int = Field(default = 0, ge = 0)
    youtube_full: int = Field(default = 0, ge = 0)
    medium: int = Field(default = 0, ge = 0)
    jobs_applied: int = Field(default = 0, ge = 0)


class LogUpdate(BaseSchema):
    """
    Schema for updating a daily log
    """
    tiktok: int | None = Field(default = None, ge = 0)
    instagram_reels: int | None = Field(default = None, ge = 0)
    youtube_shorts: int | None = Field(default = None, ge = 0)
    twitter: int | None = Field(default = None, ge = 0)
    reddit: int | None = Field(default = None, ge = 0)
    linkedin_personal: int | None = Field(default = None, ge = 0)
    linkedin_company: int | None = Field(default = None, ge = 0)
    youtube_full: int | None = Field(default = None, ge = 0)
    medium: int | None = Field(default = None, ge = 0)
    jobs_applied: int | None = Field(default = None, ge = 0)


class LogResponse(BaseResponseSchema):
    """
    Schema for log API response
    """
    challenge_id: UUID
    log_date: date
    day_number: int
    tiktok: int
    instagram_reels: int
    youtube_shorts: int
    twitter: int
    reddit: int
    linkedin_personal: int
    linkedin_company: int
    youtube_full: int
    medium: int
    jobs_applied: int

    @computed_field
    @property
    def total_content(self) -> int:
        """
        Calculate total content for this day
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


class ChallengeResponse(BaseResponseSchema):
    """
    Schema for challenge API response
    """
    name: str
    start_date: date
    end_date: date
    is_active: bool
    content_goal: int
    jobs_goal: int


class ChallengeWithStats(ChallengeResponse):
    """
    Schema for challenge with aggregated stats
    """
    total_content: int = 0
    total_jobs: int = 0
    current_day: int = 1
    logs: list[LogResponse] = []

    @computed_field
    @property
    def content_percentage(self) -> float:
        """
        Calculate content completion percentage
        """
        if self.content_goal == 0:
            return 0.0
        return round((self.total_content / self.content_goal) * 100, 1)

    @computed_field
    @property
    def jobs_percentage(self) -> float:
        """
        Calculate jobs completion percentage
        """
        if self.jobs_goal == 0:
            return 0.0
        return round((self.total_jobs / self.jobs_goal) * 100, 1)


class ChallengeHistoryResponse(BaseSchema):
    """
    Schema for challenge history list
    """
    items: list[ChallengeResponse]
    total: int
