"""
ⒸAngelaMos | 2025
identity.py
"""

import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.foundation.models.identity import (
    CoreIdentity,
    IdentitySkill,
    IdentityInterest,
    IdentityStrength,
    IdentityWeakness,
    BrandVoice,
    PlatformGoal,
    ContentPreference,
)
from core.enums import (
    ProficiencyLevel,
    PassionLevel,
    StrengthSource,
    PreferenceType,
    PlatformType,
)


class IdentityRepository:
    """
    Repository for Carter's core identity data
    """
    @staticmethod
    async def get_identity(session: AsyncSession) -> CoreIdentity:
        """
        Get THE core identity (singleton)
        Eager loads all relationships
        """
        result = await session.execute(
            select(CoreIdentity).options(
                selectinload(CoreIdentity.skills),
                selectinload(CoreIdentity.interests),
                selectinload(CoreIdentity.certifications),
                selectinload(CoreIdentity.strengths),
                selectinload(CoreIdentity.weaknesses),
                selectinload(CoreIdentity.brand_voice).selectinload(
                    BrandVoice.avoid_patterns
                ),
                selectinload(CoreIdentity.platform_goals),
                selectinload(CoreIdentity.revenue_goal),
                selectinload(CoreIdentity.content_pillars),
                selectinload(CoreIdentity.content_preferences),
            ).limit(1)
        )
        identity = result.scalar_one_or_none()
        if not identity:
            raise ValueError("Core identity not found")
        return identity

    @staticmethod
    async def get_skills_by_proficiency(
        session: AsyncSession,
        proficiency: ProficiencyLevel,
    ) -> list[IdentitySkill]:
        """
        Get skills filtered by proficiency level
        """
        result = await session.execute(
            select(IdentitySkill).where(
                IdentitySkill.proficiency == proficiency
            ).order_by(IdentitySkill.years_experience.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_expert_skills(
        session: AsyncSession
    ) -> list[IdentitySkill]:
        """
        Get expert-level skills (Carter's strongest areas)
        """
        return await IdentityRepository.get_skills_by_proficiency(
            session,
            ProficiencyLevel.EXPERT
        )

    @staticmethod
    async def get_passionate_interests(
        session: AsyncSession,
    ) -> list[IdentityInterest]:
        """
        Get passionate and obsessed interests
        """
        result = await session.execute(
            select(IdentityInterest).where(
                IdentityInterest.passion_level.in_(
                    [PassionLevel.PASSIONATE,
                     PassionLevel.OBSESSED]
                )
            ).order_by(IdentityInterest.passion_level.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_content_preferences(
        session: AsyncSession,
        preference_type: PreferenceType,
        platform: PlatformType | None = None,
    ) -> list[ContentPreference]:
        """
        Get content preferences with optional platform filter
        """
        query = select(ContentPreference).where(
            ContentPreference.preference_type == preference_type
        )

        if platform:
            query = query.where(
                sa.or_(
                    ContentPreference.platform == platform,
                    ContentPreference.platform.is_(None),
                )
            )

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_engagement_winners(
        session: AsyncSession,
        platform: PlatformType
    ) -> list[ContentPreference]:
        """
        Get content that performs well (engagement winners)
        """
        return await IdentityRepository.get_content_preferences(
            session,
            PreferenceType.ENGAGEMENT_WINNER,
            platform
        )

    @staticmethod
    async def get_burnt_out_content(
        session: AsyncSession,
    ) -> list[ContentPreference]:
        """
        Get topics Carter is burnt out on
        """
        return await IdentityRepository.get_content_preferences(
            session,
            PreferenceType.BURNT_OUT_ON,
            None
        )

    @staticmethod
    async def get_wants_to_make(
        session: AsyncSession
    ) -> list[ContentPreference]:
        """
        Get content Carter wants to create more of
        """
        return await IdentityRepository.get_content_preferences(
            session,
            PreferenceType.WANTS_TO_MAKE,
            None
        )

    @staticmethod
    async def get_platform_goal(
        session: AsyncSession,
        platform: PlatformType
    ) -> PlatformGoal | None:
        """
        Get 12-month goal for specific platform
        """
        result = await session.execute(
            select(PlatformGoal).where(PlatformGoal.platform == platform)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_brand_voice(session: AsyncSession) -> BrandVoice | None:
        """
        Get brand voice with avoid patterns
        """
        result = await session.execute(
            select(BrandVoice).options(
                selectinload(BrandVoice.avoid_patterns)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_strengths_by_source(
        session: AsyncSession,
        source: StrengthSource
    ) -> list[IdentityStrength]:
        """
        Get strengths filtered by source
        """
        result = await session.execute(
            select(IdentityStrength).where(
                IdentityStrength.source == source
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_weaknesses(
        session: AsyncSession
    ) -> list[IdentityWeakness]:
        """
        Get all weaknesses with workarounds
        """
        result = await session.execute(select(IdentityWeakness))
        return list(result.scalars().all())
