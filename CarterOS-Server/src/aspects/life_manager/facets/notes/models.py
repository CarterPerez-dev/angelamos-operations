"""
ⒸAngelaMos | 2026
models.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Text,
    Integer,
    ForeignKey,
    DateTime,
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


TITLE_MAX_LENGTH = 200
FOLDER_NAME_MAX_LENGTH = 100
# TODO (also in planner) move to constants)


class NoteFolder(Base, UUIDMixin, TimestampMixin):
    """
    A folder for organizing notes
    """
    __tablename__ = "note_folders"
    __table_args__ = (
        sa.Index("idx_folder_parent",
                 "parent_id"),
        sa.Index("idx_folders_deleted_at",
                 "deleted_at"),
    )

    name: Mapped[str] = mapped_column(
        String(FOLDER_NAME_MAX_LENGTH),
        nullable = False
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("note_folders.id",
                   ondelete = "CASCADE"),
        nullable = True,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default = 0,
        nullable = False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone = True),
        nullable = True
    )

    parent: Mapped[NoteFolder | None] = relationship(
        back_populates = "children",
        remote_side = "NoteFolder.id",
    )
    children: Mapped[list[NoteFolder]] = relationship(
        back_populates = "parent",
        cascade = "all, delete-orphan",
    )
    notes: Mapped[list[Note]] = relationship(
        back_populates = "folder",
        cascade = "all, delete-orphan",
    )


class Note(Base, UUIDMixin, TimestampMixin):
    """
    A note for brain dumps and quick notes
    """
    __tablename__ = "notes"
    __table_args__ = (
        sa.Index("idx_note_folder",
                 "folder_id"),
        sa.Index("idx_notes_deleted_at",
                 "deleted_at"),
    )

    title: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH),
        nullable = False
    )
    content: Mapped[str] = mapped_column(
        Text,
        default = "",
        nullable = False
    )
    folder_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("note_folders.id",
                   ondelete = "SET NULL"),
        nullable = True,
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default = 0,
        nullable = False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone = True),
        nullable = True
    )

    folder: Mapped[NoteFolder
                   | None] = relationship(back_populates = "notes")
