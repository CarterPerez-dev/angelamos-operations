"""
ⒸAngelaMos | 2026
models.py
"""

from datetime import date

import sqlalchemy as sa
from sqlalchemy import (
    String,
    Text,
    Boolean,
    Date,
    Integer,
    ForeignKey,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from core.infrastructure.database.Base import (
    Base,
    UUIDMixin,
    TimestampMixin,
)


TITLE_MAX_LENGTH = 200


class ChecklistItem(Base, UUIDMixin, TimestampMixin):
    """
    A recurring checklist item (template)
    """
    __tablename__ = "checklist_items"
    __table_args__ = (
        sa.Index("idx_checklist_item_active",
                 "is_active"),
        sa.Index("idx_checklist_item_sort",
                 "sort_order"),
    )

    title: Mapped[str] = mapped_column(
        String(TITLE_MAX_LENGTH),
        nullable = False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default = 0,
        nullable = False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default = True,
        nullable = False
    )

    logs: Mapped[list["ChecklistLog"]] = relationship(
        "ChecklistLog",
        back_populates = "item",
        lazy = "selectin"
    )


class ChecklistLog(Base, UUIDMixin, TimestampMixin):
    """
    Per-item per-day completion record
    """
    __tablename__ = "checklist_logs"
    __table_args__ = (
        sa.Index("idx_checklist_log_date",
                 "log_date"),
        sa.Index("idx_checklist_log_item_date",
                 "item_id",
                 "log_date"),
    )

    item_id: Mapped[str] = mapped_column(
        ForeignKey("checklist_items.id",
                   ondelete = "CASCADE"),
        nullable = False,
    )
    log_date: Mapped[date] = mapped_column(Date, nullable = False)
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default = False,
        nullable = False
    )
    note: Mapped[str | None] = mapped_column(Text, nullable = True)

    item: Mapped["ChecklistItem"] = relationship(
        "ChecklistItem",
        back_populates = "logs",
        lazy = "selectin"
    )
