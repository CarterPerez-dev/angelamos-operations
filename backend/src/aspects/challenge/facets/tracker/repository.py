"""
ⒸAngelaMos | 2025
repository.py
"""

from collections.abc import Sequence
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from aspects.challenge.facets.tracker.models import Challenge, ChallengeLog


class ChallengeRepository:
    """
    Repository for Challenge operations
    """

    @classmethod
    async def get_active(
        cls,
        session: AsyncSession,
    ) -> Challenge | None:
        """
        Get the currently active challenge
        """
        result = await session.execute(
            select(Challenge)
            .where(Challenge.is_active == True)
            .options(selectinload(Challenge.logs))
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_id(
        cls,
        session: AsyncSession,
        challenge_id: UUID,
    ) -> Challenge | None:
        """
        Get challenge by ID
        """
        return await session.get(Challenge, challenge_id)

    @classmethod
    async def get_history(
        cls,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 10,
    ) -> Sequence[Challenge]:
        """
        Get past challenges (inactive)
        """
        result = await session.execute(
            select(Challenge)
            .where(Challenge.is_active == False)
            .order_by(Challenge.start_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @classmethod
    async def count_history(
        cls,
        session: AsyncSession,
    ) -> int:
        """
        Count past challenges
        """
        result = await session.execute(
            select(func.count())
            .select_from(Challenge)
            .where(Challenge.is_active == False)
        )
        return result.scalar_one()

    @classmethod
    async def deactivate_all(
        cls,
        session: AsyncSession,
    ) -> None:
        """
        Deactivate all active challenges
        """
        await session.execute(
            update(Challenge)
            .where(Challenge.is_active == True)
            .values(is_active = False)
        )
        await session.flush()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        start_date: date,
        content_goal: int = 1500,
        jobs_goal: int = 1000,
    ) -> Challenge:
        """
        Create a new challenge
        """
        end_date = start_date + timedelta(days = 29)
        challenge = Challenge(
            start_date = start_date,
            end_date = end_date,
            content_goal = content_goal,
            jobs_goal = jobs_goal,
            is_active = True,
        )
        session.add(challenge)
        await session.flush()
        await session.refresh(challenge)
        return challenge


class ChallengeLogRepository:
    """
    Repository for ChallengeLog operations
    """

    @classmethod
    async def get_by_challenge(
        cls,
        session: AsyncSession,
        challenge_id: UUID,
    ) -> Sequence[ChallengeLog]:
        """
        Get all logs for a challenge
        """
        result = await session.execute(
            select(ChallengeLog)
            .where(ChallengeLog.challenge_id == challenge_id)
            .order_by(ChallengeLog.log_date.asc())
        )
        return result.scalars().all()

    @classmethod
    async def get_by_date(
        cls,
        session: AsyncSession,
        challenge_id: UUID,
        log_date: date,
    ) -> ChallengeLog | None:
        """
        Get log for a specific date
        """
        result = await session.execute(
            select(ChallengeLog)
            .where(
                ChallengeLog.challenge_id == challenge_id,
                ChallengeLog.log_date == log_date,
            )
        )
        return result.scalar_one_or_none()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        challenge_id: UUID,
        log_date: date,
        **kwargs,
    ) -> ChallengeLog:
        """
        Create a new log entry
        """
        log = ChallengeLog(
            challenge_id = challenge_id,
            log_date = log_date,
            **kwargs,
        )
        session.add(log)
        await session.flush()
        await session.refresh(log)
        return log

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        log: ChallengeLog,
        **kwargs,
    ) -> ChallengeLog:
        """
        Update an existing log
        """
        for key, value in kwargs.items():
            if value is not None:
                setattr(log, key, value)
        await session.flush()
        await session.refresh(log)
        return log

    @classmethod
    async def get_totals(
        cls,
        session: AsyncSession,
        challenge_id: UUID,
    ) -> tuple[int, int]:
        """
        Get total content and jobs for a challenge
        """
        result = await session.execute(
            select(
                func.coalesce(func.sum(
                    ChallengeLog.tiktok +
                    ChallengeLog.instagram_reels +
                    ChallengeLog.youtube_shorts +
                    ChallengeLog.twitter +
                    ChallengeLog.reddit +
                    ChallengeLog.linkedin_personal +
                    ChallengeLog.linkedin_company +
                    ChallengeLog.youtube_full +
                    ChallengeLog.medium
                ), 0).label('total_content'),
                func.coalesce(func.sum(ChallengeLog.jobs_applied), 0).label('total_jobs'),
            )
            .where(ChallengeLog.challenge_id == challenge_id)
        )
        row = result.one()
        return int(row.total_content), int(row.total_jobs)
