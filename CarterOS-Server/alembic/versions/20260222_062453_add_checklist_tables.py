"""add_checklist_tables

Revision ID: a5ff6f89b3f0
Revises: 20260131_tiktok_videos
Create Date: 2026-02-22 06:24:53.793111
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a5ff6f89b3f0'
down_revision: Union[str, None] = '20260131_tiktok_videos'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('checklist_items',
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_checklist_items'))
    )
    op.create_index('idx_checklist_item_active', 'checklist_items', ['is_active'], unique=False)
    op.create_index('idx_checklist_item_sort', 'checklist_items', ['sort_order'], unique=False)
    op.create_table('checklist_logs',
    sa.Column('item_id', sa.Uuid(), nullable=False),
    sa.Column('log_date', sa.Date(), nullable=False),
    sa.Column('completed', sa.Boolean(), nullable=False),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['checklist_items.id'], name=op.f('fk_checklist_logs_item_id_checklist_items'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_checklist_logs'))
    )
    op.create_index('idx_checklist_log_date', 'checklist_logs', ['log_date'], unique=False)
    op.create_index('idx_checklist_log_item_date', 'checklist_logs', ['item_id', 'log_date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_checklist_log_item_date', table_name='checklist_logs')
    op.drop_index('idx_checklist_log_date', table_name='checklist_logs')
    op.drop_table('checklist_logs')
    op.drop_index('idx_checklist_item_sort', table_name='checklist_items')
    op.drop_index('idx_checklist_item_active', table_name='checklist_items')
    op.drop_table('checklist_items')
