"""
ⒸAngelaMos | 2025
schemas.py
"""

from uuid import UUID
from datetime import date, time, datetime

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    """
    Base schema with common configuration
    """
    model_config = ConfigDict(
        from_attributes=True,
        str_strip_whitespace=True,
    )


class BaseResponseSchema(BaseSchema):
    """
    Base schema for API responses
    """
    id: UUID
    created_at: datetime
    updated_at: datetime | None = None


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


class NoteFolderCreate(BaseSchema):
    """
    Schema for creating a folder
    """
    name: str = Field(max_length=100)
    parent_id: UUID | None = None
    sort_order: int = 0


class NoteFolderUpdate(BaseSchema):
    """
    Schema for updating a folder
    """
    name: str | None = Field(default=None, max_length=100)
    parent_id: UUID | None = None
    sort_order: int | None = None


class NoteFolderResponse(BaseResponseSchema):
    """
    Schema for folder response
    """
    name: str
    parent_id: UUID | None
    sort_order: int


class NoteCreate(BaseSchema):
    """
    Schema for creating a note
    """
    title: str = Field(max_length=200)
    content: str = ""
    folder_id: UUID | None = None
    sort_order: int = 0


class NoteUpdate(BaseSchema):
    """
    Schema for updating a note
    """
    title: str | None = Field(default=None, max_length=200)
    content: str | None = None
    folder_id: UUID | None = None
    sort_order: int | None = None


class NoteResponse(BaseResponseSchema):
    """
    Schema for note response
    """
    title: str
    content: str
    folder_id: UUID | None
    sort_order: int


class NotesListResponse(BaseSchema):
    """
    Schema for notes list with folders
    """
    folders: list[NoteFolderResponse]
    notes: list[NoteResponse]
