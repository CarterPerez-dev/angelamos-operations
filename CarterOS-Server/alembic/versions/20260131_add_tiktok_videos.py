"""
ⒸAngelaMos | 2026
add_tiktok_videos
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260131_tiktok_videos'
down_revision = '20260129_folders_soft_delete'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tiktok_videos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('date_posted', sa.Date(), nullable=False),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('views', sa.Integer(), nullable=False),
        sa.Column('comments', sa.Integer(), nullable=False),
        sa.Column('likes', sa.Integer(), nullable=False),
        sa.Column('bookmarks', sa.Integer(), nullable=False),
        sa.Column('shares', sa.Integer(), nullable=False),
        sa.Column('avg_watch_time', sa.Float(), nullable=False),
        sa.Column('new_followers', sa.Integer(), nullable=False),
        sa.Column('watched_full_video_percentage', sa.Float(), nullable=False),
        sa.Column('top_comment_words', postgresql.JSONB(), nullable=True),
        sa.Column('search_queries', postgresql.JSONB(), nullable=True),
        sa.Column('traffic_sources', postgresql.JSONB(), nullable=True),
        sa.Column('hook', sa.Text(), nullable=False),
        sa.Column('text_on_screen_hook', sa.Text(), nullable=True),
        sa.Column('length', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('hashtags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('cta', sa.Text(), nullable=True),
        sa.Column('full_transcription', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tiktok_videos'))
    )
    op.create_index('idx_tiktok_videos_rank', 'tiktok_videos', ['rank'])
    op.create_index('idx_tiktok_videos_date', 'tiktok_videos', ['date_posted'])
    op.create_index('idx_tiktok_videos_views', 'tiktok_videos', ['views'])


def downgrade() -> None:
    op.drop_index('idx_tiktok_videos_views', table_name='tiktok_videos')
    op.drop_index('idx_tiktok_videos_date', table_name='tiktok_videos')
    op.drop_index('idx_tiktok_videos_rank', table_name='tiktok_videos')
    op.drop_table('tiktok_videos')
