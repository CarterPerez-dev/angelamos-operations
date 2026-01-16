"""
ⒸAngelaMos | 2025
keys.py
"""

import hashlib
import json
import random
from typing import Any

from config import settings


def build_cache_key(
    namespace: str,
    identifier: str,
    params: dict[str,
                 Any] | None = None,
    include_version: bool = True,
) -> str:
    """
    Generate deterministic, collision-resistant cache keys

    Format: {prefix}:{version}:{namespace}:{identifier}[:{param_hash}]

    Examples:
        build_cache_key("users", "123")
        -> "carteros:v1:users:123"

        build_cache_key("products", "list", {"category": "electronics", "page": 1})
        -> "carteros:v1:products:list:a3f2b1c4d5e6"
    """
    parts = [settings.CACHE_KEY_PREFIX]

    if include_version:
        parts.append(settings.CACHE_VERSION)

    parts.extend([namespace, identifier])

    if params:
        param_str = json.dumps(params, sort_keys = True)
        param_hash = hashlib.sha256(param_str.encode()).hexdigest()[: 12]
        parts.append(param_hash)

    return ":".join(parts)


def get_ttl_with_jitter(base_ttl: int, jitter_percent: float = 0.1) -> int:
    """
    Add random variance to TTL to prevent cache stampedes

    Prevents thundering herd when many keys expire simultaneously

    Examples:
        get_ttl_with_jitter(300)  # 300s ± 30s (270-330)
        get_ttl_with_jitter(600, 0.2)  # 600s ± 120s (480-720)
    """
    jitter = int(base_ttl * jitter_percent)
    return base_ttl + random.randint(-jitter, jitter)  # noqa: S311


def invalidate_pattern(namespace: str, pattern: str = "*") -> str:
    """
    Build pattern for bulk invalidation using SCAN

    Examples:
        invalidate_pattern("users", "123:*")
        -> "carteros:v1:users:123:*"
    """
    return f"{settings.CACHE_KEY_PREFIX}:{settings.CACHE_VERSION}:{namespace}:{pattern}"


def claude_session_key(workflow_session_id: str) -> str:
    """
    Build Redis key for Claude session continuation

    Stores Claude Agent SDK session ID for context caching
    Workflow sessions use Claude session to continue conversations

    Examples:
        claude_session_key("abc-123")
        -> "carteros:v1:claude_session:abc-123"
    """
    return build_cache_key("claude_session", workflow_session_id)
