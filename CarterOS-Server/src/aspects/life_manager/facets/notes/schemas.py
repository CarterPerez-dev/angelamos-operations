"""
ⒸAngelaMos | 2026
schemas.py
"""

from uuid import UUID
from datetime import datetime

from pydantic import Field

from core.foundation.schemas.base import (
    BaseSchema,
    BaseResponseSchema,
)


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
    deleted_at: datetime | None


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
    deleted_at: datetime | None


class NotesListResponse(BaseSchema):
    """
    Schema for notes list with folders
    """
    folders: list[NoteFolderResponse]
    notes: list[NoteResponse]


class DeletedNotesListResponse(BaseSchema):
    """
    Schema for deleted notes list
    """
    notes: list[NoteResponse]
    folders: list[NoteFolderResponse]


class BulkDeleteRequest(BaseSchema):
    """
    Schema for bulk deleting notes
    """
    note_ids: list[UUID] = Field(min_length=1, max_length=100)


class BulkDeleteFolderRequest(BaseSchema):
    """
    Schema for bulk deleting folders
    """
    folder_ids: list[UUID] = Field(min_length=1, max_length=100)

