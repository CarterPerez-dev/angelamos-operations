"""
ⒸAngelaMos | 2026
models.py
"""

from datetime import date, time

import sqlalchemy as sa
from sqlalchemy import String, Text, Date, Time, Integer
from sqlalchemy.orm import Mapped, mapped_column

from core.infrastructure.database.Base import Base, UUIDMixin, TimestampMixin


TITLE_MAX_LENGTH = 200


class TimeBlock(Base, UUIDMixin, TimestampMixin):
    """
    A time block for daily planning
    """
    __tablename__ = "time_blocks"
    __table_args__ = (
        sa.Index("idx_timeblock_date", "block_date"),
    )

    block_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
