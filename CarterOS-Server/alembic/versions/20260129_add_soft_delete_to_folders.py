"""
add soft delete to folders

Revision ID: 20260129_folders_soft_delete
Revises: 20260128_notes_soft_delete
Create Date: 2026-01-29

"""
from alembic import op
import sqlalchemy as sa


revision = '20260129_folders_soft_delete'
down_revision = '20260128_notes_soft_delete'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "note_folders",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index("idx_folders_deleted_at", "note_folders", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("idx_folders_deleted_at", "note_folders")
    op.drop_column("note_folders", "deleted_at")
