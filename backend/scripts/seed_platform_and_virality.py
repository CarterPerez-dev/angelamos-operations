"""
ⒸAngelaMos | 2025
seed_platform_and_virality.py
"""

import asyncio
import json
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:yoshi2003@localhost:4420/app_db"
)

from core.infrastructure.database.session import sessionmanager
from aspects.content_studio.shared.models.platform_rules import (
    RedditSubreddit,
    RedditSubredditRule,
    RedditForbiddenPattern,
    RedditUpvoteDriver,
    TikTokRule,
    LinkedInRule,
    TwitterRule,
    YouTubeRule,
)
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
from core.enums import (
    TikTokRuleCategory,
    SubredditPriority,
    ForbiddenPatternType,
    PatternSeverity,
    TikTokHookType,
    TikTokMistakeType,
)


async def seed_platform_rules():
    """
    Seed platform rules from platform-rules.json
    """
    json_path = Path("/home/yoshi/dev/operations/json-schemas/platform-rules.json")

    print(f"Reading {json_path}...")
    with open(json_path) as f:
        data = json.load(f)

    async with sessionmanager.session() as session:
        print("Seeding Reddit subreddits...")
        for sub in data["reddit"]["target_subreddits"]:
            priority_map = {
                "HIGHEST": SubredditPriority.HIGHEST,
                "HIGH": SubredditPriority.HIGH,
                "MEDIUM": SubredditPriority.MEDIUM,
                "LOW": SubredditPriority.LOW,
            }

            self_promo = sub.get("self_promotion_allowed", False)
            if isinstance(self_promo, str):
                self_promo = False

            subreddit = RedditSubreddit(
                name=sub["name"],
                description=sub.get("note"),
                self_promotion_allowed=self_promo,
                priority=priority_map.get(sub.get("priority", "LOW"), SubredditPriority.LOW),
            )
            session.add(subreddit)

        print("Seeding Reddit forbidden patterns...")
        for pattern_name, pattern_data in data["reddit"]["forbidden_patterns"].items():
            if pattern_name != "ai_language":
                forbidden = RedditForbiddenPattern(
                    pattern_type=ForbiddenPatternType.EM_DASH if pattern_name == "em_dashes" else ForbiddenPatternType.HYPHEN,
                    pattern=pattern_data["pattern"],
                    severity=PatternSeverity(pattern_data["severity"].lower()),
                    rule=pattern_data["rule"],
                    example_wrong=pattern_data.get("example_wrong"),
                    example_right=pattern_data.get("example_right"),
                    note=pattern_data.get("explanation"),
                )
                session.add(forbidden)
            else:
                for word in pattern_data.get("forbidden_words", []):
                    forbidden = RedditForbiddenPattern(
                        pattern_type=ForbiddenPatternType.AI_LANGUAGE,
                        pattern=word,
                        severity=PatternSeverity.WARNING,
                        rule=pattern_data.get("explanation", ""),
                        example_wrong=None,
                        example_right=None,
                        note=pattern_data.get("solution"),
                    )
                    session.add(forbidden)

        print("Seeding Reddit upvote drivers...")
        for idx, driver in enumerate(data["reddit"]["upvote_drivers"]["hierarchy"]):
            upvote_driver = RedditUpvoteDriver(
                criterion=driver,
                priority=idx + 1,
                description=data["reddit"]["upvote_drivers"].get("explanation", ""),
            )
            session.add(upvote_driver)

        print("Seeding TikTok rules (JSONB)...")
        tiktok_data = data["tiktok"]
        tiktok_rule = TikTokRule(
            rule_category=TikTokRuleCategory.VIDEO_LENGTH,
            rule_data=tiktok_data["video_length"],
        )
        session.add(tiktok_rule)

        tiktok_rule = TikTokRule(
            rule_category=TikTokRuleCategory.VISUAL_STYLE,
            rule_data=tiktok_data["visual_style"],
        )
        session.add(tiktok_rule)

        tiktok_rule = TikTokRule(
            rule_category=TikTokRuleCategory.HOOKS,
            rule_data=tiktok_data["hooks"],
        )
        session.add(tiktok_rule)

        tiktok_rule = TikTokRule(
            rule_category=TikTokRuleCategory.SENTENCE_STRUCTURE,
            rule_data=tiktok_data["sentence_structure"],
        )
        session.add(tiktok_rule)

        tiktok_rule = TikTokRule(
            rule_category=TikTokRuleCategory.CTA,
            rule_data=tiktok_data["cta"],
        )
        session.add(tiktok_rule)

        await session.commit()
        print("✅ Platform rules seeded!")


