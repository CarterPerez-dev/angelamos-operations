"""
ⒸAngelaMos | 2025
connected_account.py
"""

from datetime import datetime, UTC
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aspects.content_studio.shared.models.scheduling import (
    ConnectedAccount,
)
from core.enums import PlatformType


class ConnectedAccountRepository:
    """
    Repository for Late API connected social accounts
    """

    @staticmethod
    async def get_by_id(
        session: AsyncSession,
        account_id: UUID,
    ) -> ConnectedAccount | None:
        """
        Get connected account by ID
        """
        return await session.get(ConnectedAccount, account_id)

    @staticmethod
    async def get_by_late_account_id(
        session: AsyncSession,
        late_account_id: str,
    ) -> ConnectedAccount | None:
        """
        Get connected account by Late API account ID
        """
        result = await session.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.late_account_id == late_account_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_active(
        session: AsyncSession,
    ) -> list[ConnectedAccount]:
        """
        Get all active connected accounts
        """
        result = await session.execute(
            select(ConnectedAccount).where(
                ConnectedAccount.is_active == True
            ).order_by(ConnectedAccount.platform, ConnectedAccount.platform_username)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_platform(
        session: AsyncSession,
        platform: PlatformType,
        active_only: bool = True,
    ) -> list[ConnectedAccount]:
        """
        Get connected accounts for a specific platform
        """
        query = select(ConnectedAccount).where(
            ConnectedAccount.platform == platform
        )

        if active_only:
            query = query.where(ConnectedAccount.is_active == True)

        query = query.order_by(ConnectedAccount.platform_username)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create(
        session: AsyncSession,
        late_account_id: str,
        late_profile_id: str,
        platform: PlatformType,
        platform_username: str,
        platform_display_name: str | None = None,
        profile_image_url: str | None = None,
        followers_count: int | None = None,
        platform_metadata: dict | None = None,
    ) -> ConnectedAccount:
        """
        Create new connected account
        """
        account = ConnectedAccount(
            late_account_id=late_account_id,
            late_profile_id=late_profile_id,
            platform=platform,
            platform_username=platform_username,
            platform_display_name=platform_display_name,
            profile_image_url=profile_image_url,
            followers_count=followers_count,
            is_active=True,
            connected_at=datetime.now(UTC),
            platform_metadata=platform_metadata,
        )

        session.add(account)
        await session.flush()
        await session.refresh(account)
        return account

    @staticmethod
    async def update_from_late_api(
        session: AsyncSession,
        account: ConnectedAccount,
        platform_username: str | None = None,
        platform_display_name: str | None = None,
        profile_image_url: str | None = None,
        followers_count: int | None = None,
        platform_metadata: dict | None = None,
    ) -> ConnectedAccount:
        """
        Update account with data from Late API sync
        """
        if platform_username is not None:
            account.platform_username = platform_username
        if platform_display_name is not None:
            account.platform_display_name = platform_display_name
        if profile_image_url is not None:
            account.profile_image_url = profile_image_url
        if followers_count is not None:
            account.followers_count = followers_count
        if platform_metadata is not None:
            account.platform_metadata = platform_metadata

        account.last_sync_at = datetime.now(UTC)

        await session.flush()
        await session.refresh(account)
        return account

    @staticmethod
    async def deactivate(
        session: AsyncSession,
        account: ConnectedAccount,
    ) -> ConnectedAccount:
        """
        Deactivate a connected account (disconnect)
        """
        account.is_active = False
        await session.flush()
        await session.refresh(account)
        return account

    @staticmethod
    async def reactivate(
        session: AsyncSession,
        account: ConnectedAccount,
    ) -> ConnectedAccount:
        """
        Reactivate a previously disconnected account
        """
        account.is_active = True
        account.connected_at = datetime.now(UTC)
        await session.flush()
        await session.refresh(account)
        return account

    @staticmethod
    async def delete(
        session: AsyncSession,
        account: ConnectedAccount,
    ) -> None:
        """
        Permanently delete a connected account
        """
        await session.delete(account)
        await session.flush()

    @staticmethod
    async def get_with_follower_stats(
        session: AsyncSession,
        account_id: UUID,
    ) -> ConnectedAccount | None:
        """
        Get account with recent follower stats loaded
        """
        result = await session.execute(
            select(ConnectedAccount)
            .options(selectinload(ConnectedAccount.follower_stats))
            .where(ConnectedAccount.id == account_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def count_by_platform(
        session: AsyncSession,
    ) -> dict[PlatformType, int]:
        """
        Count active accounts per platform
        """
        result = await session.execute(
            select(ConnectedAccount.platform).where(
                ConnectedAccount.is_active == True
            )
        )

        counts: dict[PlatformType, int] = {}
        for row in result.all():
            platform = row[0]
            counts[platform] = counts.get(platform, 0) + 1

        return counts
