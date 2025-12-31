"""
ⒸAngelaMos | 2025
client.py
"""

from datetime import datetime
from typing import Any

import httpx

from config import settings
from core.foundation.logging import get_logger
from core.integrations.later_dev.exceptions import (
    LateApiError,
    LateAuthenticationError,
    LateConnectionError,
    LateNotFoundError,
    LateRateLimitError,
    LateValidationError,
)
from core.integrations.later_dev.models import (
    LateAccount,
    LateAnalytics,
    LateFollowerStats,
    LateOAuthResponse,
    LatePost,
    LatePostCreate,
    LatePostUpdate,
    LateProfile,
)

logger = get_logger(__name__)


class LateApiClient:
    """
    Async HTTP client for Late API (getlate.dev)

    Handles authentication, rate limiting, and error handling for all
    Late API operations including posts, accounts, profiles, and analytics.
    """

    BASE_URL = "https://getlate.dev/api/v1"
    DEFAULT_TIMEOUT = 30.0

    def __init__(self, api_key: str | None = None) -> None:
        """
        Initialize Late API client

        Args:
            api_key: Late API key (defaults to settings.LATER_DEV_API_KEY)
        """
        self.api_key = api_key or (
            settings.LATER_DEV_API_KEY.get_secret_value()
            if settings.LATER_DEV_API_KEY
            else None
        )

        if not self.api_key:
            raise LateAuthenticationError("Late API key not configured")

        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """
        Get or create async HTTP client
        """
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                timeout=self.DEFAULT_TIMEOUT,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def close(self) -> None:
        """
        Close the HTTP client
        """
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, Any] | None = None,
        json_data: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Make authenticated request to Late API
        """
        client = await self._get_client()

        logger.debug(
            "Late API request",
            method=method,
            endpoint=endpoint,
            params=params,
        )

        try:
            if files:
                response = await client.request(
                    method=method,
                    url=endpoint,
                    params=params,
                    files=files,
                )
            else:
                response = await client.request(
                    method=method,
                    url=endpoint,
                    params=params,
                    json=json_data,
                )

            self._log_rate_limits(response)

            if response.status_code == 401:
                raise LateAuthenticationError(
                    response_data=response.json() if response.content else None
                )

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise LateRateLimitError(
                    retry_after=int(retry_after) if retry_after else None,
                    response_data=response.json() if response.content else None,
                )

            if response.status_code == 404:
                raise LateNotFoundError(
                    resource_type="Resource",
                    resource_id=endpoint,
                    response_data=response.json() if response.content else None,
                )

            if response.status_code == 400:
                data = response.json() if response.content else {}
                raise LateValidationError(
                    message=data.get("error", "Invalid request"),
                    errors=data.get("errors", []),
                    response_data=data,
                )

            if response.status_code >= 400:
                data = response.json() if response.content else {}
                raise LateApiError(
                    message=data.get("error", f"API error: {response.status_code}"),
                    status_code=response.status_code,
                    response_data=data,
                )

            if response.status_code == 204:
                return {}

            return response.json()

        except httpx.RequestError as e:
            logger.error("Late API connection error", error=str(e))
            raise LateConnectionError(original_error=e) from e

    def _log_rate_limits(self, response: httpx.Response) -> None:
        """
        Log rate limit headers from response
        """
        limit = response.headers.get("X-RateLimit-Limit")
        remaining = response.headers.get("X-RateLimit-Remaining")
        reset = response.headers.get("X-RateLimit-Reset")

        if remaining and int(remaining) < 10:
            logger.warning(
                "Late API rate limit low",
                limit=limit,
                remaining=remaining,
                reset=reset,
            )

    async def get_profiles(self) -> list[LateProfile]:
        """
        List all profiles
        """
        data = await self._request("GET", "/profiles")
        return [LateProfile(**p) for p in data.get("profiles", data)]

    async def create_profile(
        self,
        name: str,
        description: str | None = None,
        color: str | None = None,
    ) -> LateProfile:
        """
        Create a new profile
        """
        data = await self._request(
            "POST",
            "/profiles",
            json_data={
                "name": name,
                "description": description,
                "color": color,
            },
        )
        return LateProfile(**data)

    async def get_accounts(
        self,
        profile_id: str | None = None,
    ) -> list[LateAccount]:
        """
        List connected social accounts
        """
        params = {}
        if profile_id:
            params["profileId"] = profile_id

        data = await self._request("GET", "/accounts", params=params)
        return [LateAccount(**a) for a in data.get("accounts", data)]

    async def get_connect_url(
        self,
        platform: str,
        profile_id: str,
        redirect_url: str | None = None,
        headless: bool = False,
    ) -> str:
        """
        Get OAuth URL to connect a new social account
        """
        params = {"profileId": profile_id}
        if redirect_url:
            params["redirect_url"] = redirect_url
        if headless:
            params["headless"] = "true"

        data = await self._request("GET", f"/connect/{platform}", params=params)
        return LateOAuthResponse(**data).auth_url

    async def disconnect_account(self, account_id: str) -> bool:
        """
        Disconnect a social account
        """
        await self._request("DELETE", f"/accounts/{account_id}")
        return True

    async def get_posts(
        self,
        status: str | None = None,
        platform: str | None = None,
        profile_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> list[LatePost]:
        """
        List posts with optional filters
        """
        params: dict[str, Any] = {"page": page, "limit": limit}

        if status:
            params["status"] = status
        if platform:
            params["platform"] = platform
        if profile_id:
            params["profileId"] = profile_id
        if date_from:
            params["dateFrom"] = date_from.isoformat()
        if date_to:
            params["dateTo"] = date_to.isoformat()

        data = await self._request("GET", "/posts", params=params)
        return [LatePost(**p) for p in data.get("posts", data)]

    async def get_post(self, post_id: str) -> LatePost:
        """
        Get a single post by ID
        """
        data = await self._request("GET", f"/posts/{post_id}")
        return LatePost(**data)

    async def create_post(self, post_data: LatePostCreate) -> LatePost:
        """
        Create a new post (draft, scheduled, or immediate)
        """
        json_data = post_data.model_dump(by_alias=True, exclude_none=True)
        data = await self._request("POST", "/posts", json_data=json_data)

        logger.info(
            "Late post created",
            post_id=data.get("_id"),
            status=data.get("status"),
            platforms=[p.get("platform") for p in data.get("platforms", [])],
        )

        return LatePost(**data)

    async def update_post(
        self,
        post_id: str,
        update_data: LatePostUpdate,
    ) -> LatePost:
        """
        Update an existing post
        """
        json_data = update_data.model_dump(by_alias=True, exclude_none=True)
        data = await self._request("PUT", f"/posts/{post_id}", json_data=json_data)

        logger.info(
            "Late post updated",
            post_id=post_id,
            status=data.get("status"),
        )

        return LatePost(**data)

    async def delete_post(self, post_id: str) -> bool:
        """
        Delete a post
        """
        await self._request("DELETE", f"/posts/{post_id}")

        logger.info("Late post deleted", post_id=post_id)

        return True

    async def retry_post(self, post_id: str) -> LatePost:
        """
        Retry publishing a failed post
        """
        data = await self._request("POST", f"/posts/{post_id}/retry")
        return LatePost(**data)

    async def get_analytics(
        self,
        post_id: str | None = None,
        platform: str | None = None,
        profile_id: str | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> list[LateAnalytics] | LateAnalytics:
        """
        Get post analytics
        """
        params: dict[str, Any] = {"page": page, "limit": limit}

        if post_id:
            params["postId"] = post_id
        if platform:
            params["platform"] = platform
        if profile_id:
            params["profileId"] = profile_id
        if from_date:
            params["fromDate"] = from_date.strftime("%Y-%m-%d")
        if to_date:
            params["toDate"] = to_date.strftime("%Y-%m-%d")

        data = await self._request("GET", "/analytics", params=params)

        if post_id:
            return LateAnalytics(**data)

        return [LateAnalytics(**a) for a in data.get("analytics", data)]

    async def get_follower_stats(
        self,
        account_ids: list[str] | None = None,
        profile_id: str | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
        granularity: str = "daily",
    ) -> list[LateFollowerStats]:
        """
        Get follower growth statistics
        """
        params: dict[str, Any] = {"granularity": granularity}

        if account_ids:
            params["accountIds"] = ",".join(account_ids)
        if profile_id:
            params["profileId"] = profile_id
        if from_date:
            params["fromDate"] = from_date.strftime("%Y-%m-%d")
        if to_date:
            params["toDate"] = to_date.strftime("%Y-%m-%d")

        data = await self._request("GET", "/accounts/follower-stats", params=params)

        return [LateFollowerStats(**s) for s in data.get("stats", data)]

    async def get_pinterest_boards(self, account_id: str) -> list[dict[str, Any]]:
        """
        Get Pinterest boards for an account
        """
        data = await self._request("GET", f"/accounts/{account_id}/pinterest-boards")
        return data.get("boards", [])

    async def get_reddit_subreddits(self, account_id: str) -> list[dict[str, Any]]:
        """
        Get Reddit subreddits for an account
        """
        data = await self._request("GET", f"/accounts/{account_id}/reddit-subreddits")
        return data.get("subreddits", [])

    async def health_check(self) -> dict[str, Any]:
        """
        Verify API connection and authentication
        """
        try:
            profiles = await self.get_profiles()
            accounts = await self.get_accounts()

            return {
                "connected": True,
                "profiles_count": len(profiles),
                "accounts_count": len(accounts),
                "platforms": list({a.platform for a in accounts}),
            }
        except LateApiError as e:
            return {
                "connected": False,
                "error": e.message,
                "status_code": e.status_code,
            }
