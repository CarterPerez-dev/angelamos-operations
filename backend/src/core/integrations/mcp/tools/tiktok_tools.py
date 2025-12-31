"""
ⒸAngelaMos | 2025
tiktok_tools.py
"""

from core.integrations.mcp.server import mcp
from core.infrastructure.database.session import sessionmanager
from core.foundation.repositories.identity import IdentityRepository
from aspects.content_studio.shared.repositories.tiktok_rules import TikTokRulesRepository
from aspects.content_studio.shared.repositories.tiktok_virality import (
    TikTokViralityRepository,
)
from aspects.content_studio.shared.repositories.tiktok_content import (
    TikTokContentRepository,
)
from aspects.content_studio.shared.repositories.platform_rules import (
    PlatformRulesRepository,
)
from core.enums import PlatformType, PreferenceType, TikTokMistakeType


@mcp.tool()
async def get_core_identity() -> dict:
    """
    Get Carter's core identity profile
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        return {
            "name": identity.name,
            "age": identity.age,
            "background": identity.background,
            "current_role": identity.current_role,
            "primary_goal": identity.primary_goal,
        }


@mcp.tool()
async def get_skills() -> dict:
    """
    Get all of Carter's skills with proficiency levels
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        return {
            "skills": [
                {
                    "skill": s.skill,
                    "proficiency": s.proficiency.value,
                    "years": float(s.years_experience),
                    "context": s.context,
                } for s in identity.skills
            ]
        }


@mcp.tool()
async def get_expert_skills() -> dict:
    """
    Get Carter's expert-level skills only
    """
    async with sessionmanager.session() as session:
        skills = await IdentityRepository.get_expert_skills(session)
        return {
            "expert_skills": [
                {
                    "skill": s.skill,
                    "years": float(s.years_experience),
                    "context": s.context,
                } for s in skills
            ]
        }


@mcp.tool()
async def get_interests() -> dict:
    """
    Get Carter's interests and passions
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        return {
            "interests": [
                {
                    "topic": i.topic,
                    "passion": i.passion_level.value,
                    "why": i.why
                } for i in identity.interests
            ]
        }


@mcp.tool()
async def get_certifications() -> dict:
    """
    Get Carter's professional certifications
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        return {
            "certifications": [
                {
                    "name": c.name,
                    "date_earned": c.date_earned.isoformat(),
                    "time_to_complete": c.time_to_complete,
                } for c in identity.certifications
            ]
        }


