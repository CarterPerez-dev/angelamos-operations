"""
ⒸAngelaMos | 2025
identity_mutations.py
"""

from uuid import UUID
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.models.identity import (
    CoreIdentity,
    IdentitySkill,
    IdentityInterest,
    IdentityCertification,
    IdentityStrength,
    IdentityWeakness,
    BrandVoice,
    BrandVoiceAvoid,
    PlatformGoal,
    RevenueGoal,
    ContentPillar,
    ContentPreference,
)
from core.enums import (
    ProficiencyLevel,
    PassionLevel,
    StrengthSource,
    PreferenceType,
    PlatformType,
    EngagementLevel,
)


class IdentityMutations:
    """
    CRUD operations for identity system

    Separate from read-only repository for clarity
    """
    @staticmethod
    async def update_core_identity(
        session: AsyncSession,
        data: dict
    ) -> CoreIdentity:
        """
        Update core identity (singleton) - partial update supported

        Args:
            data: Dict with fields to update (only updates fields present)
                  Fields: name, age, background, current_role, primary_goal, target_audience
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one_or_none()

        if not identity:
            identity = CoreIdentity(
                name=data.get("name", ""),
                age=data.get("age", 0),
                background=data.get("background", ""),
                current_role=data.get("current_role", ""),
                primary_goal=data.get("primary_goal", ""),
                target_audience=data.get("target_audience", ""),
            )
            session.add(identity)
            await session.flush()
            await session.refresh(identity)
            return identity

        if "name" in data:
            identity.name = data["name"]
        if "age" in data:
            identity.age = data["age"]
        if "background" in data:
            identity.background = data["background"]
        if "current_role" in data:
            identity.current_role = data["current_role"]
        if "primary_goal" in data:
            identity.primary_goal = data["primary_goal"]
        if "target_audience" in data:
            identity.target_audience = data["target_audience"]

        await session.flush()
        await session.refresh(identity)
        return identity

    @staticmethod
    async def create_skill(
        session: AsyncSession,
        data: dict
    ) -> IdentitySkill:
        """
        Add new skill

        Args:
            data: {skill, proficiency, years_experience, context (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        skill = IdentitySkill(
            identity_id = identity.id,
            skill = data["skill"],
            proficiency = ProficiencyLevel(data["proficiency"]),
            years_experience = data["years_experience"],
            context = data.get("context"),
        )

        session.add(skill)
        await session.flush()
        await session.refresh(skill)
        return skill

    @staticmethod
    async def update_skill(
        session: AsyncSession,
        skill_id: UUID,
        data: dict
    ) -> IdentitySkill:
        """
        Update existing skill - partial update supported
        """
        result = await session.execute(
            select(IdentitySkill).where(IdentitySkill.id == skill_id)
        )
        skill = result.scalar_one()

        if "skill" in data:
            skill.skill = data["skill"]
        if "proficiency" in data:
            skill.proficiency = ProficiencyLevel(data["proficiency"])
        if "years_experience" in data:
            skill.years_experience = data["years_experience"]
        if "context" in data:
            skill.context = data["context"]

        await session.flush()
        await session.refresh(skill)
        return skill

    @staticmethod
    async def delete_skill(session: AsyncSession, skill_id: UUID) -> None:
        """
        Delete skill
        """
        result = await session.execute(
            select(IdentitySkill).where(IdentitySkill.id == skill_id)
        )
        skill = result.scalar_one()
        await session.delete(skill)
        await session.flush()

    @staticmethod
    async def create_interest(
        session: AsyncSession,
        data: dict
    ) -> IdentityInterest:
        """
        Add new interest

        Args:
            data: {topic, passion_level, why (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        interest = IdentityInterest(
            identity_id = identity.id,
            topic = data["topic"],
            passion_level = PassionLevel(data["passion_level"]),
            why = data.get("why"),
        )

        session.add(interest)
        await session.flush()
        await session.refresh(interest)
        return interest

    @staticmethod
    async def update_interest(
        session: AsyncSession,
        interest_id: UUID,
        data: dict
    ) -> IdentityInterest:
        """
        Update existing interest - partial update supported
        """
        result = await session.execute(
            select(IdentityInterest).where(
                IdentityInterest.id == interest_id
            )
        )
        interest = result.scalar_one()

        if "topic" in data:
            interest.topic = data["topic"]
        if "passion_level" in data:
            interest.passion_level = PassionLevel(data["passion_level"])
        if "why" in data:
            interest.why = data["why"]

        await session.flush()
        await session.refresh(interest)
        return interest

    @staticmethod
    async def delete_interest(
        session: AsyncSession,
        interest_id: UUID
    ) -> None:
        """
        Delete interest
        """
        result = await session.execute(
            select(IdentityInterest).where(
                IdentityInterest.id == interest_id
            )
        )
        interest = result.scalar_one()
        await session.delete(interest)
        await session.flush()

    @staticmethod
    async def create_certification(
        session: AsyncSession,
        data: dict
    ) -> IdentityCertification:
        """
        Add certification

        Args:
            data: {name, date_earned, time_to_complete (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        date_str = data["date_earned"]
        if isinstance(date_str, str):
            if len(date_str) == 7:
                date_str = f"{date_str}-01"
            date_earned = date.fromisoformat(date_str)
        else:
            date_earned = date_str

        cert = IdentityCertification(
            identity_id=identity.id,
            name=data["name"],
            date_earned=date_earned,
            time_to_complete=data.get("time_to_complete"),
        )

        session.add(cert)
        await session.flush()
        await session.refresh(cert)
        return cert

    @staticmethod
    async def update_certification(
        session: AsyncSession,
        cert_id: UUID,
        data: dict
    ) -> IdentityCertification:
        """
        Update certification - partial update supported
        """
        result = await session.execute(
            select(IdentityCertification).where(
                IdentityCertification.id == cert_id
            )
        )
        cert = result.scalar_one()

        if "name" in data:
            cert.name = data["name"]
        if "date_earned" in data:
            cert.date_earned = (
                date.fromisoformat(data["date_earned"])
                if isinstance(data["date_earned"],
                              str) else data["date_earned"]
            )
        if "time_to_complete" in data:
            cert.time_to_complete = data["time_to_complete"]

        await session.flush()
        await session.refresh(cert)
        return cert

    @staticmethod
    async def delete_certification(
        session: AsyncSession,
        cert_id: UUID
    ) -> None:
        """
        Delete certification
        """
        result = await session.execute(
            select(IdentityCertification).where(
                IdentityCertification.id == cert_id
            )
        )
        cert = result.scalar_one()
        await session.delete(cert)
        await session.flush()

    @staticmethod
    async def create_strength(
        session: AsyncSession,
        data: dict
    ) -> IdentityStrength:
        """
        Add strength

        Args:
            data: {strength, source, evidence (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        strength = IdentityStrength(
            identity_id = identity.id,
            strength = data["strength"],
            source = StrengthSource(data["source"]),
            evidence = data.get("evidence"),
        )

        session.add(strength)
        await session.flush()
        await session.refresh(strength)
        return strength

    @staticmethod
    async def update_strength(
        session: AsyncSession,
        strength_id: UUID,
        data: dict
    ) -> IdentityStrength:
        """
        Update strength - partial update supported
        """
        result = await session.execute(
            select(IdentityStrength).where(
                IdentityStrength.id == strength_id
            )
        )
        strength = result.scalar_one()

        if "strength" in data:
            strength.strength = data["strength"]
        if "source" in data:
            strength.source = StrengthSource(data["source"])
        if "evidence" in data:
            strength.evidence = data["evidence"]

        await session.flush()
        await session.refresh(strength)
        return strength

    @staticmethod
    async def delete_strength(
        session: AsyncSession,
        strength_id: UUID
    ) -> None:
        """
        Delete strength
        """
        result = await session.execute(
            select(IdentityStrength).where(
                IdentityStrength.id == strength_id
            )
        )
        strength = result.scalar_one()
        await session.delete(strength)
        await session.flush()

    @staticmethod
    async def create_weakness(
        session: AsyncSession,
        data: dict
    ) -> IdentityWeakness:
        """
        Add weakness

        Args:
            data: {weakness, impact, workaround (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        weakness = IdentityWeakness(
            identity_id = identity.id,
            weakness = data["weakness"],
            impact = data["impact"],
            workaround = data.get("workaround"),
        )

        session.add(weakness)
        await session.flush()
        await session.refresh(weakness)
        return weakness

    @staticmethod
    async def update_weakness(
        session: AsyncSession,
        weakness_id: UUID,
        data: dict
    ) -> IdentityWeakness:
        """
        Update weakness - partial update supported
        """
        result = await session.execute(
            select(IdentityWeakness).where(
                IdentityWeakness.id == weakness_id
            )
        )
        weakness = result.scalar_one()

        if "weakness" in data:
            weakness.weakness = data["weakness"]
        if "impact" in data:
            weakness.impact = data["impact"]
        if "workaround" in data:
            weakness.workaround = data["workaround"]

        await session.flush()
        await session.refresh(weakness)
        return weakness

    @staticmethod
    async def delete_weakness(
        session: AsyncSession,
        weakness_id: UUID
    ) -> None:
        """
        Delete weakness
        """
        result = await session.execute(
            select(IdentityWeakness).where(
                IdentityWeakness.id == weakness_id
            )
        )
        weakness = result.scalar_one()
        await session.delete(weakness)
        await session.flush()

    @staticmethod
    async def update_brand_voice(
        session: AsyncSession,
        data: dict
    ) -> BrandVoice:
        """
        Update brand voice - partial update supported

        Args:
            data: {tone, sentence_structure, uses_analogies, explanation_method}
        """
        result = await session.execute(select(BrandVoice).limit(1))
        brand_voice = result.scalar_one_or_none()

        if not brand_voice:
            identity = await session.execute(select(CoreIdentity).limit(1))
            brand_voice = BrandVoice(
                identity_id = identity.scalar_one().id
            )
            session.add(brand_voice)

        if "tone" in data:
            brand_voice.tone = data["tone"]
        if "sentence_structure" in data:
            brand_voice.sentence_structure = data["sentence_structure"]
        if "uses_analogies" in data:
            brand_voice.uses_analogies = data["uses_analogies"]
        if "explanation_method" in data:
            brand_voice.explanation_method = data["explanation_method"]

        await session.flush()
        await session.refresh(brand_voice)
        return brand_voice

    @staticmethod
    async def create_avoid_pattern(
        session: AsyncSession,
        data: dict
    ) -> BrandVoiceAvoid:
        """
        Add pattern to avoid

        Args:
            data: {pattern, reason}
        """
        brand_voice = await session.execute(select(BrandVoice).limit(1))
        brand_voice_obj = brand_voice.scalar_one()

        avoid = BrandVoiceAvoid(
            brand_voice_id = brand_voice_obj.id,
            pattern = data["pattern"],
            reason = data["reason"],
        )

        session.add(avoid)
        await session.flush()
        await session.refresh(avoid)
        return avoid

    @staticmethod
    async def update_avoid_pattern(
        session: AsyncSession,
        avoid_id: UUID,
        data: dict
    ) -> BrandVoiceAvoid:
        """
        Update avoid pattern - partial update supported
        """
        result = await session.execute(
            select(BrandVoiceAvoid).where(BrandVoiceAvoid.id == avoid_id)
        )
        avoid = result.scalar_one()

        if "pattern" in data:
            avoid.pattern = data["pattern"]
        if "reason" in data:
            avoid.reason = data["reason"]

        await session.flush()
        await session.refresh(avoid)
        return avoid

    @staticmethod
    async def delete_avoid_pattern(
        session: AsyncSession,
        avoid_id: UUID
    ) -> None:
        """
        Delete avoid pattern
        """
        result = await session.execute(
            select(BrandVoiceAvoid).where(BrandVoiceAvoid.id == avoid_id)
        )
        avoid = result.scalar_one()
        await session.delete(avoid)
        await session.flush()

    @staticmethod
    async def create_platform_goal(
        session: AsyncSession,
        data: dict
    ) -> PlatformGoal:
        """
        Add platform goal

        Args:
            data: {platform, current_followers, goal_followers, time_to_goal, current_status, strategy}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        goal = PlatformGoal(
            identity_id = identity.id,
            platform = PlatformType(data["platform"]),
            current_followers = data.get("current_followers"),
            goal_followers = data.get("goal_followers"),
            time_to_goal = data.get("time_to_goal"),
            current_status = data.get("current_status"),
            strategy = data.get("strategy"),
        )

        session.add(goal)
        await session.flush()
        await session.refresh(goal)
        return goal

    @staticmethod
    async def update_platform_goal(
        session: AsyncSession,
        goal_id: UUID,
        data: dict
    ) -> PlatformGoal:
        """
        Update platform goal - partial update supported
        """
        result = await session.execute(
            select(PlatformGoal).where(PlatformGoal.id == goal_id)
        )
        goal = result.scalar_one()

        if "current_followers" in data:
            goal.current_followers = data["current_followers"]
        if "goal_followers" in data:
            goal.goal_followers = data["goal_followers"]
        if "time_to_goal" in data:
            goal.time_to_goal = data["time_to_goal"]
        if "current_status" in data:
            goal.current_status = data["current_status"]
        if "strategy" in data:
            goal.strategy = data["strategy"]

        await session.flush()
        await session.refresh(goal)
        return goal

    @staticmethod
    async def delete_platform_goal(
        session: AsyncSession,
        goal_id: UUID
    ) -> None:
        """
        Delete platform goal
        """
        result = await session.execute(
            select(PlatformGoal).where(PlatformGoal.id == goal_id)
        )
        goal = result.scalar_one()
        await session.delete(goal)
        await session.flush()

    @staticmethod
    async def update_revenue_goals(
        session: AsyncSession,
        data: dict
    ) -> RevenueGoal:
        """
        Update revenue goals - partial update supported

        Args:
            data: {paying_users_target, monthly_price, monthly_revenue_target, current_paying_users, note}
        """
        result = await session.execute(select(RevenueGoal).limit(1))
        revenue_goal = result.scalar_one_or_none()

        if not revenue_goal:
            identity = await session.execute(select(CoreIdentity).limit(1))
            revenue_goal = RevenueGoal(
                identity_id = identity.scalar_one().id,
                paying_users_target = 0,
                monthly_price = 0,
                monthly_revenue_target = 0,
                current_paying_users = 0,
            )
            session.add(revenue_goal)

        if "paying_users_target" in data:
            revenue_goal.paying_users_target = data["paying_users_target"]
        if "monthly_price" in data:
            revenue_goal.monthly_price = data["monthly_price"]
        if "monthly_revenue_target" in data:
            revenue_goal.monthly_revenue_target = data[
                "monthly_revenue_target"]
        if "current_paying_users" in data:
            revenue_goal.current_paying_users = data["current_paying_users"
                                                     ]
        if "note" in data:
            revenue_goal.note = data["note"]

        await session.flush()
        await session.refresh(revenue_goal)
        return revenue_goal

    @staticmethod
    async def create_content_pillar(
        session: AsyncSession,
        data: dict
    ) -> ContentPillar:
        """
        Add content pillar

        Args:
            data: {pillar, description (optional)}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        pillar = ContentPillar(
            identity_id = identity.id,
            pillar = data["pillar"],
            description = data.get("description"),
        )

        session.add(pillar)
        await session.flush()
        await session.refresh(pillar)
        return pillar

    @staticmethod
    async def update_content_pillar(
        session: AsyncSession,
        pillar_id: UUID,
        data: dict
    ) -> ContentPillar:
        """
        Update content pillar - partial update supported
        """
        result = await session.execute(
            select(ContentPillar).where(ContentPillar.id == pillar_id)
        )
        pillar = result.scalar_one()

        if "pillar" in data:
            pillar.pillar = data["pillar"]
        if "description" in data:
            pillar.description = data["description"]

        await session.flush()
        await session.refresh(pillar)
        return pillar

    @staticmethod
    async def delete_content_pillar(
        session: AsyncSession,
        pillar_id: UUID
    ) -> None:
        """
        Delete content pillar
        """
        result = await session.execute(
            select(ContentPillar).where(ContentPillar.id == pillar_id)
        )
        pillar = result.scalar_one()
        await session.delete(pillar)
        await session.flush()

    @staticmethod
    async def create_content_preference(
        session: AsyncSession,
        data: dict
    ) -> ContentPreference:
        """
        Add content preference

        Args:
            data: {preference_type, content_type, platform, evidence, engagement_level, reason, challenge}
        """
        result = await session.execute(select(CoreIdentity).limit(1))
        identity = result.scalar_one()

        pref = ContentPreference(
            identity_id = identity.id,
            preference_type = PreferenceType(data["preference_type"]),
            content_type = data["content_type"],
            platform = PlatformType(data["platform"])
            if data.get("platform") else None,
            evidence = data.get("evidence"),
            engagement_level = EngagementLevel(data["engagement_level"])
            if data.get("engagement_level") else None,
            reason = data.get("reason"),
            challenge = data.get("challenge"),
        )

        session.add(pref)
        await session.flush()
        await session.refresh(pref)
        return pref

    @staticmethod
    async def update_content_preference(
        session: AsyncSession,
        pref_id: UUID,
        data: dict
    ) -> ContentPreference:
        """
        Update content preference - partial update supported
        """
        result = await session.execute(
            select(ContentPreference).where(
                ContentPreference.id == pref_id
            )
        )
        pref = result.scalar_one()

        if "preference_type" in data:
            pref.preference_type = PreferenceType(data["preference_type"])
        if "content_type" in data:
            pref.content_type = data["content_type"]
        if "platform" in data:
            pref.platform = (
                PlatformType(data["platform"])
                if data["platform"] else None
            )
        if "evidence" in data:
            pref.evidence = data["evidence"]
        if "engagement_level" in data:
            pref.engagement_level = (
                EngagementLevel(data["engagement_level"])
                if data["engagement_level"] else None
            )
        if "reason" in data:
            pref.reason = data["reason"]
        if "challenge" in data:
            pref.challenge = data["challenge"]

        await session.flush()
        await session.refresh(pref)
        return pref

    @staticmethod
    async def delete_content_preference(
        session: AsyncSession,
        pref_id: UUID
    ) -> None:
        """
        Delete content preference
        """
        result = await session.execute(
            select(ContentPreference).where(
                ContentPreference.id == pref_id
            )
        )
        pref = result.scalar_one()
        await session.delete(pref)
        await session.flush()
