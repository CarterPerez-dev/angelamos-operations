"""
ⒸAngelaMos | 2026
repository.py
"""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.repositories.base import BaseRepository
from aspects.life_manager.facets.notes.models import Note, NoteFolder


class NoteFolderRepository(BaseRepository[NoteFolder]):
    """
    Repository for NoteFolder operations
    """
    model = NoteFolder

    @classmethod
    async def get_all(
        cls,
        session: AsyncSession,
    ) -> Sequence[NoteFolder]:
        """
        Get all non-deleted folders ordered by sort_order and name
        """
        result = await session.execute(
            select(NoteFolder)
            .where(NoteFolder.deleted_at.is_(None))
            .order_by(NoteFolder.sort_order, NoteFolder.name)
        )
        return result.scalars().all()

    @classmethod
    async def get_deleted(
        cls,
        session: AsyncSession,
    ) -> Sequence[NoteFolder]:
        """
        Get all soft-deleted folders
        """
        result = await session.execute(
            select(NoteFolder)
            .where(NoteFolder.deleted_at.is_not(None))
            .order_by(NoteFolder.deleted_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def soft_delete(
        cls,
        session: AsyncSession,
        folder: NoteFolder,
    ) -> NoteFolder:
        """
        Soft delete a folder
        """
        from datetime import datetime, timezone
        folder.deleted_at = datetime.now(timezone.utc)
        await session.flush()
        await session.refresh(folder)
        return folder

    @classmethod
    async def restore(
        cls,
        session: AsyncSession,
        folder: NoteFolder,
    ) -> NoteFolder:
        """
        Restore a soft-deleted folder
        """
        folder.deleted_at = None
        await session.flush()
        await session.refresh(folder)
        return folder

    @classmethod
    async def bulk_soft_delete(
        cls,
        session: AsyncSession,
        folder_ids: list[UUID],
    ) -> int:
        """
        Bulk soft delete multiple folders by their IDs
        """
        from datetime import datetime, timezone
        from sqlalchemy import update

        result = await session.execute(
            update(NoteFolder)
            .where(NoteFolder.id.in_(folder_ids))
            .where(NoteFolder.deleted_at.is_(None))
            .values(deleted_at=datetime.now(timezone.utc))
        )
        await session.flush()
        return result.rowcount


class NoteRepository(BaseRepository[Note]):
    """
    Repository for Note operations
    """
    model = Note

    @classmethod
    async def get_all(
        cls,
        session: AsyncSession,
        folder_id: UUID | None = None,
    ) -> Sequence[Note]:
        """
        Get all non-deleted notes, optionally filtered by folder
        """
        query = select(Note).where(Note.deleted_at.is_(None)).order_by(Note.sort_order, Note.title)
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
        Get non-deleted notes without a folder
        """
        result = await session.execute(
            select(Note)
            .where(Note.folder_id.is_(None))
            .where(Note.deleted_at.is_(None))
            .order_by(Note.sort_order, Note.title)
        )
        return result.scalars().all()

    @classmethod
    async def get_deleted(
        cls,
        session: AsyncSession,
    ) -> Sequence[Note]:
        """
        Get all soft-deleted notes
        """
        result = await session.execute(
            select(Note)
            .where(Note.deleted_at.is_not(None))
            .order_by(Note.deleted_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def soft_delete(
        cls,
        session: AsyncSession,
        note: Note,
    ) -> Note:
        """
        Soft delete a note
        """
        from datetime import datetime, timezone
        note.deleted_at = datetime.now(timezone.utc)
        await session.flush()
        await session.refresh(note)
        return note

    @classmethod
    async def restore(
        cls,
        session: AsyncSession,
        note: Note,
    ) -> Note:
        """
        Restore a soft-deleted note
        """
        note.deleted_at = None
        await session.flush()
        await session.refresh(note)
        return note

    @classmethod
    async def bulk_soft_delete(
        cls,
        session: AsyncSession,
        note_ids: list[UUID],
    ) -> int:
        """
        Bulk soft delete multiple notes by their IDs
        """
        from datetime import datetime, timezone
        from sqlalchemy import update

        result = await session.execute(
            update(Note)
            .where(Note.id.in_(note_ids))
            .where(Note.deleted_at.is_(None))
            .values(deleted_at=datetime.now(timezone.utc))
        )
        await session.flush()
        return result.rowcount
