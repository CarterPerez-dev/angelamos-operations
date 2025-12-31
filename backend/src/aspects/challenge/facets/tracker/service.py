"""
ⒸAngelaMos | 2025
service.py
"""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.exceptions import ResourceNotFound, ValidationError
from aspects.challenge.facets.tracker.models import Challenge
from aspects.challenge.facets.tracker.repository import (
    ChallengeRepository,
    ChallengeLogRepository,
)
from aspects.challenge.facets.tracker.schemas import (
    ChallengeStart,
    ChallengeWithStats,
    ChallengeHistoryResponse,
    ChallengeResponse,
    LogCreate,
    LogUpdate,
    LogResponse,
)


class ChallengeNotFound(ResourceNotFound):
    """
    Raised when no active challenge exists
    """
    def __init__(self) -> None:
        super().__init__(
            resource = "Challenge",
            identifier = "active",
        )


class LogNotFound(ResourceNotFound):
    """
    Raised when a log entry is not found
    """
    def __init__(self, log_date: date) -> None:
        super().__init__(
            resource = "ChallengeLog",
            identifier = str(log_date),
        )


class ChallengeService:
    """
    Business logic for challenge operations
    """

    @staticmethod
    def _calculate_day_number(challenge: Challenge, log_date: date) -> int:
        """
        Calculate the day number (1-30) for a given date
        """
        delta = log_date - challenge.start_date
        return delta.days + 1

    @staticmethod
    def _calculate_current_day(challenge: Challenge) -> int:
        """
        Calculate the current day number based on today's date
        """
        today = date.today()
        if today < challenge.start_date:
            return 0
        if today > challenge.end_date:
            return 30
        delta = today - challenge.start_date
        return delta.days + 1

    @staticmethod
    async def get_active_challenge(
        session: AsyncSession,
    ) -> ChallengeWithStats:
        """
        Get active challenge with stats and logs
        """
        challenge = await ChallengeRepository.get_active(session)
        if not challenge:
            raise ChallengeNotFound()

        total_content, total_jobs = await ChallengeLogRepository.get_totals(
            session,
            challenge.id,
        )

        logs_response = [
            LogResponse(
                id = log.id,
                challenge_id = log.challenge_id,
                log_date = log.log_date,
                day_number = ChallengeService._calculate_day_number(challenge, log.log_date),
                tiktok = log.tiktok,
                instagram_reels = log.instagram_reels,
                youtube_shorts = log.youtube_shorts,
                twitter = log.twitter,
                reddit = log.reddit,
                linkedin_personal = log.linkedin_personal,
                linkedin_company = log.linkedin_company,
                youtube_full = log.youtube_full,
                medium = log.medium,
                jobs_applied = log.jobs_applied,
                created_at = log.created_at,
                updated_at = log.updated_at,
            )
            for log in challenge.logs
        ]

        return ChallengeWithStats(
            id = challenge.id,
            name = challenge.name,
            start_date = challenge.start_date,
            end_date = challenge.end_date,
            is_active = challenge.is_active,
            content_goal = challenge.content_goal,
            jobs_goal = challenge.jobs_goal,
            total_content = total_content,
            total_jobs = total_jobs,
            current_day = ChallengeService._calculate_current_day(challenge),
            logs = logs_response,
            created_at = challenge.created_at,
            updated_at = challenge.updated_at,
        )

    @staticmethod
    async def start_challenge(
        session: AsyncSession,
        data: ChallengeStart,
    ) -> ChallengeWithStats:
        """
        Start a new challenge (deactivates previous)
        """
        await ChallengeRepository.deactivate_all(session)

        challenge = await ChallengeRepository.create(
            session,
            start_date = data.start_date,
            content_goal = data.content_goal,
            jobs_goal = data.jobs_goal,
        )

        return ChallengeWithStats(
            id = challenge.id,
            name = challenge.name,
            start_date = challenge.start_date,
            end_date = challenge.end_date,
            is_active = challenge.is_active,
            content_goal = challenge.content_goal,
            jobs_goal = challenge.jobs_goal,
            total_content = 0,
            total_jobs = 0,
            current_day = ChallengeService._calculate_current_day(challenge),
            logs = [],
            created_at = challenge.created_at,
            updated_at = challenge.updated_at,
        )

    @staticmethod
    async def get_history(
        session: AsyncSession,
        page: int = 1,
        size: int = 10,
    ) -> ChallengeHistoryResponse:
        """
        Get past challenges
        """
        skip = (page - 1) * size
        challenges = await ChallengeRepository.get_history(session, skip, size)
        total = await ChallengeRepository.count_history(session)

        return ChallengeHistoryResponse(
            items = [ChallengeResponse.model_validate(c) for c in challenges],
            total = total,
        )

    @staticmethod
    async def create_or_update_log(
        session: AsyncSession,
        data: LogCreate,
    ) -> LogResponse:
        """
        Create a log entry or update if exists
        """
        challenge = await ChallengeRepository.get_active(session)
        if not challenge:
            raise ChallengeNotFound()

        if data.log_date < challenge.start_date or data.log_date > challenge.end_date:
            raise ValidationError(
                message = f"Log date must be between {challenge.start_date} and {challenge.end_date}",
                field = "log_date",
            )

        existing = await ChallengeLogRepository.get_by_date(
            session,
            challenge.id,
            data.log_date,
        )

        if existing:
            log = await ChallengeLogRepository.update(
                session,
                existing,
                tiktok = data.tiktok,
                instagram_reels = data.instagram_reels,
                youtube_shorts = data.youtube_shorts,
                twitter = data.twitter,
                reddit = data.reddit,
                linkedin_personal = data.linkedin_personal,
                linkedin_company = data.linkedin_company,
                youtube_full = data.youtube_full,
                medium = data.medium,
                jobs_applied = data.jobs_applied,
            )
        else:
            log = await ChallengeLogRepository.create(
                session,
                challenge_id = challenge.id,
                log_date = data.log_date,
                tiktok = data.tiktok,
                instagram_reels = data.instagram_reels,
                youtube_shorts = data.youtube_shorts,
                twitter = data.twitter,
                reddit = data.reddit,
                linkedin_personal = data.linkedin_personal,
                linkedin_company = data.linkedin_company,
                youtube_full = data.youtube_full,
                medium = data.medium,
                jobs_applied = data.jobs_applied,
            )

        return LogResponse(
            id = log.id,
            challenge_id = log.challenge_id,
            log_date = log.log_date,
            day_number = ChallengeService._calculate_day_number(challenge, log.log_date),
            tiktok = log.tiktok,
            instagram_reels = log.instagram_reels,
            youtube_shorts = log.youtube_shorts,
            twitter = log.twitter,
            reddit = log.reddit,
            linkedin_personal = log.linkedin_personal,
            linkedin_company = log.linkedin_company,
            youtube_full = log.youtube_full,
            medium = log.medium,
            jobs_applied = log.jobs_applied,
            created_at = log.created_at,
            updated_at = log.updated_at,
        )

    @staticmethod
    async def get_log_by_date(
        session: AsyncSession,
        log_date: date,
    ) -> LogResponse:
        """
        Get a specific log by date
        """
        challenge = await ChallengeRepository.get_active(session)
        if not challenge:
            raise ChallengeNotFound()

        log = await ChallengeLogRepository.get_by_date(
            session,
            challenge.id,
            log_date,
        )
        if not log:
            raise LogNotFound(log_date)

        return LogResponse(
            id = log.id,
            challenge_id = log.challenge_id,
            log_date = log.log_date,
            day_number = ChallengeService._calculate_day_number(challenge, log.log_date),
            tiktok = log.tiktok,
            instagram_reels = log.instagram_reels,
            youtube_shorts = log.youtube_shorts,
            twitter = log.twitter,
            reddit = log.reddit,
            linkedin_personal = log.linkedin_personal,
            linkedin_company = log.linkedin_company,
            youtube_full = log.youtube_full,
            medium = log.medium,
            jobs_applied = log.jobs_applied,
            created_at = log.created_at,
            updated_at = log.updated_at,
        )

    @staticmethod
    async def update_log(
        session: AsyncSession,
        log_date: date,
        data: LogUpdate,
    ) -> LogResponse:
        """
        Update a log by date
        """
        challenge = await ChallengeRepository.get_active(session)
        if not challenge:
            raise ChallengeNotFound()

        log = await ChallengeLogRepository.get_by_date(
            session,
            challenge.id,
            log_date,
        )
        if not log:
            raise LogNotFound(log_date)

        update_dict = data.model_dump(exclude_unset = True)
        log = await ChallengeLogRepository.update(session, log, **update_dict)

        return LogResponse(
            id = log.id,
            challenge_id = log.challenge_id,
            log_date = log.log_date,
            day_number = ChallengeService._calculate_day_number(challenge, log.log_date),
            tiktok = log.tiktok,
            instagram_reels = log.instagram_reels,
            youtube_shorts = log.youtube_shorts,
            twitter = log.twitter,
            reddit = log.reddit,
            linkedin_personal = log.linkedin_personal,
            linkedin_company = log.linkedin_company,
            youtube_full = log.youtube_full,
            medium = log.medium,
            jobs_applied = log.jobs_applied,
            created_at = log.created_at,
            updated_at = log.updated_at,
        )
