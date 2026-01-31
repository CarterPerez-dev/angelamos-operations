"""
ⒸAngelaMos | 2026
routes.py
"""

from uuid import UUID

from fastapi import APIRouter, status

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
from aspects.life_manager.facets.notes.schemas import (
    NoteFolderCreate,
    NoteFolderUpdate,
    NoteFolderResponse,
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    NotesListResponse,
    DeletedNotesListResponse,
    BulkDeleteRequest,
    BulkDeleteFolderRequest,
)
from aspects.life_manager.facets.notes.service import NotesService


router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get(
    "",
    response_model=NotesListResponse,
)
async def get_all_notes(
    db: DBSession,
) -> NotesListResponse:
    """
    Get all folders and notes
    """
    return await NotesService.get_all_notes(db)


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
    return await NotesService.create_folder(db, data)


@router.patch(
    "/folders/{folder_id}/restore",
    response_model=NoteFolderResponse,
    responses={**NOT_FOUND_404},
)
async def restore_folder(
    db: DBSession,
    folder_id: UUID,
) -> NoteFolderResponse:
    """
    Restore a soft-deleted folder
    """
    return await NotesService.restore_folder(db, folder_id)


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
    return await NotesService.update_folder(db, folder_id, data)


@router.delete(
    "/folders/{folder_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def permanently_delete_folder(
    db: DBSession,
    folder_id: UUID,
) -> None:
    """
    Permanently delete a folder and all its notes (hard delete)
    """
    await NotesService.permanently_delete_folder(db, folder_id)


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
    Soft delete a folder
    """
    await NotesService.delete_folder(db, folder_id)


@router.post(
    "/folders/bulk-delete",
    status_code=status.HTTP_200_OK,
)
async def bulk_delete_folders(
    db: DBSession,
    data: BulkDeleteFolderRequest,
) -> dict[str, int]:
    """
    Bulk soft delete multiple folders
    """
    deleted_count = await NotesService.bulk_delete_folders(db, data.folder_ids)
    return {"deleted_count": deleted_count}


@router.post(
    "",
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
    return await NotesService.create_note(db, data)


@router.get(
    "/deleted",
    response_model=DeletedNotesListResponse,
)
async def get_deleted_notes(
    db: DBSession,
) -> DeletedNotesListResponse:
    """
    Get all soft-deleted notes
    """
    return await NotesService.get_deleted_notes(db)


@router.post(
    "/bulk-delete",
    status_code=status.HTTP_200_OK,
)
async def bulk_delete_notes(
    db: DBSession,
    data: BulkDeleteRequest,
) -> dict[str, int]:
    """
    Bulk soft delete multiple notes
    """
    deleted_count = await NotesService.bulk_delete_notes(db, data.note_ids)
    return {"deleted_count": deleted_count}


@router.get(
    "/{note_id}",
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
    return await NotesService.get_note(db, note_id)


@router.patch(
    "/{note_id}/restore",
    response_model=NoteResponse,
    responses={**NOT_FOUND_404},
)
async def restore_note(
    db: DBSession,
    note_id: UUID,
) -> NoteResponse:
    """
    Restore a soft-deleted note
    """
    return await NotesService.restore_note(db, note_id)


@router.put(
    "/{note_id}",
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
    return await NotesService.update_note(db, note_id, data)


@router.delete(
    "/{note_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def permanently_delete_note(
    db: DBSession,
    note_id: UUID,
) -> None:
    """
    Permanently delete a note (hard delete)
    """
    await NotesService.permanently_delete_note(db, note_id)


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**NOT_FOUND_404},
)
async def delete_note(
    db: DBSession,
    note_id: UUID,
) -> None:
    """
    Soft delete a note
    """
    await NotesService.delete_note(db, note_id)
