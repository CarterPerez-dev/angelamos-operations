"""
ⒸAngelaMos | 2026
routes.py
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Query, status

from core.security.auth.dependencies import DBSession
from core.foundation.responses import NOT_FOUND_404
from aspects.life_manager.facets.checklist.schemas import (
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
    ChecklistItemListResponse,
    ChecklistDayResponse,
    ChecklistLogResponse,
    ChecklistLogUpdate,
    ChecklistStatsResponse,
)
from aspects.life_manager.facets.checklist.service import ChecklistService


router = APIRouter(prefix = "/checklist", tags = ["Life Checklist"])


@router.get(
    "/items",
    response_model = ChecklistItemListResponse,
)
async def get_items(db: DBSession) -> ChecklistItemListResponse:
    """
    Get all active checklist items
    """
    return await ChecklistService.get_items(db)


@router.post(
    "/items",
    response_model = ChecklistItemResponse,
    status_code = status.HTTP_201_CREATED,
)
async def create_item(
    db: DBSession,
    data: ChecklistItemCreate,
) -> ChecklistItemResponse:
    """
    Create a checklist item
    """
    return await ChecklistService.create_item(db, data)


@router.put(
    "/items/{item_id}",
    response_model = ChecklistItemResponse,
    responses = {**NOT_FOUND_404},
)
async def update_item(
    db: DBSession,
    item_id: UUID,
    data: ChecklistItemUpdate,
) -> ChecklistItemResponse:
    """
    Update a checklist item
    """
    return await ChecklistService.update_item(db, item_id, data)


@router.delete(
    "/items/{item_id}",
    status_code = status.HTTP_204_NO_CONTENT,
    responses = {**NOT_FOUND_404},
)
async def delete_item(
    db: DBSession,
    item_id: UUID,
) -> None:
    """
    Soft-delete a checklist item
    """
    await ChecklistService.delete_item(db, item_id)


@router.get(
    "/log",
    response_model = ChecklistDayResponse,
)
async def get_day(
    db: DBSession,
    log_date: date = Query(default_factory = date.today),
) -> ChecklistDayResponse:
    """
    Get checklist for a day (auto-inits if first visit)
    """
    return await ChecklistService.get_day(db, log_date)


@router.patch(
    "/log/{log_id}",
    response_model = ChecklistLogResponse,
    responses = {**NOT_FOUND_404},
)
async def update_log(
    db: DBSession,
    log_id: UUID,
    data: ChecklistLogUpdate,
) -> ChecklistLogResponse:
    """
    Toggle completion and set note on a log entry
    """
    return await ChecklistService.update_log(db, log_id, data)


@router.get(
    "/stats",
    response_model = ChecklistStatsResponse,
)
async def get_stats(db: DBSession) -> ChecklistStatsResponse:
    """
    Get streak, per-item completion rates, and year heatmap
    """
    return await ChecklistService.get_stats(db)
