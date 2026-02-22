"""
ⒸAngelaMos | 2026
repository.py
"""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.repositories.base import BaseRepository
from aspects.life_manager.facets.career.job_app_tracker.models import JobApplication
from aspects.life_manager.facets.career.job_app_tracker.enums import (
    ApplicationStatus,
    Outcome,
)


class JobApplicationRepository(BaseRepository[JobApplication]):
    """
    Repository for JobApplication operations
    """
    model = JobApplication

    @classmethod
    async def get_by_user(
        cls,
        session: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50,
    ) -> Sequence[JobApplication]:
        """
        Get all job applications for a user with pagination
        """
        result = await session.execute(
            select(JobApplication).where(
                JobApplication.user_id == user_id
            ).order_by(JobApplication.created_at.desc()
                       ).offset(skip).limit(limit)
        )
        return result.scalars().all()

    @classmethod
    async def count_by_user(
        cls,
        session: AsyncSession,
        user_id: UUID,
    ) -> int:
        """
        Count total job applications for a user
        """
        result = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id
            )
        )
        return result.scalar_one()

    @classmethod
    async def get_by_status(
        cls,
        session: AsyncSession,
        user_id: UUID,
        status: ApplicationStatus,
    ) -> Sequence[JobApplication]:
        """
        Get job applications by status
        """
        result = await session.execute(
            select(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.application_status == status,
            ).order_by(JobApplication.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def get_by_outcome(
        cls,
        session: AsyncSession,
        user_id: UUID,
        outcome: Outcome,
    ) -> Sequence[JobApplication]:
        """
        Get job applications by outcome
        """
        result = await session.execute(
            select(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.outcome == outcome,
            ).order_by(JobApplication.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def get_pending_followups(
        cls,
        session: AsyncSession,
        user_id: UUID,
    ) -> Sequence[JobApplication]:
        """
        Get applications with followup dates that need attention
        """
        result = await session.execute(
            select(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.followup_date.isnot(None),
                JobApplication.outcome == Outcome.PENDING,
            ).order_by(JobApplication.followup_date.asc())
        )
        return result.scalars().all()

    @classmethod
    async def get_stats(
        cls,
        session: AsyncSession,
        user_id: UUID,
    ) -> dict:
        """
        Get aggregated stats for a user's job applications
        """
        total = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id
            )
        )

        applied = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.application_status ==
                ApplicationStatus.APPLIED,
            )
        )

        interviews = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.interview_rounds > 0,
            )
        )

        offers = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.outcome.in_(
                    [Outcome.OFFER,
                     Outcome.ACCEPTED,
                     Outcome.DECLINED]
                ),
            )
        )

        rejected = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.outcome == Outcome.REJECTED,
            )
        )

        ghosted = await session.execute(
            select(func.count()).select_from(JobApplication).where(
                JobApplication.user_id == user_id,
                JobApplication.outcome == Outcome.GHOSTED,
            )
        )

        return {
            "total": total.scalar_one(),
            "applied": applied.scalar_one(),
            "interviews": interviews.scalar_one(),
            "offers": offers.scalar_one(),
            "rejected": rejected.scalar_one(),
            "ghosted": ghosted.scalar_one(),
        }
