"""
ⒸAngelaMos | 2025
dependencies.py
"""

from typing import Annotated

from fastapi import Depends, Request
from redis.asyncio import Redis

from core.infrastructure.cache.client import cachemanager
from core.infrastructure.cache.service import CacheService


async def get_redis_client(request: Request) -> Redis:
    """
    FastAPI dependency for direct Redis client access

    Usage:
        @app.get("/example")
        async def example(redis: RedisClient):
            await redis.get("key")
    """
    if not cachemanager.is_available:
        raise RuntimeError("Redis is not available")
    return cachemanager.client


async def get_cache_service(
    redis: Annotated[Redis,
                     Depends(get_redis_client)]
) -> CacheService:
    """
    FastAPI dependency for generic CacheService

    Usage:
        @app.get("/users/{user_id}")
        async def get_user(user_id: str, cache: CacheServiceDep):
            return await cache.get_or_set(
                user_id,
                factory=lambda: fetch_user(user_id),
                ttl=300
            )
    """
    return CacheService(redis, namespace = "default")


RedisClient = Annotated[Redis, Depends(get_redis_client)]
CacheServiceDep = Annotated[CacheService, Depends(get_cache_service)]
