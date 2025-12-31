"""
ⒸAngelaMos | 2025
content_library_service.py
"""

from pathlib import Path
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.repositories.content_library import (
    ContentLibraryRepository,
    MediaAttachmentRepository,
)
from aspects.content_studio.shared.models.scheduling import (
    ContentLibraryItem,
    MediaAttachment,
)
from core.enums import (
    PlatformType,
    ContentLibraryType,
    MediaType,
)
from core.foundation.logging import get_logger
from config import settings


logger = get_logger(__name__)


UPLOAD_DIR = settings.UPLOAD_DIR

MIME_TO_MEDIA_TYPE = {
    "image/jpeg": MediaType.IMAGE,
    "image/png": MediaType.IMAGE,
    "image/gif": MediaType.GIF,
    "image/webp": MediaType.IMAGE,
    "video/mp4": MediaType.VIDEO,
    "video/quicktime": MediaType.VIDEO,
    "video/webm": MediaType.VIDEO,
    "application/pdf": MediaType.DOCUMENT,
}


class ContentLibraryService:
    """
    Service for managing content library items

    Handles:
    - Content CRUD operations
    - Media file uploads
    - Creating content from workflow sessions
    - Search and filtering
    """

    @staticmethod
    async def create(
        session: AsyncSession,
        content_type: ContentLibraryType,
        title: str | None = None,
        body: str | None = None,
        target_platform: PlatformType | None = None,
        hashtags: list[str] | None = None,
        mentions: list[str] | None = None,
        tags: list[str] | None = None,
        workflow_session_id: UUID | None = None,
        platform_specific_data: dict | None = None,
        notes: str | None = None,
    ) -> dict:
        """
        Create new content library item

        Args:
            content_type: Type of content (video_script, text_post, etc.)
            title: Optional title
            body: Main content text
            target_platform: Primary platform for this content
            hashtags: List of hashtags
            mentions: List of mentions
            tags: Internal tags for organization
            workflow_session_id: Link to workflow session if created from workflow
            platform_specific_data: Platform-specific configuration
            notes: Internal notes

        Returns:
            Created content item data
        """
        item = await ContentLibraryRepository.create(
            session=session,
            content_type=content_type,
            title=title,
            body=body,
            target_platform=target_platform,
            hashtags=hashtags,
            mentions=mentions,
            tags=tags,
            workflow_session_id=workflow_session_id,
            platform_specific_data=platform_specific_data,
            notes=notes,
        )

        await session.commit()

        logger.info(
            "Content created",
            content_id=item.id,
            content_type=content_type.value,
        )

        return ContentLibraryService._item_to_dict(item, include_media=False)

    @staticmethod
    async def create_from_workflow(
        session: AsyncSession,
        workflow_session_id: UUID,
        title: str | None = None,
        body: str | None = None,
        target_platform: PlatformType | None = None,
        hashtags: list[str] | None = None,
        tags: list[str] | None = None,
        content_type: ContentLibraryType = ContentLibraryType.VIDEO_SCRIPT,
    ) -> dict:
        """
        Create content library item from completed workflow session

        Used when user finishes TikTok workflow and wants to save to library
        """
        existing = await ContentLibraryRepository.get_by_workflow_session(
            session, workflow_session_id
        )
        if existing:
            raise ValueError(
                f"Content already exists for workflow session {workflow_session_id}"
            )

        item = await ContentLibraryRepository.create(
            session=session,
            content_type=content_type,
            title=title,
            body=body,
            target_platform=target_platform,
            hashtags=hashtags,
            tags=tags,
            workflow_session_id=workflow_session_id,
        )

        await session.commit()

        logger.info(
            "Content created from workflow",
            content_id=item.id,
            workflow_session_id=workflow_session_id,
        )

        return ContentLibraryService._item_to_dict(item, include_media=False)

    @staticmethod
    async def get(
        session: AsyncSession,
        item_id: UUID,
        include_media: bool = True,
    ) -> dict | None:
        """
        Get content library item by ID
        """
        if include_media:
            item = await ContentLibraryRepository.get_by_id_with_media(
                session, item_id
            )
        else:
            item = await ContentLibraryRepository.get_by_id(session, item_id)

        if not item:
            return None

        return ContentLibraryService._item_to_dict(item, include_media)

    @staticmethod
    async def list_items(
        session: AsyncSession,
        content_type: ContentLibraryType | None = None,
        target_platform: PlatformType | None = None,
        tags: list[str] | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        """
        List content library items with filters and pagination
        """
        items = await ContentLibraryRepository.get_multi(
            session=session,
            content_type=content_type,
            target_platform=target_platform,
            tags=tags,
            search=search,
            skip=skip,
            limit=limit,
            include_media=False,
        )

        total = await ContentLibraryRepository.count(
            session=session,
            content_type=content_type,
            target_platform=target_platform,
        )

        return {
            "items": [ContentLibraryService._item_to_dict(i, include_media=False) for i in items],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def update(
        session: AsyncSession,
        item_id: UUID,
        title: str | None = None,
        body: str | None = None,
        target_platform: PlatformType | None = None,
        hashtags: list[str] | None = None,
        mentions: list[str] | None = None,
        tags: list[str] | None = None,
        platform_specific_data: dict | None = None,
        notes: str | None = None,
    ) -> dict:
        """
        Update content library item
        """
        item = await ContentLibraryRepository.get_by_id(session, item_id)
        if not item:
            raise ValueError(f"Content {item_id} not found")

        item = await ContentLibraryRepository.update(
            session=session,
            item=item,
            title=title,
            body=body,
            target_platform=target_platform,
            hashtags=hashtags,
            mentions=mentions,
            tags=tags,
            platform_specific_data=platform_specific_data,
            notes=notes,
        )

        await session.commit()

        logger.info("Content updated", content_id=item_id)

        return ContentLibraryService._item_to_dict(item, include_media=False)

    @staticmethod
    async def delete(
        session: AsyncSession,
        item_id: UUID,
        hard_delete: bool = False,
    ) -> bool:
        """
        Delete content library item

        Args:
            item_id: Content item ID
            hard_delete: If True, permanently delete; otherwise soft delete

        Returns:
            True if deleted
        """
        item = await ContentLibraryRepository.get_by_id(
            session, item_id, include_deleted=hard_delete
        )
        if not item:
            raise ValueError(f"Content {item_id} not found")

        if hard_delete:
            media = await MediaAttachmentRepository.get_by_content_item(
                session, item_id
            )
            for attachment in media:
                await ContentLibraryService._delete_media_file(attachment)

            await ContentLibraryRepository.hard_delete(session, item)
        else:
            await ContentLibraryRepository.soft_delete(session, item)

        await session.commit()

        logger.info(
            "Content deleted",
            content_id=item_id,
            hard_delete=hard_delete,
        )

        return True

    @staticmethod
    async def add_media(
        session: AsyncSession,
        content_library_item_id: UUID,
        file_path: str,
        file_name: str,
        file_size: int,
        mime_type: str,
        width: int | None = None,
        height: int | None = None,
        duration_seconds: float | None = None,
        alt_text: str | None = None,
    ) -> dict:
        """
        Add media attachment to content item

        Args:
            content_library_item_id: Content item ID
            file_path: Path where file is already uploaded
            file_name: Original filename
            file_size: File size in bytes
            mime_type: MIME type
            width: Image/video width
            height: Image/video height
            duration_seconds: Video duration
            alt_text: Accessibility text

        Returns:
            Created attachment data
        """
        item = await ContentLibraryRepository.get_by_id(
            session, content_library_item_id
        )
        if not item:
            raise ValueError(f"Content {content_library_item_id} not found")

        media_type = MIME_TO_MEDIA_TYPE.get(mime_type, MediaType.DOCUMENT)

        existing = await MediaAttachmentRepository.get_by_content_item(
            session, content_library_item_id
        )
        display_order = len(existing)

        attachment = await MediaAttachmentRepository.create(
            session=session,
            content_library_item_id=content_library_item_id,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            media_type=media_type,
            width=width,
            height=height,
            duration_seconds=duration_seconds,
            alt_text=alt_text,
            display_order=display_order,
        )

        await session.commit()

        logger.info(
            "Media added",
            content_id=content_library_item_id,
            attachment_id=attachment.id,
            media_type=media_type.value,
        )

        return ContentLibraryService._attachment_to_dict(attachment)

    @staticmethod
    async def remove_media(
        session: AsyncSession,
        attachment_id: UUID,
        delete_file: bool = True,
    ) -> bool:
        """
        Remove media attachment

        Args:
            attachment_id: Attachment ID
            delete_file: If True, also delete the file from disk

        Returns:
            True if removed
        """
        attachment = await MediaAttachmentRepository.get_by_id(
            session, attachment_id
        )
        if not attachment:
            raise ValueError(f"Attachment {attachment_id} not found")

        if delete_file:
            await ContentLibraryService._delete_media_file(attachment)

        await MediaAttachmentRepository.delete(session, attachment)
        await session.commit()

        logger.info("Media removed", attachment_id=attachment_id)

        return True

    @staticmethod
    async def reorder_media(
        session: AsyncSession,
        content_library_item_id: UUID,
        attachment_order: list[UUID],
    ) -> list[dict]:
        """
        Reorder media attachments

        Args:
            content_library_item_id: Content item ID
            attachment_order: List of attachment IDs in desired order

        Returns:
            Updated attachments list
        """
        attachments = await MediaAttachmentRepository.get_by_content_item(
            session, content_library_item_id
        )

        attachment_map = {a.id: a for a in attachments}

        for i, attachment_id in enumerate(attachment_order):
            if attachment_id in attachment_map:
                await MediaAttachmentRepository.update_display_order(
                    session, attachment_map[attachment_id], i
                )

        await session.commit()

        updated = await MediaAttachmentRepository.get_by_content_item(
            session, content_library_item_id
        )

        return [ContentLibraryService._attachment_to_dict(a) for a in updated]

    @staticmethod
    async def _delete_media_file(attachment: MediaAttachment) -> None:
        """
        Delete media file from disk
        """
        try:
            file_path = Path(attachment.file_path)
            if file_path.exists():
                file_path.unlink()

            if attachment.thumbnail_path:
                thumb_path = Path(attachment.thumbnail_path)
                if thumb_path.exists():
                    thumb_path.unlink()

        except OSError as e:
            logger.warning(
                "Failed to delete media file",
                file_path=attachment.file_path,
                error=str(e),
            )

    @staticmethod
    def _item_to_dict(
        item: ContentLibraryItem,
        include_media: bool = True,
    ) -> dict:
        """
        Convert content item to dict
        """
        result = {
            "id": str(item.id),
            "title": item.title,
            "body": item.body,
            "content_type": item.content_type.value,
            "target_platform": item.target_platform.value if item.target_platform else None,
            "hashtags": item.hashtags,
            "mentions": item.mentions,
            "tags": item.tags,
            "workflow_session_id": str(item.workflow_session_id) if item.workflow_session_id else None,
            "platform_specific_data": item.platform_specific_data,
            "notes": item.notes,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        }

        if include_media and hasattr(item, "media_attachments"):
            result["media_attachments"] = [
                ContentLibraryService._attachment_to_dict(a)
                for a in item.media_attachments
            ]

        return result

    @staticmethod
    def _attachment_to_dict(attachment: MediaAttachment) -> dict:
        """
        Convert attachment to dict
        """
        return {
            "id": str(attachment.id),
            "file_path": attachment.file_path,
            "file_name": attachment.file_name,
            "file_size": attachment.file_size,
            "mime_type": attachment.mime_type,
            "media_type": attachment.media_type.value,
            "width": attachment.width,
            "height": attachment.height,
            "duration_seconds": attachment.duration_seconds,
            "thumbnail_path": attachment.thumbnail_path,
            "alt_text": attachment.alt_text,
            "late_media_id": attachment.late_media_id,
            "late_media_url": attachment.late_media_url,
            "display_order": attachment.display_order,
            "created_at": attachment.created_at.isoformat(),
        }
