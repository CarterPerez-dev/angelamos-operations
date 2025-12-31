"""
ⒸAngelaMos | 2025
tiktok_rules.py
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.models.platform_rules import (
    TikTokRule,
)
from core.enums import TikTokRuleCategory


class TikTokRulesRepository:
    """
    Repository for TikTok-specific platform rules

    Based on platform-rules.json schema
    """
    @staticmethod
    async def get_all_rules(session: AsyncSession) -> list[TikTokRule]:
        """
        Get all TikTok rules
        """
        result = await session.execute(select(TikTokRule))
        return list(result.scalars().all())

    @staticmethod
    async def get_rule_by_category(
        session: AsyncSession,
        category: TikTokRuleCategory
    ) -> TikTokRule | None:
        """
        Get TikTok rule for specific category

        Categories:
        - VIDEO_LENGTH: Target length ranges, philosophy
        - VISUAL_STYLE: Current format, challenges, future goals
        - HOOKS: Hook strategy, selection method, optimization criteria
        - SENTENCE_STRUCTURE: Variation strategy, length flexibility
        - CTA: Current CTA, works status, future pivot plans
        """
        result = await session.execute(
            select(TikTokRule).where(TikTokRule.rule_category == category)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_video_length_rules(
        session: AsyncSession
    ) -> TikTokRule | None:
        """
        Get video length rules and philosophy

        Returns rule_data with:
        - target_range: "30-60 seconds"
        - posting_strategy: Want to post more, some really short
        - philosophy: Balance between value and brevity
        """
        return await TikTokRulesRepository.get_rule_by_category(
            session,
            TikTokRuleCategory.VIDEO_LENGTH
        )

    @staticmethod
    async def get_visual_style_rules(
        session: AsyncSession
    ) -> TikTokRule | None:
        """
        Get visual style rules

        Returns rule_data with:
        - current: "90% talking head"
        - challenge: Hard to keep engaging
        - future_goal: Branch out to other video types
        """
        return await TikTokRulesRepository.get_rule_by_category(
            session,
            TikTokRuleCategory.VISUAL_STYLE
        )

    @staticmethod
    async def get_hook_rules(session: AsyncSession) -> TikTokRule | None:
        """
        Get hook strategy rules

        Returns rule_data with:
        - status: "Don't have hook game figured out yet"
        - process: Has 150-hook list, asks AI for 20 best
        - selection_method: Choose top 3, discuss with AI
        - optimization_criteria: [credibility, FOMO, curiosity, etc.]
        - flop_assumption: Bad hook = video flops
        """
        return await TikTokRulesRepository.get_rule_by_category(
            session,
            TikTokRuleCategory.HOOKS
        )

    @staticmethod
    async def get_sentence_structure_rules(
        session: AsyncSession,
    ) -> TikTokRule | None:
        """
        Get sentence structure and variation rules

        Returns rule_data with:
        - length: "Flexible - not locked to super short"
        - script_structure_example: One sentence, then one-sentence why/explanation
        - variation_strategy: 10 variations per sentence
        """
        return await TikTokRulesRepository.get_rule_by_category(
            session,
            TikTokRuleCategory.SENTENCE_STRUCTURE
        )

    @staticmethod
    async def get_cta_rules(session: AsyncSession) -> TikTokRule | None:
        """
        Get CTA strategy rules

        Returns rule_data with:
        - current: "I post everyday so follow for more tips"
        - works: true
        - future_pivot: Switch to CertGames bio link once following built
        - current_focus: Building following first
        """
        return await TikTokRulesRepository.get_rule_by_category(
            session,
            TikTokRuleCategory.CTA
        )
