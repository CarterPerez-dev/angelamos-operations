"""
ⒸAngelaMos | 2026
routes.py
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query, status

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
from aspects.life_manager.facets.planner.schemas import (
    TimeBlockCreate,
    TimeBlockUpdate,
    TimeBlockResponse,
    TimeBlockListResponse,
)
from aspects.life_manager.facets.planner.service import PlannerService


router = APIRouter(prefix = "/planner", tags = ["Life Planner"])


@router.get(
    "/blocks",
    response_model = TimeBlockListResponse,
)
async def get_time_blocks(
    db: DBSession,
    block_date: date = Query(default_factory = date.today),
) -> TimeBlockListResponse:
    """
    Get all time blocks for a date
    """
    return await PlannerService.get_blocks_by_date(db, block_date)


@router.post(
    "/blocks",
    response_model = TimeBlockResponse,
    status_code = status.HTTP_201_CREATED,
)
async def create_time_block(
    db: DBSession,
    data: TimeBlockCreate,
) -> TimeBlockResponse:
    """
    Create a time block
    """
    return await PlannerService.create_block(db, data)


@router.put(
    "/blocks/{block_id}",
    response_model = TimeBlockResponse,
    responses = {**NOT_FOUND_404},
)
async def update_time_block(
    db: DBSession,
    block_id: UUID,
    data: TimeBlockUpdate,
) -> TimeBlockResponse:
    """
    Update a time block
    """
    return await PlannerService.update_block(db, block_id, data)


@router.delete(
    "/blocks/{block_id}",
    status_code = status.HTTP_204_NO_CONTENT,
    responses = {**NOT_FOUND_404},
)
async def delete_time_block(
    db: DBSession,
    block_id: UUID,
) -> None:
    """
    Delete a time block
    """
    await PlannerService.delete_block(db, block_id)
