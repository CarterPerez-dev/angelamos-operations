"""
ⒸAngelaMos | 2025
routes.py
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query, status

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
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
from aspects.life_manager.facets.planner.service import PlannerService


router = APIRouter(prefix="/planner", tags=["Life Planner"])


@router.get(
    "/blocks",
    response_model=TimeBlockListResponse,
)
async def get_time_blocks(
    db: DBSession,
    block_date: date = Query(default_factory=date.today),
) -> TimeBlockListResponse:
    """
    Get all time blocks for a date
    """
    return await PlannerService.get_blocks_by_date(db, block_date)


@router.post(
    "/blocks",
    response_model=TimeBlockResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_time_block(
    db: DBSession,
    data: TimeBlockCreate,
) -> TimeBlockResponse:
    """
    Create a time block
    """
    return await PlannerService.create_block(db, data)


@router.put(
    "/blocks/{block_id}",
    response_model=TimeBlockResponse,
    responses={**NOT_FOUND_404},
)
async def update_time_block(
    db: DBSession,
    block_id: UUID,
    data: TimeBlockUpdate,
) -> TimeBlockResponse:
    """
    Update a time block
    """
    return await PlannerService.update_block(db, block_id, data)


@router.delete(
    "/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def delete_time_block(
    db: DBSession,
    block_id: UUID,
) -> None:
    """
    Delete a time block
    """
    await PlannerService.delete_block(db, block_id)


@router.get(
    "/notes",
    response_model=NotesListResponse,
)
async def get_all_notes(
    db: DBSession,
) -> NotesListResponse:
    """
    Get all folders and notes
    """
    return await PlannerService.get_all_notes(db)


@router.post(
    "/folders",
    response_model=NoteFolderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_folder(
    db: DBSession,
    data: NoteFolderCreate,
) -> NoteFolderResponse:
    """
    Create a folder
    """
    return await PlannerService.create_folder(db, data)


@router.put(
    "/folders/{folder_id}",
    response_model=NoteFolderResponse,
    responses={**NOT_FOUND_404},
)
async def update_folder(
    db: DBSession,
    folder_id: UUID,
    data: NoteFolderUpdate,
) -> NoteFolderResponse:
    """
    Update a folder
    """
    return await PlannerService.update_folder(db, folder_id, data)


@router.delete(
    "/folders/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def delete_folder(
    db: DBSession,
    folder_id: UUID,
) -> None:
    """
    Delete a folder
    """
    await PlannerService.delete_folder(db, folder_id)


@router.post(
    "/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    db: DBSession,
    data: NoteCreate,
) -> NoteResponse:
    """
    Create a note
    """
    return await PlannerService.create_note(db, data)


@router.get(
    "/notes/{note_id}",
    response_model=NoteResponse,
    responses={**NOT_FOUND_404},
)
async def get_note(
    db: DBSession,
    note_id: UUID,
) -> NoteResponse:
    """
    Get a note by ID
    """
    return await PlannerService.get_note(db, note_id)


@router.put(
    "/notes/{note_id}",
    response_model=NoteResponse,
    responses={**NOT_FOUND_404},
)
async def update_note(
    db: DBSession,
    note_id: UUID,
    data: NoteUpdate,
) -> NoteResponse:
    """
    Update a note
    """
    return await PlannerService.update_note(db, note_id, data)


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def delete_note(
    db: DBSession,
    note_id: UUID,
) -> None:
    """
    Delete a note
    """
    await PlannerService.delete_note(db, note_id)
