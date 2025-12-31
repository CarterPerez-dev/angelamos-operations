"""
ⒸAngelaMos | 2025
client.py
"""

import contextlib
from collections.abc import AsyncIterator

import redis.asyncio as redis
from redis.asyncio import (
    Redis,
    ConnectionPool,
)
from redis.asyncio.retry import Retry
from redis.backoff import ExponentialWithJitterBackoff
from redis.exceptions import (
    ConnectionError,
    TimeoutError,
    BusyLoadingError,
)

from config import settings
from core.foundation.logging import get_logger


logger = get_logger(__name__)


class CacheManager:
    """
    Manages Redis connections and client lifecycle
    """
    def __init__(self) -> None:
        self._pool: ConnectionPool | None = None
        self._client: Redis | None = None

    def init(self, redis_url: str | None = None) -> None:
        """
        Initialize Redis connection pool and client
        """
        if redis_url is None:
            logger.warning(
                "Redis URL not provided - cache will be disabled"
            )
            return

        retry = Retry(
            backoff = ExponentialWithJitterBackoff(base = 1,
                                                   cap = 10),
            retries = 5,
            supported_errors = (
                ConnectionError,
                TimeoutError,
                BusyLoadingError,
            ),
        )

        self._pool = ConnectionPool.from_url(
            redis_url,
            max_connections = settings.REDIS_MAX_CONNECTIONS,
            socket_timeout = settings.REDIS_SOCKET_TIMEOUT,
            socket_connect_timeout = settings.REDIS_SOCKET_CONNECT_TIMEOUT,
            socket_keepalive = True,
            health_check_interval = settings.REDIS_HEALTH_CHECK_INTERVAL,
            decode_responses = settings.REDIS_DECODE_RESPONSES,
            retry = retry,
        )

        self._client = Redis.from_pool(self._pool)
        logger.info(
            f"Redis connection pool initialized "
            f"(max_connections={settings.REDIS_MAX_CONNECTIONS})"
        )

    async def close(self) -> None:
        """
        Close Redis client and dispose of connection pool
        """
        if self._client:
            await self._client.aclose()
            self._client = None
            self._pool = None
            logger.info("Redis connection pool closed")

    async def ping(self) -> bool:
        """
        Health check - ping Redis server
        """
        if not self._client:
            return False

        try:
            return await self._client.ping()
        except Exception as e:
            logger.warning(f"Redis ping failed: {e}")
            return False

    @property
    def client(self) -> Redis:
        """
        Get Redis client instance
        """
        if self._client is None:
            raise RuntimeError("CacheManager is not initialized")
        return self._client

    @property
    def is_available(self) -> bool:
        """
        Check if Redis is available
        """
        return self._client is not None

    @contextlib.asynccontextmanager
    async def pipeline(
        self,
        transaction: bool = True
    ) -> AsyncIterator[redis.client.Pipeline]:
        """
        Context manager for Redis pipeline operations
        """
        if not self._client:
            raise RuntimeError("CacheManager is not initialized")

        async with self._client.pipeline(transaction = transaction
                                         ) as pipe:
            yield pipe


cachemanager = CacheManager()
