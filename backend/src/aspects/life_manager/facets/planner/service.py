"""
ⒸAngelaMos | 2025
service.py
"""

from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.exceptions import ResourceNotFound
from aspects.life_manager.facets.planner.repository import (
    TimeBlockRepository,
    NoteFolderRepository,
    NoteRepository,
)
from aspects.life_manager.facets.planner.schemas import (
    TimeBlockCreate,
    TimeBlockUpdate,
    TimeBlockResponse,
    TimeBlockListResponse,
    NoteFolderCreate,
    NoteFolderUpdate,
    NoteFolderResponse,
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    NotesListResponse,
)


class TimeBlockNotFound(ResourceNotFound):
    """
    Raised when time block not found
    """
    def __init__(self, block_id: UUID) -> None:
        super().__init__(resource="TimeBlock", identifier=str(block_id))


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


class PlannerService:
    """
    Service for planner operations
    """

    @staticmethod
    async def get_blocks_by_date(
        session: AsyncSession,
        block_date: date,
    ) -> TimeBlockListResponse:
        """
        Get all time blocks for a date
        """
        blocks = await TimeBlockRepository.get_by_date(session, block_date)
        return TimeBlockListResponse(
            items=[TimeBlockResponse.model_validate(b) for b in blocks],
            date=block_date,
        )

    @staticmethod
    async def create_block(
        session: AsyncSession,
        data: TimeBlockCreate,
    ) -> TimeBlockResponse:
        """
        Create a time block
        """
        block = await TimeBlockRepository.create(
            session,
            block_date=data.block_date,
            start_time=data.start_time,
            end_time=data.end_time,
            title=data.title,
            description=data.description,
            color=data.color,
            sort_order=data.sort_order,
        )
        return TimeBlockResponse.model_validate(block)

    @staticmethod
    async def update_block(
        session: AsyncSession,
        block_id: UUID,
        data: TimeBlockUpdate,
    ) -> TimeBlockResponse:
        """
        Update a time block
        """
        block = await TimeBlockRepository.get_by_id(session, block_id)
        if not block:
            raise TimeBlockNotFound(block_id)

        update_dict = data.model_dump(exclude_unset=True)
        block = await TimeBlockRepository.update(session, block, **update_dict)
        return TimeBlockResponse.model_validate(block)

    @staticmethod
    async def delete_block(
        session: AsyncSession,
        block_id: UUID,
    ) -> None:
        """
        Delete a time block
        """
        block = await TimeBlockRepository.get_by_id(session, block_id)
        if not block:
            raise TimeBlockNotFound(block_id)
        await TimeBlockRepository.delete(session, block)

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
        Delete a folder
        """
        folder = await NoteFolderRepository.get_by_id(session, folder_id)
        if not folder:
            raise NoteFolderNotFound(folder_id)
        await NoteFolderRepository.delete(session, folder)

    @staticmethod
    async def create_note(
        session: AsyncSession,
        data: NoteCreate,
    ) -> NoteResponse:
        """
        Create a note
        """
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

        update_dict = data.model_dump(exclude_unset=True)
        note = await NoteRepository.update(session, note, **update_dict)
        return NoteResponse.model_validate(note)

    @staticmethod
    async def delete_note(
        session: AsyncSession,
        note_id: UUID,
    ) -> None:
        """
        Delete a note
        """
        note = await NoteRepository.get_by_id(session, note_id)
        if not note:
            raise NoteNotFound(note_id)
        await NoteRepository.delete(session, note)
