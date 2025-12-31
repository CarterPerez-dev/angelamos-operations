"""
ⒸAngelaMos | 2025
content_library.py
"""

from uuid import UUID

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aspects.content_studio.shared.models.scheduling import (
    ContentLibraryItem,
    MediaAttachment,
)
from core.enums import (
    PlatformType,
    ContentLibraryType,
    MediaType,
)


class ContentLibraryRepository:
    """
    Repository for content library items
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        item_id: UUID,
        include_deleted: bool = False,
    ) -> ContentLibraryItem | None:
        """
        Get content library item by ID
        """
        query = select(ContentLibraryItem).where(
            ContentLibraryItem.id == item_id
        )

        if not include_deleted:
            query = query.where(ContentLibraryItem.is_deleted == False)

        result = await session.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_id_with_media(
        session: AsyncSession,
        item_id: UUID,
    ) -> ContentLibraryItem | None:
        """
        Get content library item with media attachments loaded
        """
        result = await session.execute(
            select(ContentLibraryItem)
            .options(selectinload(ContentLibraryItem.media_attachments))
            .where(
                and_(
                    ContentLibraryItem.id == item_id,
                    ContentLibraryItem.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_multi(
        session: AsyncSession,
        content_type: ContentLibraryType | None = None,
        target_platform: PlatformType | None = None,
        tags: list[str] | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
        include_media: bool = False,
    ) -> list[ContentLibraryItem]:
        """
        Get content library items with filters
        """
        query = select(ContentLibraryItem).where(
            ContentLibraryItem.is_deleted == False
        )

        if include_media:
            query = query.options(selectinload(ContentLibraryItem.media_attachments))

        if content_type:
            query = query.where(ContentLibraryItem.content_type == content_type)

        if target_platform:
            query = query.where(ContentLibraryItem.target_platform == target_platform)

        if tags:
            query = query.where(ContentLibraryItem.tags.overlap(tags))

        if search:
            search_filter = or_(
                ContentLibraryItem.title.ilike(f"%{search}%"),
                ContentLibraryItem.body.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)

        query = query.order_by(ContentLibraryItem.created_at.desc())
        query = query.offset(skip).limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count(
        session: AsyncSession,
        content_type: ContentLibraryType | None = None,
        target_platform: PlatformType | None = None,
    ) -> int:
        """
        Count content library items
        """
        query = select(func.count(ContentLibraryItem.id)).where(
            ContentLibraryItem.is_deleted == False
        )

        if content_type:
            query = query.where(ContentLibraryItem.content_type == content_type)

        if target_platform:
            query = query.where(ContentLibraryItem.target_platform == target_platform)

        result = await session.execute(query)
        return result.scalar_one()

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
    ) -> ContentLibraryItem:
        """
        Create new content library item
        """
        item = ContentLibraryItem(
            title=title,
            body=body,
            content_type=content_type,
            target_platform=target_platform,
            hashtags=hashtags or [],
            mentions=mentions or [],
            tags=tags or [],
            workflow_session_id=workflow_session_id,
            platform_specific_data=platform_specific_data,
            notes=notes,
        )

        session.add(item)
        await session.flush()
        await session.refresh(item)
        return item

    @staticmethod
    async def update(
        session: AsyncSession,
        item: ContentLibraryItem,
        title: str | None = None,
        body: str | None = None,
        target_platform: PlatformType | None = None,
        hashtags: list[str] | None = None,
        mentions: list[str] | None = None,
        tags: list[str] | None = None,
        platform_specific_data: dict | None = None,
        notes: str | None = None,
    ) -> ContentLibraryItem:
        """
        Update content library item
        """
        if title is not None:
            item.title = title
        if body is not None:
            item.body = body
        if target_platform is not None:
            item.target_platform = target_platform
        if hashtags is not None:
            item.hashtags = hashtags
        if mentions is not None:
            item.mentions = mentions
        if tags is not None:
            item.tags = tags
        if platform_specific_data is not None:
            item.platform_specific_data = platform_specific_data
        if notes is not None:
            item.notes = notes

        await session.flush()
        await session.refresh(item)
        return item

    @staticmethod
    async def soft_delete(
        session: AsyncSession,
        item: ContentLibraryItem,
    ) -> ContentLibraryItem:
        """
        Soft delete content library item
        """
        item.soft_delete()
        await session.flush()
        await session.refresh(item)
        return item

    @staticmethod
    async def restore(
        session: AsyncSession,
        item: ContentLibraryItem,
    ) -> ContentLibraryItem:
        """
        Restore soft-deleted content library item
        """
        item.restore()
        await session.flush()
        await session.refresh(item)
        return item

    @staticmethod
    async def hard_delete(
        session: AsyncSession,
        item: ContentLibraryItem,
    ) -> None:
        """
        Permanently delete content library item
        """
        await session.delete(item)
        await session.flush()

    @staticmethod
    async def get_by_workflow_session(
        session: AsyncSession,
        workflow_session_id: UUID,
    ) -> ContentLibraryItem | None:
        """
        Get content library item created from workflow session
        """
        result = await session.execute(
            select(ContentLibraryItem).where(
                and_(
                    ContentLibraryItem.workflow_session_id == workflow_session_id,
                    ContentLibraryItem.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()


class MediaAttachmentRepository:
    """
    Repository for media attachments
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        attachment_id: UUID,
    ) -> MediaAttachment | None:
        """
        Get media attachment by ID
        """
        return await session.get(MediaAttachment, attachment_id)

    @staticmethod
    async def get_by_content_item(
        session: AsyncSession,
        content_library_item_id: UUID,
    ) -> list[MediaAttachment]:
        """
        Get all media attachments for a content library item
        """
        result = await session.execute(
            select(MediaAttachment)
            .where(MediaAttachment.content_library_item_id == content_library_item_id)
            .order_by(MediaAttachment.display_order)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        session: AsyncSession,
        content_library_item_id: UUID,
        file_path: str,
        file_name: str,
        file_size: int,
        mime_type: str,
        media_type: MediaType,
        width: int | None = None,
        height: int | None = None,
        duration_seconds: float | None = None,
        thumbnail_path: str | None = None,
        alt_text: str | None = None,
        display_order: int = 0,
    ) -> MediaAttachment:
        """
        Create new media attachment
        """
        attachment = MediaAttachment(
            content_library_item_id=content_library_item_id,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            media_type=media_type,
            width=width,
            height=height,
            duration_seconds=duration_seconds,
            thumbnail_path=thumbnail_path,
            alt_text=alt_text,
            display_order=display_order,
        )

        session.add(attachment)
        await session.flush()
        await session.refresh(attachment)
        return attachment

    @staticmethod
    async def update_late_media(
        session: AsyncSession,
        attachment: MediaAttachment,
        late_media_id: str,
        late_media_url: str | None = None,
    ) -> MediaAttachment:
        """
        Update attachment with Late API media ID after upload
        """
        attachment.late_media_id = late_media_id
        if late_media_url:
            attachment.late_media_url = late_media_url

        await session.flush()
        await session.refresh(attachment)
        return attachment

    @staticmethod
    async def update_display_order(
        session: AsyncSession,
        attachment: MediaAttachment,
        display_order: int,
    ) -> MediaAttachment:
        """
        Update display order of attachment
        """
        attachment.display_order = display_order
        await session.flush()
        await session.refresh(attachment)
        return attachment

    @staticmethod
    async def delete(
        session: AsyncSession,
        attachment: MediaAttachment,
    ) -> None:
        """
        Delete media attachment
        """
        await session.delete(attachment)
        await session.flush()