async def seed_virality_techniques():
    """
    Seed virality techniques from virality-techniques.json
    """
    json_path = Path("/home/yoshi/dev/operations/json-schemas/virality-techniques.json")

    print(f"Reading {json_path}...")
    with open(json_path) as f:
        data = json.load(f)

    async with sessionmanager.session() as session:
        tiktok = data["tiktok"]

        print("Seeding TikTok three-hook system...")
        three_hook = tiktok["hooks"]["three_hook_system"]
        for hook_type_name, hook_data in three_hook.items():
            if hook_type_name in ["visual_hook", "text_hook", "verbal_hook"]:
                hook_type_map = {
                    "visual_hook": TikTokHookType.VISUAL,
                    "text_hook": TikTokHookType.TEXT,
                    "verbal_hook": TikTokHookType.VERBAL,
                }

                max_words_val = hook_data.get("max_words")
                if isinstance(max_words_val, str):
                    import re
                    match = re.search(r'(\d+)', max_words_val)
                    max_words_val = int(match.group(1)) if match else None

                hook_system = TikTokHookSystem(
                    hook_type=hook_type_map[hook_type_name],
                    timing=hook_data.get("timing"),
                    requirements=hook_data.get("requirements"),
                    max_words=max_words_val,
                    examples=hook_data.get("examples", []),
                    performance_stat=hook_data.get("performance") or hook_data.get("critical_stat"),
                )
                session.add(hook_system)

        print("Seeding TikTok hook formulas...")
        for formula_name, examples in tiktok["hooks"]["hook_formulas"].items():
            if isinstance(examples, list):
                formula = TikTokHookFormula(
                    formula_name=formula_name,
                    description=None,
                    examples=examples,
                )
                session.add(formula)
            elif isinstance(examples, dict):
                formula = TikTokHookFormula(
                    formula_name=formula_name,
                    description=examples.get("description"),
                    examples=examples.get("examples", []),
                )
                session.add(formula)

        print("Seeding TikTok structure templates...")
        for length, template_data in tiktok["structure"].items():
            if "template" in length:
                for timestamp, purpose in template_data.items():
                    if timestamp not in ["strategy", "simplify_then_expand_framework"]:
                        struct = TikTokStructureTemplate(
                            video_length=length.replace("_template", ""),
                            timestamp_range=timestamp,
                            purpose=purpose if isinstance(purpose, str) else str(purpose),
                            energy_level=None,
                        )
                        session.add(struct)

        print("Seeding TikTok pacing rules...")
        for rule_name, rule_value in tiktok["pacing"].items():
            pacing = TikTokPacing(
                rule_type=rule_name,
                rule_data=rule_value if isinstance(rule_value, dict) else {"value": rule_value},
            )
            session.add(pacing)

        print("Seeding TikTok retention tactics...")
        for tactic_name, tactic_data in tiktok["retention_tactics"].items():
            retention = TikTokRetentionTactic(
                tactic_category=tactic_name,
                tactic_data=tactic_data,
            )
            session.add(retention)

        print("Seeding TikTok CTA strategies...")
        if "cta_strategies" in tiktok:
            for length, cta_data in tiktok["cta_strategies"].get("placement_by_length", {}).items():
                cta = TikTokCTAStrategy(
                    video_length=length,
                    placement=cta_data,
                    high_converting_examples=tiktok["cta_strategies"].get("high_converting_wording", {}).get("for_follows", []),
                )
                session.add(cta)

        print("Seeding TikTok common mistakes...")
        for mistake in tiktok["common_mistakes"].get("retention_killers", []):
            common_mistake = TikTokCommonMistake(
                mistake_type=TikTokMistakeType.RETENTION_KILLER,
                mistake=mistake["mistake"],
                description=mistake.get("description"),
                performance_impact=mistake.get("performance_impact"),
                solution=mistake.get("solution"),
            )
            session.add(common_mistake)

        for mistake in tiktok["common_mistakes"].get("algorithm_errors", []):
            common_mistake = TikTokCommonMistake(
                mistake_type=TikTokMistakeType.ALGORITHM_ERROR,
                mistake=mistake["mistake"],
                description=mistake.get("description"),
                performance_impact=mistake.get("impact"),
                solution=mistake.get("best_practice") or mistake.get("solution"),
            )
            session.add(common_mistake)

        print("Seeding TikTok platform specifics...")
        for metric_name, metric_value in tiktok["platform_specifics"].items():
            if metric_name not in ["peak_engagement_times", "trending_formats_2024_2025", "algorithm_signals_hierarchy", "target_metrics"]:
                specific = TikTokPlatformSpecific(
                    metric_name=metric_name,
                    metric_value=str(metric_value),
                    description=None,
                )
                session.add(specific)
            else:
                specific = TikTokPlatformSpecific(
                    metric_name=metric_name,
                    metric_value=json.dumps(metric_value),
                    description=None,
                )
                session.add(specific)

        await session.commit()
        print("✅ Virality techniques seeded!")


async def main():
    """
    Run platform rules and virality seeding only
    """
    print("=" * 60)
    print("Platform Rules & Virality Seeding Script")
    print("=" * 60)

    print("\nInitializing database connection...")
    sessionmanager.init(os.environ["DATABASE_URL"])

    try:
        print("\n1. Seeding Platform Rules...")
        await seed_platform_rules()

        print("\n2. Seeding Virality Techniques...")
        await seed_virality_techniques()

        print("\n" + "=" * 60)
        print("✅ ALL RULES & VIRALITY DATA SEEDED!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ SEEDING FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        print("\nClosing database connection...")
        await sessionmanager.close()


if __name__ == "__main__":
    asyncio.run(main())
