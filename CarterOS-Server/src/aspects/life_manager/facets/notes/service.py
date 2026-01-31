"""
ⒸAngelaMos | 2026
service.py
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ResourceNotFound
from aspects.life_manager.facets.notes.models import Note
from aspects.life_manager.facets.notes.repository import (
    NoteFolderRepository,
    NoteRepository,
)
from aspects.life_manager.facets.notes.schemas import (
    NoteFolderCreate,
    NoteFolderUpdate,
    NoteFolderResponse,
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    NotesListResponse,
    DeletedNotesListResponse,
)


class NoteFolderNotFound(ResourceNotFound):
    """
    Raised when folder not found
    """
    def __init__(self, folder_id: UUID) -> None:
        super().__init__(resource="NoteFolder", identifier=str(folder_id))


class NoteNotFound(ResourceNotFound):
    """
    Raised when note not found
    """
    def __init__(self, note_id: UUID) -> None:
        super().__init__(resource="Note", identifier=str(note_id))


class NotesService:
    """
    Service for notes operations
    """

    @staticmethod
    async def get_all_notes(
        session: AsyncSession,
    ) -> NotesListResponse:
        """
        Get all folders and notes
        """
        folders = await NoteFolderRepository.get_all(session)
        notes = await NoteRepository.get_all(session)
        return NotesListResponse(
            folders=[NoteFolderResponse.model_validate(f) for f in folders],
            notes=[NoteResponse.model_validate(n) for n in notes],
        )

    @staticmethod
    async def create_folder(
        session: AsyncSession,
        data: NoteFolderCreate,
    ) -> NoteFolderResponse:
        """
        Create a folder
        """
        folder = await NoteFolderRepository.create(
            session,
            name=data.name,
            parent_id=data.parent_id,
            sort_order=data.sort_order,
        )
        return NoteFolderResponse.model_validate(folder)

    @staticmethod
    async def update_folder(
        session: AsyncSession,
        folder_id: UUID,
        data: NoteFolderUpdate,
    ) -> NoteFolderResponse:
        """
        Update a folder
        """
        folder = await NoteFolderRepository.get_by_id(session, folder_id)
        if not folder:
            raise NoteFolderNotFound(folder_id)

        update_dict = data.model_dump(exclude_unset=True)
        folder = await NoteFolderRepository.update(session, folder, **update_dict)
        return NoteFolderResponse.model_validate(folder)

    @staticmethod
    async def delete_folder(
        session: AsyncSession,
        folder_id: UUID,
    ) -> None:
        """
        Soft delete a folder and all its notes
        """
        folder = await NoteFolderRepository.get_by_id(session, folder_id)
        if not folder:
            raise NoteFolderNotFound(folder_id)

        notes_in_folder = await NoteRepository.get_all(session, folder_id=folder_id)
        for note in notes_in_folder:
            await NoteRepository.soft_delete(session, note)

        await NoteFolderRepository.soft_delete(session, folder)

    @staticmethod
    async def create_note(
        session: AsyncSession,
        data: NoteCreate,
    ) -> NoteResponse:
        """
        Create a note
        """
        if data.folder_id:
            folder = await NoteFolderRepository.get_by_id(session, data.folder_id)
            if not folder:
                raise NoteFolderNotFound(data.folder_id)

        note = await NoteRepository.create(
            session,
            title=data.title,
            content=data.content,
            folder_id=data.folder_id,
            sort_order=data.sort_order,
        )
        return NoteResponse.model_validate(note)

    @staticmethod
    async def get_note(
        session: AsyncSession,
        note_id: UUID,
    ) -> NoteResponse:
        """
        Get a note by ID
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)
        return NoteResponse.model_validate(note)

    @staticmethod
    async def update_note(
        session: AsyncSession,
        note_id: UUID,
        data: NoteUpdate,
    ) -> NoteResponse:
        """
        Update a note
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)

        if data.folder_id is not None:
            folder = await NoteFolderRepository.get_by_id(session, data.folder_id)
            if not folder:
                raise NoteFolderNotFound(data.folder_id)

        update_dict = data.model_dump(exclude_unset=True)
        note = await NoteRepository.update(session, note, **update_dict)
        return NoteResponse.model_validate(note)

    @staticmethod
    async def delete_note(
        session: AsyncSession,
        note_id: UUID,
    ) -> None:
        """
        Soft delete a note
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)
        await NoteRepository.soft_delete(session, note)

    @staticmethod
    async def get_deleted_notes(
        session: AsyncSession,
    ) -> DeletedNotesListResponse:
        """
        Get all soft-deleted notes and folders
        """
        notes = await NoteRepository.get_deleted(session)
        folders = await NoteFolderRepository.get_deleted(session)
        return DeletedNotesListResponse(
            notes=[NoteResponse.model_validate(n) for n in notes],
            folders=[NoteFolderResponse.model_validate(f) for f in folders],
        )

    @staticmethod
    async def restore_note(
        session: AsyncSession,
        note_id: UUID,
    ) -> NoteResponse:
        """
        Restore a soft-deleted note
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)
        if note.deleted_at is None:
            raise ValueError("Note is not deleted")
        note = await NoteRepository.restore(session, note)
        return NoteResponse.model_validate(note)

    @staticmethod
    async def permanently_delete_note(
        session: AsyncSession,
        note_id: UUID,
    ) -> None:
        """
        Permanently delete a note (hard delete)
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)
        await NoteRepository.delete(session, note)

    @staticmethod
    async def bulk_delete_notes(
        session: AsyncSession,
        note_ids: list[UUID],
    ) -> int:
        """
        Bulk soft delete multiple notes
        """
        deleted_count = await NoteRepository.bulk_soft_delete(session, note_ids)
        return deleted_count

    @staticmethod
    async def restore_folder(
        session: AsyncSession,
        folder_id: UUID,
    ) -> NoteFolderResponse:
        """
        Restore a soft-deleted folder and all its notes
        """
        folder = await NoteFolderRepository.get_by_id(session, folder_id)
        if not folder:
            raise NoteFolderNotFound(folder_id)
        if folder.deleted_at is None:
            raise ValueError("Folder is not deleted")

        from sqlalchemy import select
        deleted_notes_in_folder = await session.execute(
            select(Note).where(Note.folder_id == folder_id).where(Note.deleted_at.is_not(None))
        )
        notes_to_restore = deleted_notes_in_folder.scalars().all()

        for note in notes_to_restore:
            await NoteRepository.restore(session, note)

        folder = await NoteFolderRepository.restore(session, folder)
        return NoteFolderResponse.model_validate(folder)

    @staticmethod
    async def permanently_delete_folder(
        session: AsyncSession,
        folder_id: UUID,
    ) -> None:
        """
        Permanently delete a folder and all its notes (hard delete)
        """
        folder = await NoteFolderRepository.get_by_id(session, folder_id)
        if not folder:
            raise NoteFolderNotFound(folder_id)

        from sqlalchemy import select
        all_notes_in_folder = await session.execute(
            select(Note).where(Note.folder_id == folder_id)
        )
        notes_to_delete = all_notes_in_folder.scalars().all()

        for note in notes_to_delete:
            await NoteRepository.delete(session, note)

        await NoteFolderRepository.delete(session, folder)

    @staticmethod
    async def bulk_delete_folders(
        session: AsyncSession,
        folder_ids: list[UUID],
    ) -> int:
        """
        Bulk soft delete multiple folders
        """
        deleted_count = await NoteFolderRepository.bulk_soft_delete(session, folder_ids)
        return deleted_count
