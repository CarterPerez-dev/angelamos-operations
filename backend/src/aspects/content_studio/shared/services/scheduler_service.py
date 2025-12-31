"""
ⒸAngelaMos | 2025
scheduler_service.py
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.models.scheduling import (
    ScheduledPost,
)
from aspects.content_studio.shared.repositories.scheduled_post import (
    ScheduledPostRepository,
)
from aspects.content_studio.shared.repositories.connected_account import (
    ConnectedAccountRepository,
)
from aspects.content_studio.shared.repositories.content_library import (
    ContentLibraryRepository,
)
from core.enums import (
    ScheduleStatus,
    LatePostStatus,
    ScheduleMode,
)
from core.integrations.later_dev import (
    LateApiClient,
    LatePostCreate,
    LatePlatformTarget,
    LateMediaItem,
    LateApiError,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)


class SchedulerService:
    """
    Service for scheduling posts to social platforms via Late API

    Handles:
    - Single and multi-platform scheduling
    - Late API synchronization
    - Post status tracking
    - Calendar data retrieval
    - Rescheduling and cancellation
    """

    @staticmethod
    async def schedule_single(
        session: AsyncSession,
        content_library_item_id: UUID,
        connected_account_id: UUID,
        scheduled_for: datetime,
        timezone: str = "UTC",
        platform_specific_config: dict | None = None,
        sync_immediately: bool = True,
    ) -> dict:
        """
        Schedule post to single platform

        Args:
            content_library_item_id: Content to schedule
            connected_account_id: Target account
            scheduled_for: When to publish
            timezone: User timezone
            platform_specific_config: Platform-specific settings
            sync_immediately: If True, sync to Late API right away

        Returns:
            Scheduled post data
        """
        account = await ConnectedAccountRepository.get_by_id(
            session, connected_account_id
        )
        if not account:
            raise ValueError(f"Account {connected_account_id} not found")

        if not account.is_active:
            raise ValueError(f"Account {connected_account_id} is not active")

        content = await ContentLibraryRepository.get_by_id_with_media(
            session, content_library_item_id
        )
        if not content:
            raise ValueError(f"Content {content_library_item_id} not found")

        status = ScheduleStatus.PENDING_SYNC if sync_immediately else ScheduleStatus.DRAFT

        post = await ScheduledPostRepository.create(
            session=session,
            content_library_item_id=content_library_item_id,
            connected_account_id=connected_account_id,
            platform=account.platform,
            scheduled_for=scheduled_for,
            timezone=timezone,
            schedule_mode=ScheduleMode.SINGLE_PLATFORM,
            platform_specific_config=platform_specific_config,
        )

        post = await ScheduledPostRepository.update_status(
            session=session,
            post=post,
            status=status,
        )

        await session.commit()

        if sync_immediately:
            await SchedulerService._sync_to_late(session, post)

        logger.info(
            "Single post scheduled",
            post_id=post.id,
            platform=account.platform.value,
            scheduled_for=scheduled_for.isoformat(),
        )

        return SchedulerService.post_to_dict(post)

    @staticmethod
    async def schedule_multi(
        session: AsyncSession,
        content_library_item_id: UUID,
        account_schedules: list[dict],
        timezone: str = "UTC",
        sync_immediately: bool = True,
    ) -> dict:
        """
        Schedule post to multiple platforms

        Args:
            content_library_item_id: Content to schedule
            account_schedules: List of dicts with:
                - connected_account_id: UUID
                - scheduled_for: datetime
                - platform_specific_config: dict (optional)
            timezone: User timezone
            sync_immediately: If True, sync to Late API right away

        Returns:
            Batch data with all scheduled posts
        """
        content = await ContentLibraryRepository.get_by_id_with_media(
            session, content_library_item_id
        )
        if not content:
            raise ValueError(f"Content {content_library_item_id} not found")

        batch_id = str(uuid4())
        posts = []

        for schedule in account_schedules:
            account = await ConnectedAccountRepository.get_by_id(
                session, schedule["connected_account_id"]
            )
            if not account:
                raise ValueError(f"Account {schedule['connected_account_id']} not found")

            if not account.is_active:
                raise ValueError(f"Account {account.platform.value} is not active")

            status = ScheduleStatus.PENDING_SYNC if sync_immediately else ScheduleStatus.DRAFT

            post = await ScheduledPostRepository.create(
                session=session,
                content_library_item_id=content_library_item_id,
                connected_account_id=schedule["connected_account_id"],
                platform=account.platform,
                scheduled_for=schedule["scheduled_for"],
                timezone=timezone,
                schedule_mode=ScheduleMode.MULTI_PLATFORM,
                batch_id=batch_id,
                platform_specific_config=schedule.get("platform_specific_config"),
            )

            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=status,
            )

            posts.append(post)

        await session.commit()

        if sync_immediately:
            for post in posts:
                await SchedulerService._sync_to_late(session, post)

        logger.info(
            "Multi-platform posts scheduled",
            batch_id=batch_id,
            platforms=[p.platform.value for p in posts],
            count=len(posts),
        )

        return {
            "batch_id": batch_id,
            "posts": [SchedulerService.post_to_dict(p) for p in posts],
        }

    @staticmethod
    async def reschedule(
        session: AsyncSession,
        post_id: UUID,
        scheduled_for: datetime,
        timezone: str | None = None,
    ) -> dict:
        """
        Reschedule a post to new time

        Updates both local database and Late API if already synced
        """
        post = await ScheduledPostRepository.get_by_id_with_relations(
            session, post_id
        )
        if not post:
            raise ValueError(f"Post {post_id} not found")

        if post.status in [ScheduleStatus.PUBLISHED, ScheduleStatus.CANCELLED]:
            raise ValueError(f"Cannot reschedule post with status {post.status.value}")

        post = await ScheduledPostRepository.reschedule(
            session=session,
            post=post,
            scheduled_for=scheduled_for,
            timezone=timezone,
        )

        await session.commit()

        if post.late_post_id:
            await SchedulerService._update_late_schedule(session, post)

        logger.info(
            "Post rescheduled",
            post_id=post_id,
            new_time=scheduled_for.isoformat(),
        )

        return SchedulerService.post_to_dict(post)

    @staticmethod
    async def cancel(
        session: AsyncSession,
        post_id: UUID,
    ) -> dict:
        """
        Cancel a scheduled post

        Deletes from Late API if already synced
        """
        post = await ScheduledPostRepository.get_by_id_with_relations(
            session, post_id
        )
        if not post:
            raise ValueError(f"Post {post_id} not found")

        if post.status == ScheduleStatus.PUBLISHED:
            raise ValueError("Cannot cancel already published post")

        if post.late_post_id:
            await SchedulerService._delete_from_late(post)

        post = await ScheduledPostRepository.cancel(session, post)
        await session.commit()

        logger.info("Post cancelled", post_id=post_id)

        return SchedulerService.post_to_dict(post)

    @staticmethod
    async def publish_now(
        session: AsyncSession,
        post_id: UUID,
    ) -> dict:
        """
        Publish a post immediately instead of waiting for schedule
        """
        post = await ScheduledPostRepository.get_by_id_with_relations(
            session, post_id
        )
        if not post:
            raise ValueError(f"Post {post_id} not found")

        if post.status == ScheduleStatus.PUBLISHED:
            raise ValueError("Post already published")

        post = await ScheduledPostRepository.update_status(
            session=session,
            post=post,
            status=ScheduleStatus.PUBLISHING,
        )

        await session.commit()

        try:
            await SchedulerService._publish_via_late(session, post)
        except LateApiError as e:
            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=ScheduleStatus.FAILED,
                error_message=str(e),
            )
            await session.commit()
            raise

        logger.info("Post published immediately", post_id=post_id)

        return SchedulerService.post_to_dict(post)

    @staticmethod
    async def get_calendar_data(
        session: AsyncSession,
        from_date: datetime,
        to_date: datetime,
        account_ids: list[UUID] | None = None,
    ) -> list[dict]:
        """
        Get scheduled posts for calendar view
        """
        posts = await ScheduledPostRepository.get_calendar_data(
            session=session,
            from_date=from_date,
            to_date=to_date,
            account_ids=account_ids,
        )

        return [SchedulerService.post_to_dict(p) for p in posts]

    @staticmethod
    async def get_upcoming(
        session: AsyncSession,
        hours: int = 24,
        limit: int = 20,
    ) -> list[dict]:
        """
        Get posts scheduled for the next N hours
        """
        posts = await ScheduledPostRepository.get_upcoming(
            session=session,
            hours=hours,
            limit=limit,
        )

        return [SchedulerService.post_to_dict(p) for p in posts]

    @staticmethod
    async def sync_pending(
        session: AsyncSession,
    ) -> dict:
        """
        Sync all pending posts to Late API

        Called by background job
        """
        posts = await ScheduledPostRepository.get_pending_sync(session)

        synced = 0
        failed = 0

        for post in posts:
            try:
                await SchedulerService._sync_to_late(session, post)
                synced += 1
            except LateApiError as e:
                logger.error(
                    "Failed to sync post",
                    post_id=post.id,
                    error=str(e),
                )
                failed += 1

        logger.info(
            "Sync complete",
            synced=synced,
            failed=failed,
        )

        return {
            "synced": synced,
            "failed": failed,
        }

    @staticmethod
    async def _sync_to_late(
        session: AsyncSession,
        post: ScheduledPost,
    ) -> None:
        """
        Sync scheduled post to Late API
        """
        client = LateApiClient()

        try:
            content = await ContentLibraryRepository.get_by_id_with_media(
                session, post.content_library_item_id
            )
            account = await ConnectedAccountRepository.get_by_id(
                session, post.connected_account_id
            )

            if not content or not account:
                raise ValueError("Content or account not found")

            media_items = []
            for attachment in content.media_attachments:
                media_items.append(
                    LateMediaItem(
                        url=attachment.late_media_url,
                        type=attachment.media_type.value,
                        alt_text=attachment.alt_text,
                    )
                )

            platform_target = LatePlatformTarget(
                platform=post.platform.value,
                account_id=account.late_account_id,
            )

            post_create = LatePostCreate(
                content=content.body,
                title=content.title,
                media_items=media_items,
                platforms=[platform_target],
                scheduled_for=post.scheduled_for,
                timezone=post.timezone,
                hashtags=content.hashtags,
                mentions=content.mentions,
            )

            late_post = await client.create_post(post_create)

            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=ScheduleStatus.SCHEDULED,
                late_post_id=late_post.id,
                late_status=LatePostStatus(late_post.status),
            )

            await session.commit()

            logger.info(
                "Post synced to Late",
                post_id=post.id,
                late_post_id=late_post.id,
            )

        except LateApiError as e:
            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=ScheduleStatus.FAILED,
                error_message=str(e),
            )
            await session.commit()
            raise

        finally:
            await client.close()

    @staticmethod
    async def _update_late_schedule(
        session: AsyncSession,
        post: ScheduledPost,
    ) -> None:
        """
        Update schedule time in Late API
        """
        if not post.late_post_id:
            return

        client = LateApiClient()

        try:
            from core.integrations.later_dev import LatePostUpdate

            update_data = LatePostUpdate(
                scheduled_for=post.scheduled_for,
                timezone=post.timezone,
            )

            await client.update_post(post.late_post_id, update_data)

            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=ScheduleStatus.SCHEDULED,
            )
            await session.commit()

        finally:
            await client.close()

    @staticmethod
    async def _delete_from_late(post: ScheduledPost) -> None:
        """
        Delete post from Late API
        """
        if not post.late_post_id:
            return

        client = LateApiClient()

        try:
            await client.delete_post(post.late_post_id)
        finally:
            await client.close()

    @staticmethod
    async def _publish_via_late(
        session: AsyncSession,
        post: ScheduledPost,
    ) -> None:
        """
        Publish post immediately via Late API
        """
        client = LateApiClient()

        try:
            content = await ContentLibraryRepository.get_by_id_with_media(
                session, post.content_library_item_id
            )
            account = await ConnectedAccountRepository.get_by_id(
                session, post.connected_account_id
            )

            if not content or not account:
                raise ValueError("Content or account not found")

            media_items = []
            for attachment in content.media_attachments:
                if attachment.late_media_url:
                    media_items.append(
                        LateMediaItem(
                            url=attachment.late_media_url,
                            type=attachment.media_type.value,
                            alt_text=attachment.alt_text,
                        )
                    )

            platform_target = LatePlatformTarget(
                platform=post.platform.value,
                account_id=account.late_account_id,
            )

            post_create = LatePostCreate(
                content=content.body,
                title=content.title,
                media_items=media_items,
                platforms=[platform_target],
                publish_now=True,
                hashtags=content.hashtags,
                mentions=content.mentions,
            )

            late_post = await client.create_post(post_create)

            platform_data = late_post.platforms[0] if late_post.platforms else None

            post = await ScheduledPostRepository.update_status(
                session=session,
                post=post,
                status=ScheduleStatus.PUBLISHED,
                late_post_id=late_post.id,
                late_status=LatePostStatus(late_post.status),
                platform_post_id=platform_data.platform_post_id if platform_data else None,
                platform_post_url=platform_data.platform_post_url if platform_data else None,
            )

            await session.commit()

        finally:
            await client.close()

    @staticmethod
    def post_to_dict(post: ScheduledPost) -> dict:
        """
        Convert scheduled post to dict for API response
        """
        result = {
            "id": str(post.id),
            "content_library_item_id": str(post.content_library_item_id),
            "connected_account_id": str(post.connected_account_id),
            "platform": post.platform.value,
            "scheduled_for": post.scheduled_for.isoformat(),
            "timezone": post.timezone,
            "status": post.status.value,
            "late_status": post.late_status.value if post.late_status else None,
            "schedule_mode": post.schedule_mode.value,
            "batch_id": post.batch_id,
            "late_post_id": post.late_post_id,
            "platform_post_id": post.platform_post_id,
            "platform_post_url": post.platform_post_url,
            "published_at": post.published_at.isoformat() if post.published_at else None,
            "failed_at": post.failed_at.isoformat() if post.failed_at else None,
            "error_message": post.error_message,
            "retry_count": post.retry_count,
            "created_at": post.created_at.isoformat(),
        }

        if hasattr(post, "content_library_item") and post.content_library_item:
            result["content"] = {
                "id": str(post.content_library_item.id),
                "title": post.content_library_item.title,
                "body": post.content_library_item.body[:200] if post.content_library_item.body else None,
            }

        if hasattr(post, "connected_account") and post.connected_account:
            result["account"] = {
                "id": str(post.connected_account.id),
                "platform": post.connected_account.platform.value,
                "username": post.connected_account.platform_username,
                "display_name": post.connected_account.platform_display_name,
                "profile_image_url": post.connected_account.profile_image_url,
            }

        return result
