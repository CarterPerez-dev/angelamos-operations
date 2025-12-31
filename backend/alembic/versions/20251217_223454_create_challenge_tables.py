"""create_challenge_tables

Revision ID: c9d5e0f8a3b2
Revises: b8c4d9e7f2a1
Create Date: 2025-12-17 22:34:54.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9d5e0f8a3b2'
down_revision: Union[str, None] = 'b8c4d9e7f2a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'challenges',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('content_goal', sa.Integer(), nullable=False),
        sa.Column('jobs_goal', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_challenges'))
    )
    op.create_index('idx_challenge_active', 'challenges', ['is_active'], unique=False)
    op.create_index('idx_challenge_start', 'challenges', [sa.text('start_date DESC')], unique=False)

    op.create_table(
        'challenge_logs',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('challenge_id', sa.Uuid(), nullable=False),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('tiktok', sa.Integer(), nullable=False),
        sa.Column('instagram_reels', sa.Integer(), nullable=False),
        sa.Column('youtube_shorts', sa.Integer(), nullable=False),
        sa.Column('twitter', sa.Integer(), nullable=False),
        sa.Column('reddit', sa.Integer(), nullable=False),
        sa.Column('linkedin_personal', sa.Integer(), nullable=False),
        sa.Column('linkedin_company', sa.Integer(), nullable=False),
        sa.Column('youtube_full', sa.Integer(), nullable=False),
        sa.Column('medium', sa.Integer(), nullable=False),
        sa.Column('jobs_applied', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], name=op.f('fk_challenge_logs_challenge_id_challenges'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_challenge_logs')),
        sa.UniqueConstraint('challenge_id', 'log_date', name='uq_challenge_log_date')
    )
    op.create_index('idx_log_challenge', 'challenge_logs', ['challenge_id'], unique=False)
    op.create_index('idx_log_date', 'challenge_logs', ['log_date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_log_date', table_name='challenge_logs')
    op.drop_index('idx_log_challenge', table_name='challenge_logs')
    op.drop_table('challenge_logs')
    op.drop_index('idx_challenge_start', table_name='challenges')
    op.drop_index('idx_challenge_active', table_name='challenges')
    op.drop_table('challenges')
