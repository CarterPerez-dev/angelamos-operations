"""
ⒸAngelaMos | 2025
library.py
"""

from pathlib import Path
from uuid import UUID
from typing import Annotated

import aiofiles
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form

from core.security.auth.dependencies import CurrentUser, DBSession
from core.enums import PlatformType, ContentLibraryType
from core.foundation.logging import get_logger

from aspects.content_studio.shared.services.content_library_service import (
    ContentLibraryService,
)
from aspects.content_studio.shared.schemas.scheduler import (
    ContentLibraryItemCreate,
    ContentLibraryItemUpdate,
    ContentLibraryItemResponse,
    ContentLibraryListResponse,
    MediaAttachmentResponse,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/library", tags=["Content Library"])


@router.post("", response_model=ContentLibraryItemResponse)
async def create_content(
    request: ContentLibraryItemCreate,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ContentLibraryItemResponse:
    """
    Create new content library item
    """
    result = await ContentLibraryService.create(
        session=db,
        content_type=request.content_type,
        title=request.title,
        body=request.body,
        target_platform=request.target_platform,
        hashtags=request.hashtags,
        mentions=request.mentions,
        tags=request.tags,
        platform_specific_data=request.platform_specific_data,
        notes=request.notes,
    )

    return ContentLibraryItemResponse(**result)


@router.get("", response_model=ContentLibraryListResponse)
async def list_content(
    db: DBSession,
    current_user: CurrentUser = None,
    content_type: ContentLibraryType | None = None,
    target_platform: PlatformType | None = None,
    tags: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> ContentLibraryListResponse:
    """
    List content library items with filters
    """
    tag_list = tags.split(",") if tags else None

    result = await ContentLibraryService.list_items(
        session=db,
        content_type=content_type,
        target_platform=target_platform,
        tags=tag_list,
        search=search,
        skip=skip,
        limit=limit,
    )

    return ContentLibraryListResponse(
        items=[ContentLibraryItemResponse(**item) for item in result["items"]],
        total=result["total"],
        skip=result["skip"],
        limit=result["limit"],
    )


@router.get("/{item_id}", response_model=ContentLibraryItemResponse)
async def get_content(
    item_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ContentLibraryItemResponse:
    """
    Get single content library item
    """
    result = await ContentLibraryService.get(db, item_id, include_media=True)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content {item_id} not found",
        )

    return ContentLibraryItemResponse(**result)


@router.put("/{item_id}", response_model=ContentLibraryItemResponse)
async def update_content(
    item_id: UUID,
    request: ContentLibraryItemUpdate,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ContentLibraryItemResponse:
    """
    Update content library item
    """
    try:
        result = await ContentLibraryService.update(
            session=db,
            item_id=item_id,
            title=request.title,
            body=request.body,
            target_platform=request.target_platform,
            hashtags=request.hashtags,
            mentions=request.mentions,
            tags=request.tags,
            platform_specific_data=request.platform_specific_data,
            notes=request.notes,
        )

        return ContentLibraryItemResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from None


@router.delete("/{item_id}")
async def delete_content(
    item_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
    hard_delete: bool = False,
) -> dict:
    """
    Delete content library item
    """
    try:
        await ContentLibraryService.delete(
            session=db,
            item_id=item_id,
            hard_delete=hard_delete,
        )

        return {"status": "deleted", "item_id": str(item_id)}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from None


@router.post("/{item_id}/media", response_model=MediaAttachmentResponse)
async def upload_media(
    item_id: UUID,
    db: DBSession,
    file: Annotated[UploadFile, File()],
    alt_text: Annotated[str | None, Form()] = None,
    current_user: CurrentUser = None,
) -> MediaAttachmentResponse:
    """
    Upload media attachment to content item
    """
    existing = await ContentLibraryService.get(db, item_id, include_media=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content {item_id} not found",
        )

    upload_dir = Path("/uploads") / str(item_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    file_size = 0

    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            await f.write(chunk)
            file_size += len(chunk)

    width = None
    height = None
    duration_seconds = None

    result = await ContentLibraryService.add_media(
        session=db,
        content_library_item_id=item_id,
        file_path=str(file_path),
        file_name=file.filename,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        width=width,
        height=height,
        duration_seconds=duration_seconds,
        alt_text=alt_text,
    )

    return MediaAttachmentResponse(**result)


@router.delete("/media/{attachment_id}")
async def delete_media(
    attachment_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
    delete_file: bool = True,
) -> dict:
    """
    Delete media attachment
    """
    try:
        await ContentLibraryService.remove_media(
            session=db,
            attachment_id=attachment_id,
            delete_file=delete_file,
        )

        return {"status": "deleted", "attachment_id": str(attachment_id)}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from None


@router.put("/{item_id}/media/reorder")
async def reorder_media(
    item_id: UUID,
    attachment_order: list[UUID],
    db: DBSession,
    current_user: CurrentUser = None,
) -> list[MediaAttachmentResponse]:
    """
    Reorder media attachments
    """
    result = await ContentLibraryService.reorder_media(
        session=db,
        content_library_item_id=item_id,
        attachment_order=attachment_order,
    )

    return [MediaAttachmentResponse(**a) for a in result]