@mcp.tool()
async def get_strengths() -> dict:
    """
    Get Carter's strengths and what he excels at
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        return {
            "strengths": [
                {
                    "strength": s.strength,
                    "source": s.source.value,
                    "evidence": s.evidence,
                } for s in identity.strengths
            ]
        }


@mcp.tool()
async def get_weaknesses() -> dict:
    """
    Get Carter's weaknesses and struggles
    """
    async with sessionmanager.session() as session:
        weaknesses = await IdentityRepository.get_weaknesses(session)
        return {
            "weaknesses": [
                {
                    "weakness": w.weakness,
                    "impact": w.impact,
                    "workaround": w.workaround,
                } for w in weaknesses
            ]
        }


@mcp.tool()
async def get_brand_voice() -> dict:
    """
    Get Carter's brand voice and communication style
    """
    async with sessionmanager.session() as session:
        brand_voice = await IdentityRepository.get_brand_voice(session)
        if not brand_voice:
            return {"error": "Brand voice not configured"}

        return {
            "tone":
            brand_voice.tone,
            "sentence_structure":
            brand_voice.sentence_structure,
            "uses_analogies":
            brand_voice.uses_analogies,
            "explanation_method":
            brand_voice.explanation_method,
            "avoid_patterns": [
                {
                    "pattern": p.pattern,
                    "reason": p.reason
                } for p in brand_voice.avoid_patterns
            ],
        }


@mcp.tool()
async def get_tiktok_platform_goal() -> dict:
    """
    Get TikTok follower goals and strategy
    """
    async with sessionmanager.session() as session:
        goal = await IdentityRepository.get_platform_goal(
            session,
            PlatformType.TIKTOK
        )
        if not goal:
            return {"error": "TikTok goal not configured"}

        return {
            "current_followers": goal.current_followers,
            "goal_followers": goal.goal_followers,
            "time_to_goal": goal.time_to_goal,
            "current_status": goal.current_status,
            "strategy": goal.strategy,
        }


@mcp.tool()
async def get_content_preferences(
    preference_type: str | None = None
) -> dict:
    """
    Get content preferences

    Args:
        preference_type: Optional filter
        (engagement_winner, burnt_out_on, wants_to_make, personal_enjoyment)
    """
    async with sessionmanager.session() as session:
        identity = await IdentityRepository.get_identity(session)
        prefs = identity.content_preferences

        if preference_type:
            pref_enum = PreferenceType(preference_type)
            prefs = [p for p in prefs if p.preference_type == pref_enum]

        return {
            "preferences": [
                {
                    "type":
                    p.preference_type.value,
                    "content_type":
                    p.content_type,
                    "platform":
                    p.platform.value if p.platform else None,
                    "evidence":
                    p.evidence,
                    "engagement_level":
                    p.engagement_level.value
                    if p.engagement_level else None,
                    "reason":
                    p.reason,
                    "challenge":
                    p.challenge,
                } for p in prefs
            ]
        }


@mcp.tool()
async def get_tiktok_video_length_rules() -> dict:
    """
    Get TikTok video length rules and philosophy
    """
    async with sessionmanager.session() as session:
        rule = await TikTokRulesRepository.get_video_length_rules(session)
        if not rule:
            return {"error": "Video length rules not configured"}

        return {
            "category": rule.rule_category.value,
            "rules": rule.rule_data
        }


@mcp.tool()
async def get_tiktok_hook_rules() -> dict:
    """
    Get TikTok hook strategy rules
    """
    async with sessionmanager.session() as session:
        rule = await TikTokRulesRepository.get_hook_rules(session)
        if not rule:
            return {"error": "Hook rules not configured"}

        return {
            "category": rule.rule_category.value,
            "rules": rule.rule_data
        }


@mcp.tool()
async def get_tiktok_sentence_rules() -> dict:
    """
    Get TikTok sentence structure rules
    """
    async with sessionmanager.session() as session:
        rule = await TikTokRulesRepository.get_sentence_structure_rules(
            session
        )
        if not rule:
            return {"error": "Sentence rules not configured"}

        return {
            "category": rule.rule_category.value,
            "rules": rule.rule_data
        }


@mcp.tool()
async def get_tiktok_cta_rules() -> dict:
    """
    Get TikTok CTA strategy
    """
    async with sessionmanager.session() as session:
        rule = await TikTokRulesRepository.get_cta_rules(session)
        if not rule:
            return {"error": "CTA rules not configured"}

        return {
            "category": rule.rule_category.value,
            "rules": rule.rule_data
        }


@mcp.tool()
async def get_tiktok_hook_system() -> dict:
    """
    Get three-hook system (visual, text, verbal)
    """
    async with sessionmanager.session() as session:
        hook_system = await TikTokViralityRepository.get_three_hook_system(
            session
        )
        return {
            "hook_system": [
                {
                    "type": h.hook_type.value,
                    "timing": h.timing,
                    "requirements": h.requirements,
                    "max_words": h.max_words,
                    "examples": h.examples,
                    "performance_stat": h.performance_stat,
                } for h in hook_system
            ]
        }


@mcp.tool()
async def get_tiktok_hook_formulas() -> dict:
    """
    Get all TikTok hook formulas
    """
    async with sessionmanager.session() as session:
        formulas = await TikTokViralityRepository.get_all_hook_formulas(
            session
        )
        return {
            "formulas": [
                {
                    "name": f.formula_name,
                    "description": f.description,
                    "examples": f.examples,
                } for f in formulas
            ]
        }


@mcp.tool()
async def get_tiktok_structure_templates(
    video_length: str | None = None
) -> dict:
    """
    Get TikTok structure templates

    Args:
        video_length: Optional filter ("30_second" or "60_second")
    """
    async with sessionmanager.session() as session:
        templates = await TikTokViralityRepository.get_structure_templates(
            session,
            video_length
        )
        return {
            "templates": [
                {
                    "video_length": t.video_length,
                    "timestamp": t.timestamp_range,
                    "purpose": t.purpose,
                    "energy": t.energy_level,
                } for t in templates
            ]
        }


@mcp.tool()
async def get_tiktok_pacing_rules() -> dict:
    """
    Get TikTok pacing rules
    """
    async with sessionmanager.session() as session:
        pacing = await TikTokViralityRepository.get_all_pacing_rules(
            session
        )
        return {
            "pacing":
            [{
                "type": p.rule_type,
                "data": p.rule_data
            } for p in pacing]
        }


@mcp.tool()
async def get_tiktok_retention_tactics() -> dict:
    """
    Get TikTok retention tactics
    """
    async with sessionmanager.session() as session:
        tactics = await TikTokViralityRepository.get_all_retention_tactics(
            session
        )
        return {
            "tactics": [
                {
                    "category": t.tactic_category,
                    "data": t.tactic_data
                } for t in tactics
            ]
        }


@mcp.tool()
async def get_tiktok_cta_strategies(
    video_length: str | None = None
) -> dict:
    """
    Get TikTok CTA strategies

    Args:
        video_length: Optional filter ("15_30_sec", "30_60_sec", "60_plus_sec")
    """
    async with sessionmanager.session() as session:
        strategies = await TikTokViralityRepository.get_cta_strategies(
            session,
            video_length
        )
        return {
            "strategies": [
                {
                    "video_length": s.video_length,
                    "placement": s.placement,
                    "examples": s.high_converting_examples,
                } for s in strategies
            ]
        }


@mcp.tool()
async def get_tiktok_common_mistakes(
    mistake_type: str | None = None
) -> dict:
    """
    Get TikTok common mistakes to avoid

    Args:
        mistake_type: Optional filter ("retention_killer" or "algorithm_error")
    """
    async with sessionmanager.session() as session:
        mistake_enum = TikTokMistakeType(
            mistake_type
        ) if mistake_type else None
        mistakes = await TikTokViralityRepository.get_common_mistakes(
            session,
            mistake_enum
        )
        return {
            "mistakes": [
                {
                    "type": m.mistake_type.value,
                    "mistake": m.mistake,
                    "description": m.description,
                    "impact": m.performance_impact,
                    "solution": m.solution,
                } for m in mistakes
            ]
        }


@mcp.tool()
async def get_tiktok_retention_killers() -> dict:
    """
    Get retention killer mistakes specifically
    """
    async with sessionmanager.session() as session:
        killers = await TikTokViralityRepository.get_retention_killers(
            session
        )
        return {
            "retention_killers": [
                {
                    "mistake": m.mistake,
                    "description": m.description,
                    "impact": m.performance_impact,
                    "solution": m.solution,
                } for m in killers
            ]
        }


@mcp.tool()
async def get_tiktok_platform_specifics() -> dict:
    """
    Get TikTok platform-specific metrics and settings
    """
    async with sessionmanager.session() as session:
        specifics = await TikTokViralityRepository.get_all_platform_specifics(
            session
        )
        return {
            "metrics": [
                {
                    "name": s.metric_name,
                    "value": s.metric_value,
                    "description": s.description,
                } for s in specifics
            ]
        }


@mcp.tool()
async def get_tiktok_top_performers(
    limit: int = 20,
    days: int = 30
) -> dict:
    """
    Get top performing TikTok videos

    Args:
        limit: Max videos to return
        days: Only videos from last N days
    """
    async with sessionmanager.session() as session:
        videos = await TikTokContentRepository.get_top_performers(
            session,
            limit = limit,
            days = days
        )
        return {
            "videos": [
                {
                    "title": v.title,
                    "topic": v.topic,
                    "views": v.views,
                    "likes": v.likes,
                    "engagement_rate": v.engagement_rate,
                    "what_worked": v.what_worked,
                } for v in videos
            ]
        }


@mcp.tool()
async def get_tiktok_performance_summary(days: int = 30) -> dict:
    """
    Get aggregated TikTok performance stats
    """
    async with sessionmanager.session() as session:
        summary = await TikTokContentRepository.get_performance_summary(
            session,
            days
        )
        return summary


@mcp.tool()
async def get_tiktok_content_gaps() -> dict:
    """
    Get topics Carter hasn't covered yet
    """
    async with sessionmanager.session() as session:
        gaps = await TikTokContentRepository.get_content_gaps(session)
        return {"content_gaps": gaps}


@mcp.tool()
async def get_tiktok_hook_templates(
    category: str | None = None,
    limit: int = 100
) -> dict:
    """
    Get hook templates from internet (with placeholders)

    Args:
        category: Optional category filter
        limit: Max templates to return
    """
    async with sessionmanager.session() as session:
        hooks = await TikTokContentRepository.get_hook_templates(
            session,
            category = category,
            limit = limit
        )
        return {
            "templates": [
                {
                    "text": h.hook_text,
                    "category": h.hook_category,
                    "times_used": h.times_used,
                    "avg_performance": h.avg_performance,
                } for h in hooks
            ]
        }


@mcp.tool()
async def get_reddit_forbidden_patterns() -> dict:
    """
    Get forbidden AI detection patterns

    CRITICAL: Used by ALL platforms (not just Reddit)
    Returns em-dash, hyphen, AI language patterns
    """
    async with sessionmanager.session() as session:
        patterns = await PlatformRulesRepository.get_all_reddit_forbidden_patterns(
            session
        )
        return {
            "forbidden_patterns": [
                {
                    "pattern_type": p.pattern_type.value,
                    "pattern": p.pattern,
                    "severity": p.severity.value,
                    "rule": p.rule,
                    "example_wrong": p.example_wrong,
                    "example_right": p.example_right,
                    "note": p.note,
                } for p in patterns
            ]
        }


@mcp.tool()
async def get_tiktok_videos_by_topic(topic: str, limit: int = 20) -> dict:
    """
    Get TikTok videos by topic

    Args:
        topic: Topic to search (e.g., "Python", "certifications")
        limit: Max videos to return
    """
    async with sessionmanager.session() as session:
        videos = await TikTokContentRepository.get_by_topic(
            session,
            topic,
            limit
        )
        return {
            "videos": [
                {
                    "title": v.title,
                    "topic": v.topic,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                } for v in videos
            ]
        }


@mcp.tool()
async def get_tiktok_videos_by_tags(
    tags: list[str],
    limit: int = 20
) -> dict:
    """
    Get TikTok videos by tags

    Args:
        tags: Tags to search
        limit: Max videos
    """
    async with sessionmanager.session() as session:
        videos = await TikTokContentRepository.get_by_tags(
            session,
            tags,
            limit
        )
        return {
            "videos": [
                {
                    "title": v.title,
                    "tags": v.tags,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                } for v in videos
            ]
        }


@mcp.tool()
async def get_tiktok_high_engagement_videos(
    limit: int = 10,
    days: int = 90
) -> dict:
    """
    Get videos with HIGH engagement only
    """
    async with sessionmanager.session() as session:
        videos = await TikTokContentRepository.get_high_engagement_videos(
            session,
            limit = limit,
            days = days
        )
        return {
            "high_engagement_videos": [
                {
                    "title": v.title,
                    "topic": v.topic,
                    "views": v.views,
                    "engagement_rate": v.engagement_rate,
                    "what_worked": v.what_worked,
                } for v in videos
            ]
        }
