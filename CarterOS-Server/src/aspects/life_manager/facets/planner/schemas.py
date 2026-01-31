"""
ⒸAngelaMos | 2026
schemas.py
"""

from datetime import date, time

from pydantic import Field

from core.foundation.schemas.base import BaseSchema, BaseResponseSchema


class TimeBlockCreate(BaseSchema):
    """
    Schema for creating a time block
    """
    block_date: date = Field(default_factory=date.today)
    start_time: time
    end_time: time
    title: str = Field(max_length=200)
    description: str | None = None
    color: str | None = None
    sort_order: int = 0


class TimeBlockUpdate(BaseSchema):
    """
    Schema for updating a time block
    """
    start_time: time | None = None
    end_time: time | None = None
    title: str | None = Field(default=None, max_length=200)
    description: str | None = None
    color: str | None = None
    sort_order: int | None = None


class TimeBlockResponse(BaseResponseSchema):
    """
    Schema for time block response
    """
    block_date: date
    start_time: time
    end_time: time
    title: str
    description: str | None
    color: str | None
    sort_order: int


class TimeBlockListResponse(BaseSchema):
    """
    Schema for list of time blocks
    """
    items: list[TimeBlockResponse]
    date: date
