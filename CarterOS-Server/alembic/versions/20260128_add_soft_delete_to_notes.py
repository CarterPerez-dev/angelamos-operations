"""add soft delete to notes

Revision ID: 20260128_notes_soft_delete
Revises: 1348b14f44a4
Create Date: 2026-01-28 17:45:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '20260128_notes_soft_delete'
down_revision: Union[str, None] = '1348b14f44a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notes",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index("idx_notes_deleted_at", "notes", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("idx_notes_deleted_at", table_name="notes")
    op.drop_column("notes", "deleted_at")
