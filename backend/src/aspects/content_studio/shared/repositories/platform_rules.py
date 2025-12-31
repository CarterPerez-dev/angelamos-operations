"""
ⒸAngelaMos | 2025
platform_rules.py
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.models.platform_rules import (
    RedditForbiddenPattern,
)
from core.enums import PatternSeverity


class PlatformRulesRepository:
    """
    Repository for cross-platform rules

    Currently only has Reddit forbidden patterns
    (used by ALL platforms for AI detection)
    """
    @staticmethod
    async def get_all_reddit_forbidden_patterns(
        session: AsyncSession,
    ) -> list[RedditForbiddenPattern]:
        """
        Get ALL Reddit forbidden patterns for AI detection

        Used by TikTok, LinkedIn, Twitter, YouTube (not just Reddit)
        to avoid AI language patterns

        Returns:
        - EM_DASH patterns (CRITICAL severity)
        - HYPHEN patterns (ERROR severity)
        - AI_LANGUAGE patterns (WARNING severity)
        """
        result = await session.execute(
            select(RedditForbiddenPattern).order_by(
                RedditForbiddenPattern.severity.desc()
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_critical_patterns(
        session: AsyncSession,
    ) -> list[RedditForbiddenPattern]:
        """
        Get CRITICAL patterns only (em-dashes)

        CRITICAL = instant AI detection
        """
        result = await session.execute(
            select(RedditForbiddenPattern).where(
                RedditForbiddenPattern.severity == PatternSeverity.CRITICAL
            )
        )
        return list(result.scalars().all())
