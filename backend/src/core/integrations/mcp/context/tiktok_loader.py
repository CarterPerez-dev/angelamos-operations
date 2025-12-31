"""
ⒸAngelaMos | 2025
tiktok_loader.py
"""

from typing import Any
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from core.infrastructure.cache.service import CacheService
from core.foundation.repositories.identity import IdentityRepository
from aspects.content_studio.shared.repositories.tiktok_virality import (
    TikTokViralityRepository,
)
from aspects.content_studio.shared.repositories.tiktok_content import (
    TikTokContentRepository,
)
from aspects.content_studio.shared.repositories.platform_rules import (
    PlatformRulesRepository,
)
from core.enums import WorkflowStage, PlatformType


class TikTokContextLoader:
    """
    Context loader specifically for TikTok workflows

    Three-tier caching:
    - Tier 1 (Static): 24hr - Identity, rules, virality techniques
    - Tier 2 (Dynamic): 30min - Content history, performance stats
    - Tier 3 (Workflow): No cache - Session state
    """

    STATIC_TTL = 86400
    DYNAMIC_TTL = 1800

    def __init__(self, redis: Redis, session: AsyncSession):
        self.session = session
        self.static_cache = CacheService(
            redis,
            namespace = "mcp:tiktok:static",
            default_ttl = self.STATIC_TTL
        )
        self.dynamic_cache = CacheService(
            redis,
            namespace = "mcp:tiktok:dynamic",
            default_ttl = self.DYNAMIC_TTL
        )

    async def load_for_stage(
        self,
        stage: WorkflowStage,
        session_id: UUID | None = None
    ) -> dict[str,
              Any]:
        """
        Load context for specific TikTok workflow stage

        Maps each stage to exactly what the prompts need
        """
        if stage == WorkflowStage.IDEAS:
            return await self._load_ideas_context()
        if stage == WorkflowStage.HOOKS:
            return await self._load_hooks_context(session_id)
        if stage == WorkflowStage.HOOK_ANALYSIS:
            return await self._load_hook_analysis_context(session_id)
        if stage == WorkflowStage.SCRIPT:
            return await self._load_script_context(session_id)
        if stage == WorkflowStage.SCRIPT_ANALYSIS:
            return await self._load_script_analysis_context(session_id)
        if stage == WorkflowStage.FINAL_REVIEW:
            return await self._load_final_review_context(session_id)
        return {}

    async def _load_ideas_context(self) -> dict[str, Any]:
        """
        Stage 1: Idea Generation context

        From prompts - needs:
        - core_identity.skills
        - core_identity.interests
        - core_identity.certifications
        - content_preferences (engagement_winners, burnt_out, wants_to_make)
        - platform_goals
        - content_history (top 20)
        """
        static = await self.static_cache.get_or_set(
            identifier = "ideas_static",
            factory = self._fetch_ideas_static,
            ttl = self.STATIC_TTL,
        )

        dynamic = await self.dynamic_cache.get_or_set(
            identifier = "ideas_dynamic",
            factory = self._fetch_ideas_dynamic,
            ttl = self.DYNAMIC_TTL,
        )

        return {"static": static, "dynamic": dynamic}

    async def _fetch_ideas_static(self) -> dict[str, Any]:
        """
        Fetch static context for idea generation
        """
        identity = await IdentityRepository.get_identity(self.session)
        platform_goal = await IdentityRepository.get_platform_goal(
            self.session,
            PlatformType.TIKTOK
        )
        engagement_winners = await IdentityRepository.get_engagement_winners(
            self.session,
            PlatformType.TIKTOK
        )
        burnt_out = await IdentityRepository.get_burnt_out_content(
            self.session
        )
        wants_to_make = await IdentityRepository.get_wants_to_make(
            self.session
        )

        return {
            "identity": {
                "name":
                identity.name,
                "background":
                identity.background,
                "skills": [
                    {
                        "skill": s.skill,
                        "proficiency": s.proficiency.value,
                        "years": float(s.years_experience),
                        "context": s.context,
                    } for s in identity.skills
                ],
                "interests": [
                    {
                        "topic": i.topic,
                        "passion": i.passion_level.value,
                        "why": i.why
                    } for i in identity.interests
                ],
                "certifications": [
                    {
                        "name": c.name,
                        "date": c.date_earned.isoformat(),
                        "time_to_complete": c.time_to_complete,
                    } for c in identity.certifications
                ],
            },
            "platform_goals": {
                "current_followers":
                platform_goal.current_followers if platform_goal else 0,
                "goal_followers":
                platform_goal.goal_followers if platform_goal else 0,
                "strategy":
                platform_goal.strategy if platform_goal else "",
            },
            "engagement_winners": [
                {
                    "content_type":
                    p.content_type,
                    "evidence":
                    p.evidence,
                    "engagement_level":
                    p.engagement_level.value
                    if p.engagement_level else None,
                } for p in engagement_winners
            ],
            "burnt_out_on": [
                {
                    "content_type": p.content_type,
                    "reason": p.reason
                } for p in burnt_out
            ],
            "wants_to_make": [
                {
                    "content_type": p.content_type,
                    "why": p.reason,
                    "challenge": p.challenge,
                } for p in wants_to_make
            ],
        }

    async def _fetch_ideas_dynamic(self) -> dict[str, Any]:
        """
        Fetch dynamic context for idea generation
        """
        top_videos = await TikTokContentRepository.get_top_performers(
            self.session,
            limit = 20,
            days = 30
        )
        performance = await TikTokContentRepository.get_performance_summary(
            self.session,
            days = 30
        )
        content_gaps = await TikTokContentRepository.get_content_gaps(
            self.session
        )

        return {
            "top_videos": [
                {
                    "title": v.title,
                    "topic": v.topic,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                    "what_worked": v.what_worked,
                } for v in top_videos
            ],
            "performance_summary":
            performance,
            "content_gaps":
            content_gaps,
        }

    async def _load_hooks_context(self,
                                  session_id: UUID | None) -> dict[str,
                                                                   Any]:
        """
        Stage 2: Hook Generation context

        From prompts - needs:
        - core_identity.brand_voice
        - core_identity.strengths
        - tiktok_hook_formulas
        - tiktok_hook_system
        - hook_list (templates)
        - content_history (top performers)
        """
        static = await self.static_cache.get_or_set(
            identifier = "hooks_static",
            factory = self._fetch_hooks_static,
            ttl = self.STATIC_TTL,
        )

        dynamic = await self.dynamic_cache.get_or_set(
            identifier = "hooks_dynamic",
            factory = self._fetch_hooks_dynamic,
            ttl = self.DYNAMIC_TTL,
        )

        workflow = await self._fetch_hooks_workflow(session_id
                                                    ) if session_id else {}

        return {"static": static, "dynamic": dynamic, "workflow": workflow}

    async def _fetch_hooks_static(self) -> dict[str, Any]:
        """
        Fetch static context for hook generation
        """
        identity = await IdentityRepository.get_identity(self.session)
        brand_voice = await IdentityRepository.get_brand_voice(
            self.session
        )
        hook_formulas = await TikTokViralityRepository.get_all_hook_formulas(
            self.session
        )
        hook_system = await TikTokViralityRepository.get_three_hook_system(
            self.session
        )

        return {
            "identity": {
                "name":
                identity.name,
                "background":
                identity.background,
                "strengths": [
                    {
                        "strength": s.strength,
                        "source": s.source.value,
                        "evidence": s.evidence
                    } for s in identity.strengths
                ],
            },
            "brand_voice": {
                "tone":
                brand_voice.tone if brand_voice else "",
                "sentence_structure":
                brand_voice.sentence_structure if brand_voice else "",
                "uses_analogies":
                brand_voice.uses_analogies if brand_voice else False,
                "explanation_method":
                brand_voice.explanation_method if brand_voice else "",
                "avoid_patterns": [
                    {
                        "pattern": p.pattern,
                        "reason": p.reason
                    } for p in
                    (brand_voice.avoid_patterns if brand_voice else [])
                ],
            },
            "hook_formulas": [
                {
                    "formula_name": f.formula_name,
                    "description": f.description,
                    "examples": f.examples,
                } for f in hook_formulas
            ],
            "hook_system": [
                {
                    "hook_type": h.hook_type.value,
                    "timing": h.timing,
                    "requirements": h.requirements,
                    "max_words": h.max_words,
                    "examples": h.examples,
                    "performance_stat": h.performance_stat,
                } for h in hook_system
            ],
        }

    async def _fetch_hooks_dynamic(self) -> dict[str, Any]:
        """
        Fetch dynamic context for hook generation
        """
        hook_templates = await TikTokContentRepository.get_hook_templates(
            self.session,
            limit = 100
        )
        top_videos = await TikTokContentRepository.get_top_performers(
            self.session,
            limit = 10,
            days = 30
        )
        performance = await TikTokContentRepository.get_performance_summary(
            self.session,
            days = 30
        )

        return {
            "hook_list": [
                {
                    "text": h.hook_text,
                    "category": h.hook_category,
                    "times_used": h.times_used,
                    "avg_performance": h.avg_performance,
                } for h in hook_templates
            ],
            "top_videos": [
                {
                    "title": v.title,
                    "topic": v.topic,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                } for v in top_videos
            ],
            "performance_summary":
            performance,
        }

    async def _fetch_hooks_workflow(self,
                                    session_id: UUID) -> dict[str,
                                                              Any]:
        """
        Fetch workflow context for hook generation
        """
        workflow = await TikTokContentRepository.get_workflow_session(
            self.session,
            session_id
        )

        if not workflow:
            return {}

        chosen_idea_gen = await TikTokContentRepository.get_generated_by_stage(
            self.session,
            session_id,
            WorkflowStage.IDEAS
        )

        return {
            "mode":
            workflow.mode.value,
            "initial_idea":
            workflow.initial_idea,
            "chosen_idea":
            chosen_idea_gen.user_selected if chosen_idea_gen else None,
        }

    async def _load_hook_analysis_context(self,
                                          session_id: UUID | None
                                          ) -> dict[str,
                                                    Any]:
        """
        Stage 3: Hook Analysis context

        From prompts - needs:
        - brand_voice, weaknesses, hook_system, hook_formulas
        - common_mistakes (retention_killer)
        - content_history (top 10)
        """
        static = await self.static_cache.get_or_set(
            identifier = "hook_analysis_static",
            factory = self._fetch_hook_analysis_static,
            ttl = self.STATIC_TTL,
        )

        dynamic = await self.dynamic_cache.get_or_set(
            identifier = "hook_analysis_dynamic",
            factory = self._fetch_hook_analysis_dynamic,
            ttl = self.DYNAMIC_TTL,
        )

        workflow = (
            await self._fetch_hook_analysis_workflow(session_id)
            if session_id else {}
        )

        return {"static": static, "dynamic": dynamic, "workflow": workflow}

    async def _fetch_hook_analysis_static(self) -> dict[str, Any]:
        """
        Fetch static context for hook analysis
        """
        identity = await IdentityRepository.get_identity(self.session)
        brand_voice = await IdentityRepository.get_brand_voice(
            self.session
        )
        hook_system = await TikTokViralityRepository.get_three_hook_system(
            self.session
        )
        hook_formulas = await TikTokViralityRepository.get_all_hook_formulas(
            self.session
        )
        retention_killers = await TikTokViralityRepository.get_retention_killers(
            self.session
        )

        return {
            "brand_voice": {
                "tone":
                brand_voice.tone if brand_voice else "",
                "avoid": [
                    {
                        "pattern": p.pattern,
                        "reason": p.reason
                    } for p in
                    (brand_voice.avoid_patterns if brand_voice else [])
                ],
            },
            "weaknesses": [
                {
                    "weakness": w.weakness,
                    "impact": w.impact,
                    "workaround": w.workaround
                } for w in identity.weaknesses
            ],
            "hook_system": [
                {
                    "type": h.hook_type.value,
                    "timing": h.timing,
                    "requirements": h.requirements,
                } for h in hook_system
            ],
            "hook_formulas": [
                {
                    "name": f.formula_name,
                    "description": f.description
                } for f in hook_formulas
            ],
            "retention_killers": [
                {
                    "mistake": m.mistake,
                    "description": m.description,
                    "impact": m.performance_impact,
                } for m in retention_killers
            ],
        }

    async def _fetch_hook_analysis_dynamic(self) -> dict[str, Any]:
        """
        Fetch dynamic context for hook analysis
        """
        top_videos = await TikTokContentRepository.get_top_performers(
            self.session,
            limit = 10,
            days = 30
        )

        return {
            "top_videos": [
                {
                    "title": v.title,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                } for v in top_videos
            ]
        }

    async def _fetch_hook_analysis_workflow(self,
                                            session_id: UUID) -> dict[str,
                                                                      Any]:
        """
        Fetch workflow context for hook analysis
        """
        hooks_gen = await TikTokContentRepository.get_generated_by_stage(
            self.session,
            session_id,
            WorkflowStage.HOOKS
        )

        if not hooks_gen:
            return {}

        return {
            "generated_hooks":
            hooks_gen.output_data,
            "selected_hooks":
            hooks_gen.user_selected if hooks_gen.user_selected else None,
        }

    async def _load_script_context(self,
                                   session_id: UUID | None) -> dict[str,
                                                                    Any]:
        """
        Stage 4: Script Generation context

        From prompts - needs:
        - brand_voice, brand_voice_avoid, explanation_method
        - structure_templates, pacing, retention_tactics
        - reddit_forbidden_patterns (AI detection)
        """
        static = await self.static_cache.get_or_set(
            identifier = "script_static",
            factory = self._fetch_script_static,
            ttl = self.STATIC_TTL,
        )

        workflow = await self._fetch_script_workflow(
            session_id
        ) if session_id else {}

        return {"static": static, "workflow": workflow}

    async def _fetch_script_static(self) -> dict[str, Any]:
        """
        Fetch static context for script generation
        """
        identity = await IdentityRepository.get_identity(self.session)
        brand_voice = await IdentityRepository.get_brand_voice(
            self.session
        )
        structure_templates = await TikTokViralityRepository.get_structure_templates(
            self.session
        )
        pacing = await TikTokViralityRepository.get_all_pacing_rules(
            self.session
        )
        retention = await TikTokViralityRepository.get_all_retention_tactics(
            self.session
        )
        forbidden = await PlatformRulesRepository.get_all_reddit_forbidden_patterns(
            self.session
        )

        return {
            "identity": {
                "name":
                identity.name,
                "explanation_method":
                identity.brand_voice.explanation_method
                if identity.brand_voice else "",
            },
            "brand_voice": {
                "tone":
                brand_voice.tone if brand_voice else "",
                "sentence_structure":
                brand_voice.sentence_structure if brand_voice else "",
                "uses_analogies":
                brand_voice.uses_analogies if brand_voice else False,
                "avoid": [
                    {
                        "pattern": p.pattern,
                        "reason": p.reason
                    } for p in
                    (brand_voice.avoid_patterns if brand_voice else [])
                ],
            },
            "structure_templates": [
                {
                    "video_length": t.video_length,
                    "timestamp": t.timestamp_range,
                    "purpose": t.purpose,
                    "energy": t.energy_level,
                } for t in structure_templates
            ],
            "pacing":
            [{
                "type": p.rule_type,
                "data": p.rule_data
            } for p in pacing],
            "retention_tactics": [
                {
                    "category": r.tactic_category,
                    "data": r.tactic_data
                } for r in retention
            ],
            "forbidden_patterns": [
                {
                    "pattern_type": f.pattern_type.value,
                    "pattern": f.pattern,
                    "severity": f.severity.value,
                    "rule": f.rule,
                    "wrong": f.example_wrong,
                    "right": f.example_right,
                } for f in forbidden
            ],
        }

    async def _fetch_script_workflow(self,
                                     session_id: UUID) -> dict[str,
                                                               Any]:
        """
        Fetch workflow context for script generation
        """
        hook_analysis_gen = await TikTokContentRepository.get_generated_by_stage(
            self.session,
            session_id,
            WorkflowStage.HOOK_ANALYSIS
        )

        if not hook_analysis_gen or not hook_analysis_gen.user_selected:
            return {}

        return {
            "chosen_hook":
            hook_analysis_gen.user_selected.get("chosen_hook"),
            "video_length":
            hook_analysis_gen.user_selected.get("video_length",
                                                30),
        }

    async def _load_script_analysis_context(self,
                                            session_id: UUID | None
                                            ) -> dict[str,
                                                      Any]:
        """
        Stage 5: Script Analysis context

        From prompts - needs:
        - brand_voice, pacing, retention_tactics, common_mistakes
        - content_history (top 10)
        """
        static = await self.static_cache.get_or_set(
            identifier = "script_analysis_static",
            factory = self._fetch_script_analysis_static,
            ttl = self.STATIC_TTL,
        )

        dynamic = await self.dynamic_cache.get_or_set(
            identifier = "script_analysis_dynamic",
            factory = self._fetch_script_analysis_dynamic,
            ttl = self.DYNAMIC_TTL,
        )

        workflow = (
            await self._fetch_script_analysis_workflow(session_id)
            if session_id else {}
        )

        return {"static": static, "dynamic": dynamic, "workflow": workflow}

    async def _fetch_script_analysis_static(self) -> dict[str, Any]:
        """
        Fetch static context for script analysis
        """
        brand_voice = await IdentityRepository.get_brand_voice(
            self.session
        )
        pacing = await TikTokViralityRepository.get_all_pacing_rules(
            self.session
        )
        retention = await TikTokViralityRepository.get_all_retention_tactics(
            self.session
        )
        mistakes = await TikTokViralityRepository.get_common_mistakes(
            self.session
        )

        return {
            "brand_voice": {
                "tone": brand_voice.tone if brand_voice else "",
            },
            "pacing":
            [{
                "type": p.rule_type,
                "data": p.rule_data
            } for p in pacing],
            "retention_tactics": [
                {
                    "category": r.tactic_category,
                    "data": r.tactic_data
                } for r in retention
            ],
            "common_mistakes": [
                {
                    "mistake": m.mistake,
                    "description": m.description,
                    "impact": m.performance_impact,
                    "solution": m.solution,
                } for m in mistakes
            ],
        }

    async def _fetch_script_analysis_dynamic(self) -> dict[str, Any]:
        """
        Fetch dynamic context for script analysis
        """
        top_videos = await TikTokContentRepository.get_top_performers(
            self.session,
            limit = 10,
            days = 30
        )

        return {
            "top_videos": [
                {
                    "title": v.title,
                    "engagement_rate": v.engagement_rate
                } for v in top_videos
            ]
        }

    async def _fetch_script_analysis_workflow(self,
                                              session_id: UUID
                                              ) -> dict[str,
                                                        Any]:
        """
        Fetch workflow context for script analysis
        """
        script_gen = await TikTokContentRepository.get_generated_by_stage(
            self.session,
            session_id,
            WorkflowStage.SCRIPT
        )

        if not script_gen:
            return {}

        return {
            "generated_script":
            script_gen.output_data,
            "chosen_variations":
            script_gen.user_selected if script_gen.user_selected else None,
        }

    async def _load_final_review_context(self,
                                         session_id: UUID | None
                                         ) -> dict[str,
                                                   Any]:
        """
        Stage 6: Final Review context

        From prompts - needs:
        - pacing, retention_tactics, common_mistakes
        - reddit_forbidden_patterns (AI detection)
        - content_history (top 10 for comparison)
        """
        static = await self.static_cache.get_or_set(
            identifier = "final_review_static",
            factory = self._fetch_final_review_static,
            ttl = self.STATIC_TTL,
        )

        dynamic = await self.dynamic_cache.get_or_set(
            identifier = "final_review_dynamic",
            factory = self._fetch_final_review_dynamic,
            ttl = self.DYNAMIC_TTL,
        )

        workflow = (
            await self._fetch_final_review_workflow(session_id)
            if session_id else {}
        )

        return {"static": static, "dynamic": dynamic, "workflow": workflow}

    async def _fetch_final_review_static(self) -> dict[str, Any]:
        """
        Fetch static context for final review
        """
        pacing = await TikTokViralityRepository.get_all_pacing_rules(
            self.session
        )
        retention = await TikTokViralityRepository.get_all_retention_tactics(
            self.session
        )
        mistakes = await TikTokViralityRepository.get_common_mistakes(
            self.session
        )
        forbidden = await PlatformRulesRepository.get_all_reddit_forbidden_patterns(
            self.session
        )

        return {
            "pacing":
            [{
                "type": p.rule_type,
                "data": p.rule_data
            } for p in pacing],
            "retention_tactics": [
                {
                    "category": r.tactic_category,
                    "data": r.tactic_data
                } for r in retention
            ],
            "common_mistakes": [
                {
                    "mistake": m.mistake,
                    "description": m.description,
                    "impact": m.performance_impact,
                } for m in mistakes
            ],
            "forbidden_patterns": [
                {
                    "pattern": f.pattern,
                    "severity": f.severity.value,
                    "rule": f.rule,
                } for f in forbidden
            ],
        }

    async def _fetch_final_review_dynamic(self) -> dict[str, Any]:
        """
        Fetch dynamic context for final review
        """
        top_videos = await TikTokContentRepository.get_top_performers(
            self.session,
            limit = 10,
            days = 30
        )

        return {
            "comparison_videos": [
                {
                    "title": v.title,
                    "views": v.views,
                    "likes": v.likes,
                    "engagement_rate": v.engagement_rate,
                } for v in top_videos
            ]
        }

    async def _fetch_final_review_workflow(self,
                                           session_id: UUID) -> dict[str,
                                                                     Any]:
        """
        Fetch workflow context for final review
        """
        script_analysis_gen = await TikTokContentRepository.get_generated_by_stage(
            self.session,
            session_id,
            WorkflowStage.SCRIPT_ANALYSIS
        )

        if not script_analysis_gen:
            return {}

        return {
            "finalized_script":
            script_analysis_gen.output_data.get("full_script"),
            "chosen_hook":
            script_analysis_gen.output_data.get("hook"),
        }

    async def invalidate_static_cache(self) -> None:
        """
        Invalidate TikTok static cache when core data changes
        """
        await self.static_cache.invalidate_pattern("*")

    async def invalidate_dynamic_cache(self) -> None:
        """
        Invalidate TikTok dynamic cache when content is published
        """
        await self.dynamic_cache.invalidate_pattern("*")
