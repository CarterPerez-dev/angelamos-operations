"""add_scheduling_tables

Revision ID: b8c4d9e7f2a1
Revises: aa1123bcf1ae
Create Date: 2025-12-17 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b8c4d9e7f2a1'
down_revision: Union[str, None] = 'aa1123bcf1ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE schedulestatus AS ENUM (
                'draft', 'pending_sync', 'scheduled', 'publishing',
                'published', 'failed', 'cancelled'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE latepoststatus AS ENUM (
                'pending', 'processing', 'published', 'failed', 'partial'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE mediatype AS ENUM (
                'image', 'video', 'gif', 'document', 'thumbnail'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE schedulemode AS ENUM (
                'single_platform', 'multi_platform'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE contentlibrarytype AS ENUM (
                'video_script', 'text_post', 'thread', 'carousel', 'story', 'reel'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("ALTER TYPE platformtype ADD VALUE IF NOT EXISTS 'facebook';")
    op.execute("ALTER TYPE platformtype ADD VALUE IF NOT EXISTS 'pinterest';")
    op.execute("ALTER TYPE platformtype ADD VALUE IF NOT EXISTS 'bluesky';")
    op.execute("ALTER TYPE platformtype ADD VALUE IF NOT EXISTS 'threads';")
    op.execute("ALTER TYPE platformtype ADD VALUE IF NOT EXISTS 'google_business';")

    op.create_table(
        'connected_accounts',
        sa.Column('late_account_id', sa.String(length=64), nullable=False),
        sa.Column('late_profile_id', sa.String(length=64), nullable=False),
        sa.Column(
            'platform',
            sa.Enum(
                'tiktok', 'youtube', 'instagram', 'reddit', 'linkedin',
                'twitter', 'facebook', 'pinterest', 'bluesky', 'threads',
                'google_business',
                name='platformtype',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('platform_username', sa.String(length=100), nullable=False),
        sa.Column('platform_display_name', sa.String(length=100), nullable=True),
        sa.Column('profile_image_url', sa.String(length=2048), nullable=True),
        sa.Column('followers_count', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('connected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'platform_metadata',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_connected_accounts')),
        sa.UniqueConstraint(
            'late_account_id',
            name='uq_connected_late_account_id',
        ),
    )
    op.create_index(
        'idx_connected_platform',
        'connected_accounts',
        ['platform'],
        unique=False,
    )
    op.create_index(
        'idx_connected_late_id',
        'connected_accounts',
        ['late_account_id'],
        unique=False,
    )
    op.create_index(
        'idx_connected_active',
        'connected_accounts',
        ['is_active'],
        unique=False,
    )

    op.create_table(
        'content_library_items',
        sa.Column('title', sa.String(length=300), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column(
            'content_type',
            sa.Enum(
                'video_script', 'text_post', 'thread', 'carousel', 'story', 'reel',
                name='contentlibrarytype',
            ),
            nullable=False,
        ),
        sa.Column(
            'target_platform',
            sa.Enum(
                'tiktok', 'youtube', 'instagram', 'reddit', 'linkedin',
                'twitter', 'facebook', 'pinterest', 'bluesky', 'threads',
                'google_business',
                name='platformtype',
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column(
            'hashtags',
            postgresql.ARRAY(sa.String(length=50)),
            nullable=False,
            server_default='{}',
        ),
        sa.Column(
            'mentions',
            postgresql.ARRAY(sa.String(length=100)),
            nullable=False,
            server_default='{}',
        ),
        sa.Column(
            'tags',
            postgresql.ARRAY(sa.String(length=50)),
            nullable=False,
            server_default='{}',
        ),
        sa.Column('workflow_session_id', sa.Uuid(), nullable=True),
        sa.Column(
            'platform_specific_data',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, default=False),
        sa.ForeignKeyConstraint(
            ['workflow_session_id'],
            ['workflow_sessions.id'],
            name=op.f('fk_content_library_items_workflow_session_id_workflow_sessions'),
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_content_library_items')),
    )
    op.create_index(
        'idx_library_type',
        'content_library_items',
        ['content_type'],
        unique=False,
    )
    op.create_index(
        'idx_library_platform',
        'content_library_items',
        ['target_platform'],
        unique=False,
    )
    op.create_index(
        'idx_library_deleted',
        'content_library_items',
        ['is_deleted'],
        unique=False,
    )
    op.create_index(
        'idx_library_created',
        'content_library_items',
        ['created_at'],
        unique=False,
        postgresql_ops={'created_at': 'DESC'},
    )
    op.create_index(
        'idx_library_tags',
        'content_library_items',
        ['tags'],
        unique=False,
        postgresql_using='gin',
    )

    op.create_table(
        'media_attachments',
        sa.Column('content_library_item_id', sa.Uuid(), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column(
            'media_type',
            sa.Enum('image', 'video', 'gif', 'document', 'thumbnail', name='mediatype'),
            nullable=False,
        ),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('thumbnail_path', sa.String(length=500), nullable=True),
        sa.Column('alt_text', sa.String(length=500), nullable=True),
        sa.Column('late_media_id', sa.String(length=64), nullable=True),
        sa.Column('late_media_url', sa.String(length=2048), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, default=0),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['content_library_item_id'],
            ['content_library_items.id'],
            name=op.f('fk_media_attachments_content_library_item_id_content_library_items'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_media_attachments')),
    )
    op.create_index(
        'idx_media_content',
        'media_attachments',
        ['content_library_item_id'],
        unique=False,
    )
    op.create_index(
        'idx_media_type',
        'media_attachments',
        ['media_type'],
        unique=False,
    )
    op.create_index(
        'idx_media_late_id',
        'media_attachments',
        ['late_media_id'],
        unique=False,
    )

    op.create_table(
        'scheduled_posts',
        sa.Column('content_library_item_id', sa.Uuid(), nullable=False),
        sa.Column('connected_account_id', sa.Uuid(), nullable=False),
        sa.Column(
            'platform',
            sa.Enum(
                'tiktok', 'youtube', 'instagram', 'reddit', 'linkedin',
                'twitter', 'facebook', 'pinterest', 'bluesky', 'threads',
                'google_business',
                name='platformtype',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=False),
        sa.Column('timezone', sa.String(length=50), nullable=False, default='UTC'),
        sa.Column(
            'status',
            sa.Enum(
                'draft', 'pending_sync', 'scheduled', 'publishing',
                'published', 'failed', 'cancelled',
                name='schedulestatus',
            ),
            nullable=False,
        ),
        sa.Column(
            'late_status',
            sa.Enum(
                'pending', 'processing', 'published', 'failed', 'partial',
                name='latepoststatus',
            ),
            nullable=True,
        ),
        sa.Column(
            'schedule_mode',
            sa.Enum('single_platform', 'multi_platform', name='schedulemode'),
            nullable=False,
        ),
        sa.Column('batch_id', sa.String(length=64), nullable=True),
        sa.Column('late_post_id', sa.String(length=64), nullable=True),
        sa.Column('platform_post_id', sa.String(length=64), nullable=True),
        sa.Column('platform_post_url', sa.String(length=2048), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, default=0),
        sa.Column(
            'platform_specific_config',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['content_library_item_id'],
            ['content_library_items.id'],
            name=op.f('fk_scheduled_posts_content_library_item_id_content_library_items'),
            ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['connected_account_id'],
            ['connected_accounts.id'],
            name=op.f('fk_scheduled_posts_connected_account_id_connected_accounts'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_scheduled_posts')),
    )
    op.create_index(
        'idx_scheduled_status',
        'scheduled_posts',
        ['status'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_platform',
        'scheduled_posts',
        ['platform'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_account',
        'scheduled_posts',
        ['connected_account_id'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_content',
        'scheduled_posts',
        ['content_library_item_id'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_late_post',
        'scheduled_posts',
        ['late_post_id'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_batch',
        'scheduled_posts',
        ['batch_id'],
        unique=False,
    )
    op.create_index(
        'idx_scheduled_for',
        'scheduled_posts',
        ['scheduled_for'],
        unique=False,
        postgresql_ops={'scheduled_for': 'ASC'},
    )
    op.create_index(
        'idx_scheduled_published',
        'scheduled_posts',
        ['published_at'],
        unique=False,
        postgresql_ops={'published_at': 'DESC'},
    )

    op.create_table(
        'post_analytics',
        sa.Column('scheduled_post_id', sa.Uuid(), nullable=False),
        sa.Column(
            'platform',
            sa.Enum(
                'tiktok', 'youtube', 'instagram', 'reddit', 'linkedin',
                'twitter', 'facebook', 'pinterest', 'bluesky', 'threads',
                'google_business',
                name='platformtype',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('views', sa.Integer(), nullable=False, default=0),
        sa.Column('likes', sa.Integer(), nullable=False, default=0),
        sa.Column('comments', sa.Integer(), nullable=False, default=0),
        sa.Column('shares', sa.Integer(), nullable=False, default=0),
        sa.Column('saves', sa.Integer(), nullable=False, default=0),
        sa.Column('clicks', sa.Integer(), nullable=False, default=0),
        sa.Column('impressions', sa.Integer(), nullable=False, default=0),
        sa.Column('reach', sa.Integer(), nullable=False, default=0),
        sa.Column('engagement_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('watch_time_seconds', sa.Float(), nullable=True),
        sa.Column('avg_watch_percentage', sa.Float(), nullable=True),
        sa.Column('synced_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            'raw_data',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['scheduled_post_id'],
            ['scheduled_posts.id'],
            name=op.f('fk_post_analytics_scheduled_post_id_scheduled_posts'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_post_analytics')),
        sa.UniqueConstraint(
            'scheduled_post_id',
            name='uq_analytics_scheduled_post',
        ),
    )
    op.create_index(
        'idx_analytics_post',
        'post_analytics',
        ['scheduled_post_id'],
        unique=False,
    )
    op.create_index(
        'idx_analytics_platform',
        'post_analytics',
        ['platform'],
        unique=False,
    )
    op.create_index(
        'idx_analytics_synced',
        'post_analytics',
        ['synced_at'],
        unique=False,
        postgresql_ops={'synced_at': 'DESC'},
    )
    op.create_index(
        'idx_analytics_engagement',
        'post_analytics',
        ['engagement_rate'],
        unique=False,
        postgresql_ops={'engagement_rate': 'DESC'},
    )

    op.create_table(
        'follower_stats',
        sa.Column('connected_account_id', sa.Uuid(), nullable=False),
        sa.Column(
            'platform',
            sa.Enum(
                'tiktok', 'youtube', 'instagram', 'reddit', 'linkedin',
                'twitter', 'facebook', 'pinterest', 'bluesky', 'threads',
                'google_business',
                name='platformtype',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column('recorded_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('follower_count', sa.Integer(), nullable=False),
        sa.Column('following_count', sa.Integer(), nullable=True),
        sa.Column('posts_count', sa.Integer(), nullable=True),
        sa.Column('daily_change', sa.Integer(), nullable=True),
        sa.Column('weekly_change', sa.Integer(), nullable=True),
        sa.Column('monthly_change', sa.Integer(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ['connected_account_id'],
            ['connected_accounts.id'],
            name=op.f('fk_follower_stats_connected_account_id_connected_accounts'),
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_follower_stats')),
        sa.UniqueConstraint(
            'connected_account_id',
            'recorded_date',
            name='uq_follower_account_date',
        ),
    )
    op.create_index(
        'idx_follower_account',
        'follower_stats',
        ['connected_account_id'],
        unique=False,
    )
    op.create_index(
        'idx_follower_platform',
        'follower_stats',
        ['platform'],
        unique=False,
    )
    op.create_index(
        'idx_follower_date',
        'follower_stats',
        ['recorded_date'],
        unique=False,
        postgresql_ops={'recorded_date': 'DESC'},
    )


def downgrade() -> None:
    op.drop_index('idx_follower_date', table_name='follower_stats', postgresql_ops={'recorded_date': 'DESC'})
    op.drop_index('idx_follower_platform', table_name='follower_stats')
    op.drop_index('idx_follower_account', table_name='follower_stats')
    op.drop_table('follower_stats')

    op.drop_index('idx_analytics_engagement', table_name='post_analytics', postgresql_ops={'engagement_rate': 'DESC'})
    op.drop_index('idx_analytics_synced', table_name='post_analytics', postgresql_ops={'synced_at': 'DESC'})
    op.drop_index('idx_analytics_platform', table_name='post_analytics')
    op.drop_index('idx_analytics_post', table_name='post_analytics')
    op.drop_table('post_analytics')

    op.drop_index('idx_scheduled_published', table_name='scheduled_posts', postgresql_ops={'published_at': 'DESC'})
    op.drop_index('idx_scheduled_for', table_name='scheduled_posts', postgresql_ops={'scheduled_for': 'ASC'})
    op.drop_index('idx_scheduled_batch', table_name='scheduled_posts')
    op.drop_index('idx_scheduled_late_post', table_name='scheduled_posts')
    op.drop_index('idx_scheduled_content', table_name='scheduled_posts')
    op.drop_index('idx_scheduled_account', table_name='scheduled_posts')
    op.drop_index('idx_scheduled_platform', table_name='scheduled_posts')
    op.drop_index('idx_scheduled_status', table_name='scheduled_posts')
    op.drop_table('scheduled_posts')

    op.drop_index('idx_media_late_id', table_name='media_attachments')
    op.drop_index('idx_media_type', table_name='media_attachments')
    op.drop_index('idx_media_content', table_name='media_attachments')
    op.drop_table('media_attachments')

    op.drop_index('idx_library_tags', table_name='content_library_items', postgresql_using='gin')
    op.drop_index('idx_library_created', table_name='content_library_items', postgresql_ops={'created_at': 'DESC'})
    op.drop_index('idx_library_deleted', table_name='content_library_items')
    op.drop_index('idx_library_platform', table_name='content_library_items')
    op.drop_index('idx_library_type', table_name='content_library_items')
    op.drop_table('content_library_items')

    op.drop_index('idx_connected_active', table_name='connected_accounts')
    op.drop_index('idx_connected_late_id', table_name='connected_accounts')
    op.drop_index('idx_connected_platform', table_name='connected_accounts')
    op.drop_table('connected_accounts')

    op.execute("DROP TYPE IF EXISTS contentlibrarytype;")
    op.execute("DROP TYPE IF EXISTS schedulemode;")
    op.execute("DROP TYPE IF EXISTS mediatype;")
    op.execute("DROP TYPE IF EXISTS latepoststatus;")
    op.execute("DROP TYPE IF EXISTS schedulestatus;")
