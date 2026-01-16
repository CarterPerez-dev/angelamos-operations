"""
ⒸAngelaMos | 2025
seed_data.py
"""

import asyncio
import json
import sys
import os
from pathlib import Path
from datetime import date

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:yoshi2003@localhost:4420/app_db"
)

from core.infrastructure.database.session import sessionmanager
from core.foundation.repositories.identity_mutations import IdentityMutations
from aspects.content_studio.shared.models.content_tracking import (
    HookList,
    ContentHistory,
)
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
    PlatformType,
    ContentType,
    ContentStatus,
    TikTokRuleCategory,
    SubredditPriority,
    ForbiddenPatternType,
    PatternSeverity,
    TikTokHookType,
    TikTokMistakeType,
)


async def seed_core_identity():
    """
    Seed core identity from core-identity.json
    """
    json_path = Path("/home/yoshi/dev/operations/json-schemas/core-identity.json")

    print(f"Reading {json_path}...")
    with open(json_path) as f:
        data = json.load(f)

    async with sessionmanager.session() as session:
        print("Seeding core identity...")

        await IdentityMutations.update_core_identity(
            session,
            {
                "name": data["identity"]["name"],
                "age": data["identity"]["age"],
                "background": data["identity"]["background"],
                "current_role": data["identity"]["current_role"],
                "primary_goal": data["goals"]["primary"],
                "target_audience": data["goals"]["audience"],
            },
        )

        print("Seeding skills...")
        for skill in data["identity"]["skills"]:
            await IdentityMutations.create_skill(session, skill)

        print("Seeding interests...")
        for interest in data["identity"]["interests"]:
            await IdentityMutations.create_interest(session, interest)

        print("Seeding certifications...")
        for cert in data["identity"]["certifications"]:
            await IdentityMutations.create_certification(session, cert)

        print("Seeding strengths...")
        for strength in data["strengths"]:
            await IdentityMutations.create_strength(session, strength)

        print("Seeding weaknesses...")
        for weakness in data["identity"]["weaknesses"]:
            await IdentityMutations.create_weakness(session, weakness)

        print("Seeding brand voice...")
        await IdentityMutations.update_brand_voice(
            session,
            {
                "tone": data["brand_voice"]["tone"],
                "sentence_structure": data["brand_voice"]["style"].get(
                    "sentence_structure", ""
                ),
                "uses_analogies": data["brand_voice"]["style"].get("analogies", True),
                "explanation_method": data["brand_voice"]["style"].get(
                    "explanation_method", ""
                ),
            },
        )

        print("Seeding brand voice avoid patterns...")
        for avoid in data["brand_voice"].get("avoid", []):
            await IdentityMutations.create_avoid_pattern(session, avoid)

        print("Seeding platform goals...")
        for platform_data in data["goals"]["platforms"]:
            await IdentityMutations.create_platform_goal(
                session,
                {
                    "platform": platform_data["platform"],
                    "current_followers": platform_data.get("current_followers"),
                    "goal_followers": platform_data.get("goal_followers"),
                    "time_to_goal": platform_data.get("time_to_goal"),
                    "current_status": platform_data.get("current_status"),
                    "strategy": platform_data.get("strategy"),
                },
            )

        print("Seeding revenue goals...")
        revenue = data["identity"].get("revenue_goals", {})
        if revenue:
            await IdentityMutations.update_revenue_goals(
                session,
                {
                    "paying_users_target": revenue["paying_users"],
                    "monthly_price": revenue["monthly_price"],
                    "monthly_revenue_target": revenue["monthly_revenue_target"],
                    "current_paying_users": revenue["current_paying_users"],
                    "note": revenue.get("freemium_goal"),
                },
            )

        print("Seeding content pillars...")
        for pillar in data["identity"].get("content_pillars", []):
            await IdentityMutations.create_content_pillar(
                session, {"pillar": pillar, "description": None}
            )

        print("Seeding engagement winners...")
        for pref in data["content_preferences"]["engagement_winners"]:
            await IdentityMutations.create_content_preference(
                session,
                {
                    "preference_type": "engagement_winner",
                    "content_type": pref["content_type"],
                    "platform": pref.get("platform").lower() if pref.get("platform") else None,
                    "evidence": pref.get("evidence"),
                    "engagement_level": pref.get("engagement_level"),
                    "reason": pref.get("note"),
                    "challenge": None,
                },
            )

        print("Seeding burnt out content...")
        for pref in data["content_preferences"]["burnt_out_on"]:
            await IdentityMutations.create_content_preference(
                session,
                {
                    "preference_type": "burnt_out_on",
                    "content_type": pref.get("topic", ""),
                    "platform": None,
                    "evidence": None,
                    "engagement_level": None,
                    "reason": pref.get("reason"),
                    "challenge": pref.get("the_tension"),
                },
            )

        print("Seeding wants to make...")
        for pref in data["content_preferences"]["wants_to_make"]:
            await IdentityMutations.create_content_preference(
                session,
                {
                    "preference_type": "wants_to_make",
                    "content_type": pref.get("content_type", ""),
                    "platform": None,
                    "evidence": None,
                    "engagement_level": None,
                    "reason": pref.get("why"),
                    "challenge": pref.get("challenge"),
                },
            )

        print("Seeding personal enjoyment...")
        for content in data["content_preferences"]["personal_enjoyment"]:
            await IdentityMutations.create_content_preference(
                session,
                {
                    "preference_type": "personal_enjoyment",
                    "content_type": content,
                    "platform": None,
                    "evidence": None,
                    "engagement_level": None,
                    "reason": None,
                    "challenge": None,
                },
            )

        await session.commit()
        print("✅ Core identity seeded successfully!")


