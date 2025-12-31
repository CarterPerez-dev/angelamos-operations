"""
ⒸAngelaMos | 2025
accounts.py
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from core.security.auth.dependencies import CurrentUser, DBSession
from core.enums import PlatformType
from core.integrations.later_dev import LateApiClient, LateApiError
from core.foundation.logging import get_logger

from aspects.content_studio.shared.repositories.connected_account import (
    ConnectedAccountRepository,
)
from aspects.content_studio.shared.schemas.scheduler import (
    ConnectedAccountResponse,
    ConnectAccountResponse,
    SyncResponse,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/accounts", tags=["Connected Accounts"])


@router.get("", response_model=list[ConnectedAccountResponse])
async def list_accounts(
    db: DBSession,
    current_user: CurrentUser = None,
    platform: PlatformType | None = None,
    active_only: bool = True,
) -> list[ConnectedAccountResponse]:
    """
    List connected social accounts
    """
    if platform:
        accounts = await ConnectedAccountRepository.get_by_platform(
            db, platform, active_only
        )
    else:
        accounts = await ConnectedAccountRepository.get_all_active(db)

    return [
        ConnectedAccountResponse(
            id=a.id,
            late_account_id=a.late_account_id,
            platform=a.platform,
            platform_username=a.platform_username,
            platform_display_name=a.platform_display_name,
            profile_image_url=a.profile_image_url,
            followers_count=a.followers_count,
            is_active=a.is_active,
            connected_at=a.connected_at,
            last_sync_at=a.last_sync_at,
        )
        for a in accounts
    ]


@router.post("/connect/{platform}", response_model=ConnectAccountResponse)
async def get_connect_url(
    platform: PlatformType,
    db: DBSession,
    current_user: CurrentUser = None,
    redirect_url: str | None = None,
) -> ConnectAccountResponse:
    """
    Get OAuth URL to connect a new social account
    """
    client = LateApiClient()

    try:
        profiles = await client.get_profiles()
        if not profiles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Late profiles found. Create a profile first.",
            )

        profile_id = profiles[0].id

        auth_url = await client.get_connect_url(
            platform=platform.value,
            profile_id=profile_id,
            redirect_url=redirect_url,
        )

        return ConnectAccountResponse(
            auth_url=auth_url,
            platform=platform,
        )

    except LateApiError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Late API error: {e.message}",
        ) from None

    finally:
        await client.close()


@router.delete("/{account_id}")
async def disconnect_account(
    account_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> dict:
    """
    Disconnect a social account
    """
    account = await ConnectedAccountRepository.get_by_id(db, account_id)

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )

    client = LateApiClient()

    try:
        await client.disconnect_account(account.late_account_id)
    except LateApiError as e:
        logger.warning(
            "Failed to disconnect from Late",
            account_id=account_id,
            error=str(e),
        )
    finally:
        await client.close()

    await ConnectedAccountRepository.deactivate(db, account)
    await db.commit()

    return {"status": "disconnected", "account_id": str(account_id)}


@router.post("/sync", response_model=SyncResponse)
async def sync_accounts(
    db: DBSession,
    current_user: CurrentUser = None,
) -> SyncResponse:
    """
    Sync accounts from Late API
    """
    client = LateApiClient()

    try:
        late_accounts = await client.get_accounts()

        synced = 0
        failed = 0

        for late_account in late_accounts:
            try:
                existing = await ConnectedAccountRepository.get_by_late_account_id(
                    db, late_account.id
                )

                if existing:
                    await ConnectedAccountRepository.update_from_late_api(
                        session=db,
                        account=existing,
                        platform_username=late_account.username,
                        platform_display_name=late_account.display_name,
                        profile_image_url=late_account.profile_image_url,
                        followers_count=late_account.followers_count,
                    )
                else:
                    await ConnectedAccountRepository.create(
                        session=db,
                        late_account_id=late_account.id,
                        late_profile_id=late_account.profile_id,
                        platform=PlatformType(late_account.platform),
                        platform_username=late_account.username,
                        platform_display_name=late_account.display_name,
                        profile_image_url=late_account.profile_image_url,
                        followers_count=late_account.followers_count,
                    )

                synced += 1

            except Exception as e:
                logger.error(
                    "Failed to sync account",
                    late_account_id=late_account.id,
                    error=str(e),
                )
                failed += 1

        await db.commit()

        return SyncResponse(synced=synced, failed=failed)

    except LateApiError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Late API error: {e.message}",
        ) from None

    finally:
        await client.close()


@router.get("/{account_id}", response_model=ConnectedAccountResponse)
async def get_account(
    account_id: UUID,
    db: DBSession,
    current_user: CurrentUser = None,
) -> ConnectedAccountResponse:
    """
    Get single connected account
    """
    account = await ConnectedAccountRepository.get_by_id(db, account_id)

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )

    return ConnectedAccountResponse(
        id=account.id,
        late_account_id=account.late_account_id,
        platform=account.platform,
        platform_username=account.platform_username,
        platform_display_name=account.platform_display_name,
        profile_image_url=account.profile_image_url,
        followers_count=account.followers_count,
        is_active=account.is_active,
        connected_at=account.connected_at,
        last_sync_at=account.last_sync_at,
    )
