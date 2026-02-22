"""
ⒸAngelaMos | 2026
service.py
"""

from datetime import date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ResourceNotFound
from aspects.life_manager.facets.planner.repository import TimeBlockRepository
from aspects.life_manager.facets.planner.schemas import (
    TimeBlockCreate,
    TimeBlockUpdate,
    TimeBlockResponse,
    TimeBlockListResponse,
)


class TimeBlockNotFound(ResourceNotFound):
    """
    Raised when time block not found
    """
    def __init__(self, block_id: UUID) -> None:
        super().__init__(
            resource = "TimeBlock",
            identifier = str(block_id)
        )


class PlannerService:
    """
    Service for planner operations
    """
    @staticmethod
    async def get_blocks_by_date(
        session: AsyncSession,
        block_date: date,
    ) -> TimeBlockListResponse:
        """
        Get all time blocks for a date
        """
        blocks = await TimeBlockRepository.get_by_date(session, block_date)
        return TimeBlockListResponse(
            items = [TimeBlockResponse.model_validate(b) for b in blocks],
            date = block_date,
        )

    @staticmethod
    async def create_block(
        session: AsyncSession,
        data: TimeBlockCreate,
    ) -> TimeBlockResponse:
        """
        Create a time block
        """
        block = await TimeBlockRepository.create(
            session,
            block_date = data.block_date,
            start_time = data.start_time,
            end_time = data.end_time,
            title = data.title,
            description = data.description,
            color = data.color,
            sort_order = data.sort_order,
        )
        return TimeBlockResponse.model_validate(block)

    @staticmethod
    async def update_block(
        session: AsyncSession,
        block_id: UUID,
        data: TimeBlockUpdate,
    ) -> TimeBlockResponse:
        """
        Update a time block
        """
        block = await TimeBlockRepository.get_by_id(session, block_id)
        if not block:
            raise TimeBlockNotFound(block_id)

        update_dict = data.model_dump(exclude_unset = True)
        block = await TimeBlockRepository.update(
            session,
            block,
            **update_dict
        )
        return TimeBlockResponse.model_validate(block)

    @staticmethod
    async def delete_block(
        session: AsyncSession,
        block_id: UUID,
    ) -> None:
        """
        Delete a time block
        """
        block = await TimeBlockRepository.get_by_id(session, block_id)
        if not block:
            raise TimeBlockNotFound(block_id)
        await TimeBlockRepository.delete(session, block)
