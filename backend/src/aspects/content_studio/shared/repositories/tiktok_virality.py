"""
ⒸAngelaMos | 2025
tiktok_virality.py
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.models.virality_tiktok import (
    TikTokHookSystem,
    TikTokHookFormula,
    TikTokStructureTemplate,
    TikTokPacing,
    TikTokRetentionTactic,
    TikTokCTAStrategy,
    TikTokCommonMistake,
    TikTokPlatformSpecific,
)
from core.enums import TikTokHookType, TikTokMistakeType


class TikTokViralityRepository:
    """
    Repository for TikTok virality techniques

    Based on virality-techniques.json schema (TikTok section)
    Provides methods for hook system, formulas, pacing, retention, CTA, mistakes, platform specifics
    """
    @staticmethod
    async def get_three_hook_system(
        session: AsyncSession
    ) -> list[TikTokHookSystem]:
        """
        Get complete three-hook system (visual, text, verbal)

        Returns:
        - Visual hook: First 0.5s, fast movement, face close-ups
        - Text hook: 1-7 words, high contrast, 92% watch with sound off
        - Verbal hook: First 3s, bold statements
        """
        result = await session.execute(
            select(TikTokHookSystem).order_by(TikTokHookSystem.hook_type)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_hook_by_type(
        session: AsyncSession,
        hook_type: TikTokHookType
    ) -> TikTokHookSystem | None:
        """
        Get specific hook type from three-hook system

        Args:
            hook_type: VISUAL, TEXT, or VERBAL
        """
        result = await session.execute(
            select(TikTokHookSystem).where(
                TikTokHookSystem.hook_type == hook_type
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_hook_formulas(
        session: AsyncSession
    ) -> list[TikTokHookFormula]:
        """
        Get all hook formulas

        Returns formulas for:
        - Question hooks
        - Shock statement hooks
        - POV hooks
        - Time/number hooks
        - Open loop technique
        """
        result = await session.execute(select(TikTokHookFormula))
        return list(result.scalars().all())

    @staticmethod
    async def get_hook_formula_by_name(
        session: AsyncSession,
        formula_name: str
    ) -> TikTokHookFormula | None:
        """
        Get specific hook formula by name

        Formula names: question_hooks, shock_statement_hooks, pov_hooks,
                      time_number_hooks, open_loop_technique
        """
        result = await session.execute(
            select(TikTokHookFormula).where(
                TikTokHookFormula.formula_name == formula_name
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_structure_templates(
        session: AsyncSession,
        video_length: str | None = None
    ) -> list[TikTokStructureTemplate]:
        """
        Get structure templates by video length

        Video lengths: "30_second", "60_second"

        Returns timestamp breakdowns:
        - 30s: 0-3s hook, 3-10s context, 10-20s delivery, 20-27s reveal, 27-30s CTA
        - 60s: Adds re-hooks at 15s and 30s marks
        """
        query = select(TikTokStructureTemplate)

        if video_length:
            query = query.where(
                TikTokStructureTemplate.video_length == video_length
            )

        query = query.order_by(TikTokStructureTemplate.timestamp_range)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_all_pacing_rules(
        session: AsyncSession
    ) -> list[TikTokPacing]:
        """
        Get all pacing rules

        Includes:
        - Optimal sentence length (7-12 words)
        - Speaking pace (150-180 WPM)
        - Word counts by video length
        - Punchy triplet pattern
        - Voice modulation (pitch, volume, pace, pauses)
        - Analogy placement timing
        """
        result = await session.execute(select(TikTokPacing))
        return list(result.scalars().all())

    @staticmethod
    async def get_pacing_rule(
        session: AsyncSession,
        rule_type: str
    ) -> TikTokPacing | None:
        """
        Get specific pacing rule by type

        Rule types:
        - optimal_sentence_length
        - speaking_pace
        - voice_modulation
        - analogy_placement
        """
        result = await session.execute(
            select(TikTokPacing).where(
                TikTokPacing.rule_type == rule_type
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_retention_tactics(
        session: AsyncSession,
    ) -> list[TikTokRetentionTactic]:
        """
        Get all retention tactics

        Includes:
        - Pattern interrupts (visual, audio, verbal) - every 3-5s
        - Breadcrumb techniques (open loops, progress indicators)
        - Text overlay best practices (12% higher retention)
        """
        result = await session.execute(select(TikTokRetentionTactic))
        return list(result.scalars().all())

    @staticmethod
    async def get_retention_tactic(
        session: AsyncSession,
        category: str
    ) -> TikTokRetentionTactic | None:
        """
        Get specific retention tactic by category

        Categories:
        - pattern_interrupts
        - breadcrumb_techniques
        - text_overlay_best_practices
        """
        result = await session.execute(
            select(TikTokRetentionTactic).where(
                TikTokRetentionTactic.tactic_category == category
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_pattern_interrupts(
        session: AsyncSession,
    ) -> TikTokRetentionTactic | None:
        """
        Get pattern interrupt tactics

        Returns tactics for:
        - Visual interrupts (jump cuts, zooms, b-roll, filters)
        - Audio interrupts (sound effects, music drops, tempo changes)
        - Verbal interrupts (direct address changes, questions)
        - Frequency: Every 3-5 seconds
        """
        return await TikTokViralityRepository.get_retention_tactic(
            session,
            "pattern_interrupts"
        )

    @staticmethod
    async def get_cta_strategies(
        session: AsyncSession,
        video_length: str | None = None
    ) -> list[TikTokCTAStrategy]:
        """
        Get CTA strategies by video length

        Video lengths:
        - "15_30_sec": Last 3-5 seconds only
        - "30_60_sec": Mid-video + End
        - "60_plus_sec": After hook, Mid, End

        Returns high-converting wording examples for:
        - Follows
        - Saves
        - Comments
        - Shares
        """
        query = select(TikTokCTAStrategy)

        if video_length:
            query = query.where(
                TikTokCTAStrategy.video_length == video_length
            )

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_common_mistakes(
        session: AsyncSession,
        mistake_type: TikTokMistakeType | None = None
    ) -> list[TikTokCommonMistake]:
        """
        Get common mistakes to avoid

        Mistake types:
        - RETENTION_KILLER: Millennial pause, hey guys opener, static talking-head, etc.
        - ALGORITHM_ERROR: Watermarks, overloading hashtags, deleting videos, re-editing
        """
        query = select(TikTokCommonMistake)

        if mistake_type:
            query = query.where(
                TikTokCommonMistake.mistake_type == mistake_type
            )

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_retention_killers(
        session: AsyncSession,
    ) -> list[TikTokCommonMistake]:
        """
        Get retention killer mistakes

        Returns mistakes like:
        - Millennial pause (0.2s hesitation triggers scroll)
        - Hey guys opener (underperforms 30-40%)
        - Static talking-head (41% retention vs 58% dynamic)
        - Late payoffs (after 15s = 20% lower retention)
        """
        return await TikTokViralityRepository.get_common_mistakes(
            session,
            TikTokMistakeType.RETENTION_KILLER
        )

    @staticmethod
    async def get_algorithm_errors(
        session: AsyncSession,
    ) -> list[TikTokCommonMistake]:
        """
        Get algorithm mistakes to avoid

        Returns errors like:
        - Competitor watermarks (deprioritized)
        - Overloading hashtags (stick to 3-5)
        - Deleting videos (flags account)
        - Re-editing after posting (resets momentum)
        """
        return await TikTokViralityRepository.get_common_mistakes(
            session,
            TikTokMistakeType.ALGORITHM_ERROR
        )

    @staticmethod
    async def get_all_platform_specifics(
        session: AsyncSession,
    ) -> list[TikTokPlatformSpecific]:
        """
        Get all platform-specific metrics and settings

        Includes:
        - optimal_video_length: 21-34 seconds
        - completion_rate_priority: Completion > raw length
        - posting_frequency: 3-5 weekly optimal
        - peak_engagement_times: 7-9 PM weekdays
        - target_metrics: Completion rates, retention thresholds
        """
        result = await session.execute(select(TikTokPlatformSpecific))
        return list(result.scalars().all())

    @staticmethod
    async def get_platform_metric(
        session: AsyncSession,
        metric_name: str
    ) -> TikTokPlatformSpecific | None:
        """
        Get specific platform metric by name

        Metric names:
        - optimal_video_length
        - completion_rate_priority
        - posting_frequency
        - peak_engagement_times
        - target_metrics
        """
        result = await session.execute(
            select(TikTokPlatformSpecific).where(
                TikTokPlatformSpecific.metric_name == metric_name
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_target_metrics(
        session: AsyncSession,
    ) -> TikTokPlatformSpecific | None:
        """
        Get target performance metrics

        Returns metric_value with:
        - completion_rate_good: 55-65%
        - completion_rate_excellent: 65%+
        - first_3_second_retention_good: 80-90%
        - first_3_second_retention_excellent: 90%+
        """
        return await TikTokViralityRepository.get_platform_metric(
            session,
            "target_metrics"
        )
