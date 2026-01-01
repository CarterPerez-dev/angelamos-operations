"""
ⒸAngelaMos | 2025
env.py
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from config import settings
from core.infrastructure.database.Base import Base
from core.enums import SafeEnum

from aspects.auth.models.User import User  # noqa: F401
from aspects.auth.models.RefreshToken import RefreshToken  # noqa: F401
from core.foundation.models.identity import (  # noqa: F401
    CoreIdentity,
    IdentitySkill,
    IdentityInterest,
    IdentityCertification,
    IdentityStrength,
    IdentityWeakness,
    BrandVoice,
    BrandVoiceAvoid,
    PlatformGoal,
    RevenueGoal,
    ContentPillar,
    ContentPreference,
)
from aspects.content_studio.shared.models.platform_rules import (  # noqa: F401
    PlatformRule,
    RedditSubreddit,
    RedditSubredditRule,
    RedditForbiddenPattern,
    RedditUpvoteDriver,
    TikTokRule,
    LinkedInRule,
    TwitterRule,
    YouTubeRule,
    HashtagStrategy,
    CrossPlatformRule,
    ContentRepurposing,
)
from aspects.content_studio.shared.models.virality_tiktok import (  # noqa: F401
    TikTokHookSystem,
    TikTokHookFormula,
    TikTokStructureTemplate,
    TikTokPacing,
    TikTokRetentionTactic,
    TikTokCTAStrategy,
    TikTokCommonMistake,
    TikTokPlatformSpecific,
)
from aspects.content_studio.shared.models.virality_reddit import (  # noqa: F401
    RedditPostType,
    RedditFormatting,
    RedditTiming,
    RedditEngagementTactic,
)
from aspects.content_studio.shared.models.virality_linkedin import (  # noqa: F401
    LinkedInPostFormat,
    LinkedInHook,
    LinkedInFormatting,
)
from aspects.content_studio.shared.models.virality_youtube import (  # noqa: F401
    YouTubeStructureFramework,
    YouTubeHookType,
    YouTubePacing,
    YouTubeSEO,
    YouTubeViralPattern,
)
from aspects.content_studio.shared.models.virality_twitter import (  # noqa: F401
    TwitterFormatStrategy,
    TwitterHook,
    TwitterThreadArchitecture,
    TwitterEngagementTactic,
    TwitterViralPattern,
)
from aspects.content_studio.shared.models.content_tracking import (  # noqa: F401
    WorkflowSession,
    ContentHistory,
    HookList,
    GeneratedContent,
)
from aspects.content_studio.shared.models.scheduling import (  # noqa: F401
    ConnectedAccount,
    ContentLibraryItem,
    MediaAttachment,
    ScheduledPost,
    PostAnalytics,
    FollowerStats,
)
from aspects.challenge.facets.tracker.models import Challenge, ChallengeLog  # noqa: F401
from aspects.life_manager.facets.planner.models import (  # noqa: F401
    TimeBlock,
    NoteFolder,
    Note,
)


config = context.config


def render_item(type_, obj, autogen_context):
    """
    Custom renderer for alembic autogenerate.
    Converts SafeEnum to standard sa.Enum and ensures DateTime uses timezone.
    """
    import sqlalchemy as sa

    if isinstance(obj, SafeEnum):
        enum_class = obj.enum_class
        values = [e.value for e in enum_class]
        return f"sa.Enum({', '.join(repr(v) for v in values)}, name='{obj.name}')"

    if isinstance(obj, sa.DateTime):
        return "sa.DateTime(timezone=True)"

    return False


if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    """
    Get database URL from settings
    """
    return str(settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode
    """
    url = get_url()
    context.configure(
        url = url,
        target_metadata = target_metadata,
        literal_binds = True,
        dialect_opts = {"paramstyle": "named"},
        compare_type = True,
        compare_server_default = True,
        render_item = render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """
    Run migrations with connection
    """
    context.configure(
        connection = connection,
        target_metadata = target_metadata,
        compare_type = True,
        compare_server_default = True,
        render_item = render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations in async mode
    """
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix = "sqlalchemy.",
        poolclass = pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode
    """
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
