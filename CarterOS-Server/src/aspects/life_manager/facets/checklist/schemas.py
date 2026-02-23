"""
ⒸAngelaMos | 2026
schemas.py
"""

from uuid import UUID
from datetime import date

from pydantic import Field

from core.foundation.schemas.base import (
    BaseSchema,
    BaseResponseSchema,
)


class ChecklistItemCreate(BaseSchema):
    """
    Schema for creating a checklist item
    """
    title: str = Field(max_length = 200)
    sort_order: int = 0


class ChecklistItemUpdate(BaseSchema):
    """
    Schema for updating a checklist item
    """
    title: str | None = Field(default = None, max_length = 200)
    sort_order: int | None = None


class ChecklistItemResponse(BaseResponseSchema):
    """
    Schema for checklist item response
    """
    title: str
    sort_order: int
    is_active: bool


class ChecklistItemListResponse(BaseSchema):
    """
    Schema for list of checklist items
    """
    items: list[ChecklistItemResponse]


class ChecklistLogResponse(BaseResponseSchema):
    """
    Schema for a single log entry
    (item + completion state for a day)
    """
    item_id: UUID
    log_date: date
    completed: bool
    note: str | None
    item_title: str
    item_sort_order: int


class ChecklistDayResponse(BaseSchema):
    """
    Schema for a full day's checklist
    """
    date: date
    entries: list[ChecklistLogResponse]
    completed_count: int
    total_count: int


class ChecklistLogUpdate(BaseSchema):
    """
    Schema for updating a log entry (toggle + note)
    """
    completed: bool
    note: str | None = None


class HeatmapDay(BaseSchema):
    """
    Schema for a single day in the heatmap
    """
    date: date
    completed_count: int
    total_count: int


class ItemStat(BaseSchema):
    """
    Schema for per item completion stat
    """
    item_id: UUID
    title: str
    completion_rate: float


class ChecklistStatsResponse(BaseSchema):
    """
    Schema for stats response
    """
    streak: int
    item_stats: list[ItemStat]
    heatmap: list[HeatmapDay]
