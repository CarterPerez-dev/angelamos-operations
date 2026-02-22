"""
ⒸAngelaMos | 2026
service.py
"""

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ResourceNotFound
from aspects.life_manager.facets.checklist.repository import (
    ChecklistItemRepository,
    ChecklistLogRepository,
)
from aspects.life_manager.facets.checklist.schemas import (
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
    ChecklistItemListResponse,
    ChecklistLogResponse,
    ChecklistDayResponse,
    ChecklistLogUpdate,
    ChecklistStatsResponse,
    HeatmapDay,
    ItemStat,
)
from aspects.life_manager.facets.checklist.models import ChecklistLog


class ChecklistItemNotFound(ResourceNotFound):
    """
    Raised when a checklist item is not found
    """
    def __init__(self, item_id: UUID) -> None:
        super().__init__(
            resource = "ChecklistItem",
            identifier = str(item_id)
        )


class ChecklistLogNotFound(ResourceNotFound):
    """
    Raised when a checklist log entry is not found
    """
    def __init__(self, log_id: UUID) -> None:
        super().__init__(
            resource = "ChecklistLog",
            identifier = str(log_id)
        )


def _to_log_response(log: ChecklistLog) -> ChecklistLogResponse:
    """
    Convert a ChecklistLog ORM instance to ChecklistLogResponse
    """
    return ChecklistLogResponse(
        id = log.id,
        created_at = log.created_at,
        updated_at = log.updated_at,
        item_id = log.item_id,
        log_date = log.log_date,
        completed = log.completed,
        note = log.note,
        item_title = log.item.title,
        item_sort_order = log.item.sort_order,
    )


class ChecklistService:
    """
    Service for checklist operations
    """
    @staticmethod
    async def get_items(
        session: AsyncSession
    ) -> ChecklistItemListResponse:
        """
        Get all active checklist items
        """
        items = await ChecklistItemRepository.get_active(session)
        return ChecklistItemListResponse(
            items = [
                ChecklistItemResponse.model_validate(i) for i in items
            ]
        )

    @staticmethod
    async def create_item(
        session: AsyncSession,
        data: ChecklistItemCreate,
    ) -> ChecklistItemResponse:
        """
        Create a new checklist item
        """
        item = await ChecklistItemRepository.create(
            session,
            title = data.title,
            sort_order = data.sort_order,
        )
        return ChecklistItemResponse.model_validate(item)

    @staticmethod
    async def update_item(
        session: AsyncSession,
        item_id: UUID,
        data: ChecklistItemUpdate,
    ) -> ChecklistItemResponse:
        """
        Update a checklist item
        """
        item = await ChecklistItemRepository.get_by_id(session, item_id)
        if not item:
            raise ChecklistItemNotFound(item_id)

        update_dict = data.model_dump(exclude_unset = True)
        item = await ChecklistItemRepository.update(
            session,
            item,
            **update_dict
        )
        return ChecklistItemResponse.model_validate(item)

    @staticmethod
    async def delete_item(
        session: AsyncSession,
        item_id: UUID,
    ) -> None:
        """
        Soft-delete a checklist item (is_active=False)
        """
        item = await ChecklistItemRepository.get_by_id(session, item_id)
        if not item:
            raise ChecklistItemNotFound(item_id)
        await ChecklistItemRepository.soft_delete(session, item)

    @staticmethod
    async def get_day(
        session: AsyncSession,
        log_date: date,
    ) -> ChecklistDayResponse:
        """
        Get checklist for a day. Auto-inits log rows if first visit.
        """
        existing = await ChecklistLogRepository.get_by_date(
            session,
            log_date
        )
        active_items = await ChecklistItemRepository.get_active(session)

        existing_item_ids = {log.item_id for log in existing}
        new_items = [
            i for i in active_items if i.id not in existing_item_ids
        ]

        for item in new_items:
            await ChecklistLogRepository.create(
                session,
                item_id = item.id,
                log_date = log_date,
                completed = False,
            )

        logs = await ChecklistLogRepository.get_by_date(session, log_date)
        entries = [_to_log_response(log) for log in logs]

        return ChecklistDayResponse(
            date = log_date,
            entries = entries,
            completed_count = sum(1 for e in entries if e.completed),
            total_count = len(entries),
        )

    @staticmethod
    async def update_log(
        session: AsyncSession,
        log_id: UUID,
        data: ChecklistLogUpdate,
    ) -> ChecklistLogResponse:
        """
        Toggle completion and set note on a log entry
        """
        log = await ChecklistLogRepository.get_by_id(session, log_id)
        if not log:
            raise ChecklistLogNotFound(log_id)

        log = await ChecklistLogRepository.update(
            session,
            log,
            completed = data.completed,
            note = data.note,
        )
        return _to_log_response(log)

    @staticmethod
    async def get_stats(session: AsyncSession) -> ChecklistStatsResponse:
        """
        Compute streak, per-item completion rates, and year heatmap
        """
        today = date.today()
        year_start = date(today.year, 1, 1)

        heatmap_rows = await ChecklistLogRepository.get_heatmap_data(
            session,
            year_start,
            today
        )
        heatmap = [
            HeatmapDay(
                date = row.log_date,
                completed_count = int(row.completed_count or 0),
                total_count = int(row.total_count or 0),
            ) for row in heatmap_rows
        ]

        heatmap_by_date = {h.date: h for h in heatmap}
        streak = 0
        check_date = today
        while check_date >= year_start:
            day = heatmap_by_date.get(check_date)
            if day and day.total_count > 0 and day.completed_count == day.total_count:
                streak += 1
                check_date -= timedelta(days = 1)
            else:
                break

        rate_rows = await ChecklistLogRepository.get_item_completion_rates(
            session
        )
        active_items = await ChecklistItemRepository.get_active(session)
        item_map = {i.id: i.title for i in active_items}

        item_stats = [
            ItemStat(
                item_id = row.item_id,
                title = item_map.get(row.item_id,
                                     ""),
                completion_rate = round(
                    (int(row.completed or 0) /
                     int(row.total)) if int(row.total) > 0 else 0.0,
                    4,
                ),
            ) for row in rate_rows if row.item_id in item_map
        ]

        return ChecklistStatsResponse(
            streak = streak,
            item_stats = item_stats,
            heatmap = heatmap,
        )
