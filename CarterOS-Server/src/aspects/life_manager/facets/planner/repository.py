"""
ⒸAngelaMos | 2025
repository.py
"""

from collections.abc import Sequence
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.life_manager.facets.planner.models import TimeBlock, Note, NoteFolder


class TimeBlockRepository:
    """
    Repository for TimeBlock operations
    """

    @classmethod
    async def get_by_date(
        cls,
        session: AsyncSession,
        block_date: date,
    ) -> Sequence[TimeBlock]:
        """
        Get all time blocks for a date
        """
        result = await session.execute(
            select(TimeBlock)
            .where(TimeBlock.block_date == block_date)
            .order_by(TimeBlock.start_time, TimeBlock.sort_order)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_id(
        cls,
        session: AsyncSession,
        block_id: UUID,
    ) -> TimeBlock | None:
        """
        Get time block by ID
        """
        return await session.get(TimeBlock, block_id)

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        **kwargs,
    ) -> TimeBlock:
        """
        Create a time block
        """
        block = TimeBlock(**kwargs)
        session.add(block)
        await session.flush()
        await session.refresh(block)
        return block

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        block: TimeBlock,
        **kwargs,
    ) -> TimeBlock:
        """
        Update a time block
        """
        for key, value in kwargs.items():
            if value is not None:
                setattr(block, key, value)
        await session.flush()
        await session.refresh(block)
        return block

    @classmethod
    async def delete(
        cls,
        session: AsyncSession,
        block: TimeBlock,
    ) -> None:
        """
        Delete a time block
        """
        await session.delete(block)
        await session.flush()


class NoteFolderRepository:
    """
    Repository for NoteFolder operations
    """

    @classmethod
    async def get_all(
        cls,
        session: AsyncSession,
    ) -> Sequence[NoteFolder]:
        """
        Get all folders
        """
        result = await session.execute(
            select(NoteFolder)
            .order_by(NoteFolder.sort_order, NoteFolder.name)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_id(
        cls,
        session: AsyncSession,
        folder_id: UUID,
    ) -> NoteFolder | None:
        """
        Get folder by ID
        """
        return await session.get(NoteFolder, folder_id)

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        **kwargs,
    ) -> NoteFolder:
        """
        Create a folder
        """
        folder = NoteFolder(**kwargs)
        session.add(folder)
        await session.flush()
        await session.refresh(folder)
        return folder

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        folder: NoteFolder,
        **kwargs,
    ) -> NoteFolder:
        """
        Update a folder
        """
        for key, value in kwargs.items():
            if value is not None:
                setattr(folder, key, value)
        await session.flush()
        await session.refresh(folder)
        return folder

    @classmethod
    async def delete(
        cls,
        session: AsyncSession,
        folder: NoteFolder,
    ) -> None:
        """
        Delete a folder
        """
        await session.delete(folder)
        await session.flush()


class NoteRepository:
    """
    Repository for Note operations
    """

    @classmethod
    async def get_all(
        cls,
        session: AsyncSession,
        folder_id: UUID | None = None,
    ) -> Sequence[Note]:
        """
        Get all notes, optionally filtered by folder
        """
        query = select(Note).order_by(Note.sort_order, Note.title)
        if folder_id is not None:
            query = query.where(Note.folder_id == folder_id)
        result = await session.execute(query)
        return result.scalars().all()

    @classmethod
    async def get_root_notes(
        cls,
        session: AsyncSession,
    ) -> Sequence[Note]:
        """
        Get notes without a folder
        """
        result = await session.execute(
            select(Note)
            .where(Note.folder_id.is_(None))
            .order_by(Note.sort_order, Note.title)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_id(
        cls,
        session: AsyncSession,
        note_id: UUID,
    ) -> Note | None:
        """
        Get note by ID
        """
        return await session.get(Note, note_id)

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        **kwargs,
    ) -> Note:
        """
        Create a note
        """
        note = Note(**kwargs)
        session.add(note)
        await session.flush()
        await session.refresh(note)
        return note

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        note: Note,
        **kwargs,
    ) -> Note:
        """
        Update a note
        """
        for key, value in kwargs.items():
            if value is not None:
                setattr(note, key, value)
        await session.flush()
        await session.refresh(note)
        return note

    @classmethod
    async def delete(
        cls,
        session: AsyncSession,
        note: Note,
    ) -> None:
        """
        Delete a note
        """
        await session.delete(note)
        await session.flush()
