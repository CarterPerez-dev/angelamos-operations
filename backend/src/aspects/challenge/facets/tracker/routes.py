"""
ⒸAngelaMos | 2025
routes.py
"""

from datetime import date

from fastapi import (
    APIRouter,
    Query,
    status,
)

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
from aspects.challenge.facets.tracker.schemas import (
    ChallengeStart,
    ChallengeWithStats,
    ChallengeHistoryResponse,
    LogCreate,
    LogUpdate,
    LogResponse,
)
from aspects.challenge.facets.tracker.service import ChallengeService


router = APIRouter(prefix = "/challenge", tags = ["Challenge Tracker"])


@router.get(
    "/active",
    response_model = ChallengeWithStats,
    responses = {**NOT_FOUND_404},
)
async def get_active_challenge(
    db: DBSession,
) -> ChallengeWithStats:
    """
    Get the currently active challenge with stats and all logs
    """
    return await ChallengeService.get_active_challenge(db)


@router.post(
    "/start",
    response_model = ChallengeWithStats,
    status_code = status.HTTP_201_CREATED,
)
async def start_challenge(
    db: DBSession,
    data: ChallengeStart = ChallengeStart(),
) -> ChallengeWithStats:
    """
    Start a new challenge (deactivates any existing active challenge)
    """
    return await ChallengeService.start_challenge(db, data)


@router.get(
    "/history",
    response_model = ChallengeHistoryResponse,
)
async def get_challenge_history(
    db: DBSession,
    page: int = Query(default = 1, ge = 1),
    size: int = Query(default = 10, ge = 1, le = 50),
) -> ChallengeHistoryResponse:
    """
    Get past (inactive) challenges
    """
    return await ChallengeService.get_history(db, page, size)


@router.post(
    "/logs",
    response_model = LogResponse,
    status_code = status.HTTP_201_CREATED,
    responses = {**NOT_FOUND_404},
)
async def create_log(
    db: DBSession,
    data: LogCreate,
) -> LogResponse:
    """
    Create or update a daily log entry for the active challenge
    """
    return await ChallengeService.create_or_update_log(db, data)


@router.get(
    "/logs/{log_date}",
    response_model = LogResponse,
    responses = {**NOT_FOUND_404},
)
async def get_log(
    db: DBSession,
    log_date: date,
) -> LogResponse:
    """
    Get a specific log entry by date
    """
    return await ChallengeService.get_log_by_date(db, log_date)


@router.put(
    "/logs/{log_date}",
    response_model = LogResponse,
    responses = {**NOT_FOUND_404},
)
async def update_log(
    db: DBSession,
    log_date: date,
    data: LogUpdate,
) -> LogResponse:
    """
    Update a log entry by date
    """
    return await ChallengeService.update_log(db, log_date, data)
