"""
ⒸAngelaMos | 2025
models.py
"""

from __future__ import annotations

from uuid import UUID
from datetime import date, time

import sqlalchemy as sa
from sqlalchemy import String, Text, Date, Time, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.infrastructure.database.Base import Base, UUIDMixin, TimestampMixin


TITLE_MAX_LENGTH = 200
FOLDER_NAME_MAX_LENGTH = 100


class TimeBlock(Base, UUIDMixin, TimestampMixin):
    """
    A time block for daily planning
    """
    __tablename__ = "time_blocks"
    __table_args__ = (
        sa.Index("idx_timeblock_date", "block_date"),
    )

    block_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class NoteFolder(Base, UUIDMixin, TimestampMixin):
    """
    A folder for organizing notes
    """
    __tablename__ = "note_folders"
    __table_args__ = (
        sa.Index("idx_folder_parent", "parent_id"),
    )

    name: Mapped[str] = mapped_column(String(FOLDER_NAME_MAX_LENGTH), nullable=False)
    parent_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("note_folders.id", ondelete="CASCADE"),
        nullable=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    parent: Mapped[NoteFolder | None] = relationship(
        back_populates="children",
        remote_side="NoteFolder.id",
    )
    children: Mapped[list[NoteFolder]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan",
    )
    notes: Mapped[list[Note]] = relationship(
        back_populates="folder",
        cascade="all, delete-orphan",
    )


class Note(Base, UUIDMixin, TimestampMixin):
    """
    A note for brain dumps and quick notes
    """
    __tablename__ = "notes"
    __table_args__ = (
        sa.Index("idx_note_folder", "folder_id"),
    )

    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    folder_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("note_folders.id", ondelete="SET NULL"),
        nullable=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    folder: Mapped[NoteFolder | None] = relationship(back_populates="notes")