async def seed_hook_list():
    """
    Seed hook templates from hook_list.json
    """
    json_path = Path("/home/yoshi/dev/operations/json-schemas/hook_list.json")

    print(f"Reading {json_path}...")
    with open(json_path) as f:
        hooks = json.load(f)

    async with sessionmanager.session() as session:
        print(f"Seeding {len(hooks)} hook templates...")

        for hook_data in hooks:
            hook = HookList(
                hook_text=hook_data["hook_text"],
                hook_category=hook_data.get("hook_category"),
                platform=PlatformType(hook_data["platform"])
                if hook_data.get("platform") and hook_data["platform"] != "all"
                else None,
                times_used=0,
                avg_performance=None,
            )
            session.add(hook)

        await session.commit()
        print(f"✅ {len(hooks)} hook templates seeded!")


async def seed_content_history():
    """
    Seed past content from content-history.json
    """
    from datetime import datetime

    json_path = Path("/home/yoshi/dev/operations/json-schemas/content-history.json")

    print(f"Reading {json_path}...")
    with open(json_path) as f:
        content_list = json.load(f)

    async with sessionmanager.session() as session:
        print(f"Seeding {len(content_list)} past videos...")

        for content_data in content_list:
            published_at_str = content_data.get("published_at")
            published_at = (
                datetime.fromisoformat(published_at_str)
                if published_at_str
                else None
            )

            content = ContentHistory(
                platform=PlatformType(content_data["platform"]),
                content_type=ContentType(content_data["content_type"]),
                title=content_data.get("title"),
                topic=content_data.get("topic"),
                tags=content_data.get("tags", []),
                script_or_content=content_data.get("script_or_content"),
                url=content_data.get("url"),
                published_at=published_at,
                status=ContentStatus.PUBLISHED,
                views=content_data.get("views", 0),
                likes=content_data.get("likes", 0),
                comments=content_data.get("comments", 0),
                shares=content_data.get("shares", 0),
                saves=content_data.get("saves", 0),
                engagement_rate=content_data.get("engagement_rate"),
                what_worked=content_data.get("what_worked"),
                what_didnt=content_data.get("what_didnt"),
            )
            session.add(content)

        await session.commit()
        print(f"✅ {len(content_list)} videos seeded!")


async def main():
    """
    Run all seeding tasks
    """
    print("=" * 60)
    print("CarterOS Data Seeding Script")
    print("=" * 60)

    print("\nInitializing database connection...")
    sessionmanager.init(os.environ["DATABASE_URL"])

    try:
        print("\n1. Seeding Core Identity...")
        await seed_core_identity()

        print("\n2. Seeding Hook Templates...")
        await seed_hook_list()

        print("\n3. Seeding Content History...")
        await seed_content_history()

        print("\n" + "=" * 60)
        print("✅ ALL DATA SEEDED SUCCESSFULLY!")
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
