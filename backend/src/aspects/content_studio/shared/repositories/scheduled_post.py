"""
ⒸAngelaMos | 2025
scheduled_post.py
"""

from datetime import datetime, UTC, timedelta
from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aspects.content_studio.shared.models.scheduling import (
    ScheduledPost,
    ContentLibraryItem,
)
from core.enums import (
    PlatformType,
    ScheduleStatus,
    LatePostStatus,
    ScheduleMode,
)


class ScheduledPostRepository:
    """
    Repository for scheduled posts
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        post_id: UUID,
    ) -> ScheduledPost | None:
        """
        Get scheduled post by ID
        """
        return await session.get(ScheduledPost, post_id)

    @staticmethod
    async def get_by_id_with_relations(
        session: AsyncSession,
        post_id: UUID,
    ) -> ScheduledPost | None:
        """
        Get scheduled post with content and account loaded
        """
        result = await session.execute(
            select(ScheduledPost)
            .options(
                selectinload(ScheduledPost.content_library_item),
                selectinload(ScheduledPost.connected_account),
                selectinload(ScheduledPost.analytics),
            )
            .where(ScheduledPost.id == post_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_late_post_id(
        session: AsyncSession,
        late_post_id: str,
    ) -> ScheduledPost | None:
        """
        Get scheduled post by Late API post ID
        """
        result = await session.execute(
            select(ScheduledPost).where(
                ScheduledPost.late_post_id == late_post_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_batch_id(
        session: AsyncSession,
        batch_id: str,
    ) -> list[ScheduledPost]:
        """
        Get all scheduled posts in a batch (multi-platform schedule)
        """
        result = await session.execute(
            select(ScheduledPost)
            .options(
                selectinload(ScheduledPost.content_library_item),
                selectinload(ScheduledPost.connected_account),
            )
            .where(ScheduledPost.batch_id == batch_id)
            .order_by(ScheduledPost.platform)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_multi(
        session: AsyncSession,
        status: ScheduleStatus | None = None,
        platform: PlatformType | None = None,
        account_id: UUID | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[ScheduledPost]:
        """
        Get scheduled posts with filters
        """
        query = select(ScheduledPost).options(
            selectinload(ScheduledPost.content_library_item),
            selectinload(ScheduledPost.connected_account),
        )

        conditions = []

        if status:
            conditions.append(ScheduledPost.status == status)

        if platform:
            conditions.append(ScheduledPost.platform == platform)

        if account_id:
            conditions.append(ScheduledPost.connected_account_id == account_id)

        if from_date:
            conditions.append(ScheduledPost.scheduled_for >= from_date)

        if to_date:
            conditions.append(ScheduledPost.scheduled_for <= to_date)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(ScheduledPost.scheduled_for.asc())
        query = query.offset(skip).limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_calendar_data(
        session: AsyncSession,
        from_date: datetime,
        to_date: datetime,
        account_ids: list[UUID] | None = None,
    ) -> list[ScheduledPost]:
        """
        Get scheduled posts for calendar view
        """
        query = select(ScheduledPost).options(
            selectinload(ScheduledPost.content_library_item),
            selectinload(ScheduledPost.connected_account),
        ).where(
            and_(
                ScheduledPost.scheduled_for >= from_date,
                ScheduledPost.scheduled_for <= to_date,
                ScheduledPost.status.not_in([ScheduleStatus.CANCELLED]),
            )
        )

        if account_ids:
            query = query.where(
                ScheduledPost.connected_account_id.in_(account_ids)
            )

        query = query.order_by(ScheduledPost.scheduled_for.asc())

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_upcoming(
        session: AsyncSession,
        hours: int = 24,
        limit: int = 20,
    ) -> list[ScheduledPost]:
        """
        Get posts scheduled for the next N hours
        """
        now = datetime.now(UTC)
        end_time = now + timedelta(hours=hours)

        result = await session.execute(
            select(ScheduledPost)
            .options(
                selectinload(ScheduledPost.content_library_item),
                selectinload(ScheduledPost.connected_account),
            )
            .where(
                and_(
                    ScheduledPost.scheduled_for >= now,
                    ScheduledPost.scheduled_for <= end_time,
                    ScheduledPost.status == ScheduleStatus.SCHEDULED,
                )
            )
            .order_by(ScheduledPost.scheduled_for.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_pending_sync(
        session: AsyncSession,
    ) -> list[ScheduledPost]:
        """
        Get posts that need to be synced to Late API
        """
        result = await session.execute(
            select(ScheduledPost)
            .options(
                selectinload(ScheduledPost.content_library_item)
                .selectinload(ContentLibraryItem.media_attachments),
                selectinload(ScheduledPost.connected_account),
            )
            .where(ScheduledPost.status == ScheduleStatus.PENDING_SYNC)
            .order_by(ScheduledPost.created_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_failed(
        session: AsyncSession,
        limit: int = 50,
    ) -> list[ScheduledPost]:
        """
        Get failed posts for retry
        """
        result = await session.execute(
            select(ScheduledPost)
            .options(
                selectinload(ScheduledPost.content_library_item),
                selectinload(ScheduledPost.connected_account),
            )
            .where(ScheduledPost.status == ScheduleStatus.FAILED)
            .order_by(ScheduledPost.failed_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(
        session: AsyncSession,
        content_library_item_id: UUID,
        connected_account_id: UUID,
        platform: PlatformType,
        scheduled_for: datetime,
        schedule_mode: ScheduleMode,
        timezone: str = "UTC",
        batch_id: str | None = None,
        platform_specific_config: dict | None = None,
    ) -> ScheduledPost:
        """
        Create new scheduled post
        """
        post = ScheduledPost(
            content_library_item_id=content_library_item_id,
            connected_account_id=connected_account_id,
            platform=platform,
            scheduled_for=scheduled_for,
            timezone=timezone,
            status=ScheduleStatus.DRAFT,
            schedule_mode=schedule_mode,
            batch_id=batch_id,
            platform_specific_config=platform_specific_config,
        )

        session.add(post)
        await session.flush()
        await session.refresh(post)
        return post

    @staticmethod
    async def update_status(
        session: AsyncSession,
        post: ScheduledPost,
        status: ScheduleStatus,
        late_post_id: str | None = None,
        late_status: LatePostStatus | None = None,
        platform_post_id: str | None = None,
        platform_post_url: str | None = None,
        error_message: str | None = None,
    ) -> ScheduledPost:
        """
        Update post status
        """
        post.status = status

        if late_post_id is not None:
            post.late_post_id = late_post_id

        if late_status is not None:
            post.late_status = late_status

        if platform_post_id is not None:
            post.platform_post_id = platform_post_id

        if platform_post_url is not None:
            post.platform_post_url = platform_post_url

        if status == ScheduleStatus.PUBLISHED:
            post.published_at = datetime.now(UTC)

        if status == ScheduleStatus.FAILED:
            post.failed_at = datetime.now(UTC)
            post.retry_count += 1
            if error_message:
                post.error_message = error_message

        await session.flush()
        await session.refresh(post)
        return post

    @staticmethod
    async def reschedule(
        session: AsyncSession,
        post: ScheduledPost,
        scheduled_for: datetime,
        timezone: str | None = None,
    ) -> ScheduledPost:
        """
        Reschedule a post to new time
        """
        post.scheduled_for = scheduled_for

        if timezone:
            post.timezone = timezone

        if post.status == ScheduleStatus.SCHEDULED:
            post.status = ScheduleStatus.PENDING_SYNC

        await session.flush()
        await session.refresh(post)
        return post

    @staticmethod
    async def cancel(
        session: AsyncSession,
        post: ScheduledPost,
    ) -> ScheduledPost:
        """
        Cancel a scheduled post
        """
        post.status = ScheduleStatus.CANCELLED
        await session.flush()
        await session.refresh(post)
        return post

    @staticmethod
    async def delete(
        session: AsyncSession,
        post: ScheduledPost,
    ) -> None:
        """
        Permanently delete scheduled post
        """
        await session.delete(post)
        await session.flush()

    @staticmethod
    async def count_by_status(
        session: AsyncSession,
    ) -> dict[ScheduleStatus, int]:
        """
        Count posts by status
        """
        result = await session.execute(
            select(ScheduledPost.status, func.count(ScheduledPost.id))
            .group_by(ScheduledPost.status)
        )

        return {row[0]: row[1] for row in result.all()}

    @staticmethod
    async def count_by_platform(
        session: AsyncSession,
        status: ScheduleStatus | None = None,
    ) -> dict[PlatformType, int]:
        """
        Count posts by platform
        """
        query = select(ScheduledPost.platform, func.count(ScheduledPost.id))

        if status:
            query = query.where(ScheduledPost.status == status)

        query = query.group_by(ScheduledPost.platform)

        result = await session.execute(query)
        return {row[0]: row[1] for row in result.all()}
