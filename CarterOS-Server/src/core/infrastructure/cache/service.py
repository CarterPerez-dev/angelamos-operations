"""
ⒸAngelaMos | 2025
service.py
"""

import json
from typing import (
    Any,
    TypeVar,
    Generic,
)
from collections.abc import Callable
from collections.abc import Awaitable

from redis.asyncio import Redis
from pydantic import BaseModel

from config import settings
from core.infrastructure.cache.keys import (
    build_cache_key,
    get_ttl_with_jitter,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)

T = TypeVar("T", bound = BaseModel)


class CacheService(Generic[T]):
    """
    Generic caching service for Pydantic models

    Provides cache-aside pattern with automatic serialization

    Usage:
        user_cache = CacheService(redis_client, namespace="users", model=User)
        user = await user_cache.get("123")
        await user_cache.set("123", user_obj, ttl=600)
    """
    def __init__(
        self,
        redis: Redis,
        namespace: str,
        model: type[T] | None = None,
        default_ttl: int | None = None,
        use_jitter: bool = True,
    ):
        self.redis = redis
        self.namespace = namespace
        self.model = model
        self.default_ttl = default_ttl or settings.CACHE_DEFAULT_TTL
        self.use_jitter = use_jitter

    def _build_key(
        self,
        identifier: str,
        params: dict[str,
                     Any] | None = None
    ) -> str:
        """
        Build namespaced cache key
        """
        return build_cache_key(self.namespace, identifier, params)

    def _get_ttl(self, ttl: int | None = None) -> int:
        """
        Get TTL with optional jitter
        """
        effective_ttl = ttl or self.default_ttl
        if self.use_jitter:
            return get_ttl_with_jitter(effective_ttl)
        return effective_ttl

    async def get(
        self,
        identifier: str,
        params: dict[str,
                     Any] | None = None,
    ) -> T | None:
        """
        Get cached value, deserialize to Pydantic model if configured
        """
        try:
            key = self._build_key(identifier, params)
            data = await self.redis.get(key)

            if data is None:
                return None

            if self.model:
                return self.model.model_validate_json(data)

            return json.loads(data) if isinstance(data, str) else data

        except Exception as e:
            logger.warning(f"Cache get failed for {identifier}: {e}")
            return None

    async def set(
        self,
        identifier: str,
        value: T | dict[str,
                        Any] | str,
        ttl: int | None = None,
        params: dict[str,
                     Any] | None = None,
    ) -> bool:
        """
        Set cached value with automatic serialization
        """
        try:
            key = self._build_key(identifier, params)
            effective_ttl = self._get_ttl(ttl)

            if isinstance(value, BaseModel):
                data = value.model_dump_json()
            elif isinstance(value, dict):
                data = json.dumps(value)
            else:
                data = str(value)

            await self.redis.set(key, data, ex = effective_ttl)
            return True

        except Exception as e:
            logger.error(f"Cache set failed for {identifier}: {e}")
            return False

    async def delete(
        self,
        identifier: str,
        params: dict[str,
                     Any] | None = None
    ) -> bool:
        """
        Delete cached value
        """
        try:
            key = self._build_key(identifier, params)
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Cache delete failed for {identifier}: {e}")
            return False

    async def exists(
        self,
        identifier: str,
        params: dict[str,
                     Any] | None = None
    ) -> bool:
        """
        Check if key exists in cache
        """
        try:
            key = self._build_key(identifier, params)
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.warning(
                f"Cache exists check failed for {identifier}: {e}"
            )
            return False

    async def get_or_set(
        self,
        identifier: str,
        factory: Callable[[],
                          Awaitable[T]],
        ttl: int | None = None,
        params: dict[str,
                     Any] | None = None,
    ) -> T:
        """
        Cache-aside pattern: get from cache or execute factory and cache result

        Usage:
            user = await cache.get_or_set(
                "123",
                factory=lambda: db.get_user(123),
                ttl=600
            )
        """
        cached = await self.get(identifier, params)
        if cached is not None:
            return cached

        value = await factory()
        await self.set(identifier, value, ttl, params)
        return value

    async def invalidate_pattern(self, pattern: str = "*") -> int:
        """
        Invalidate all keys matching pattern in this namespace

        Warning: Uses SCAN - safe but can be slow on large keyspaces

        Usage:
            await cache.invalidate_pattern("user:123:*")
        """
        count = 0
        full_pattern = f"{settings.CACHE_KEY_PREFIX}:{settings.CACHE_VERSION}:{self.namespace}:{pattern}"

        try:
            async for key in self.redis.scan_iter(match = full_pattern):
                await self.redis.delete(key)
                count += 1

            if count > 0:
                logger.info(
                    f"Invalidated {count} keys matching {full_pattern}"
                )

            return count

        except Exception as e:
            logger.error(f"Pattern invalidation failed for {pattern}: {e}")
            return count

    async def get_ttl(
        self,
        identifier: str,
        params: dict[str,
                     Any] | None = None
    ) -> int:
        """
        Get remaining TTL for key in seconds

        Returns -2 if key doesn't exist, -1 if key has no expiration
        """
        try:
            key = self._build_key(identifier, params)
            return await self.redis.ttl(key)
        except Exception as e:
            logger.warning(f"TTL check failed for {identifier}: {e}")
            return -2
