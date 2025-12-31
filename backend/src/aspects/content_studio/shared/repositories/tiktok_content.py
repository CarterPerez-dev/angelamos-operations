"""
ⒸAngelaMos | 2025
tiktok_content.py
"""

from uuid import UUID
from datetime import datetime, timedelta

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.models.content_tracking import (
    WorkflowSession,
    ContentHistory,
    HookList,
    GeneratedContent,
)
from core.enums import (
    PlatformType,
    ContentStatus,
    WorkflowMode,
    WorkflowStage,
    GeneratedContentStatus,
)
from core.constants import (
    HIGH_ENGAGEMENT_RATE_THRESHOLD,
)


class TikTokContentRepository:
    """
    Repository for TikTok content history and workflow tracking

    All methods auto-filter to platform='tiktok'
    """
    @staticmethod
    async def get_top_performers(
        session: AsyncSession,
        limit: int = 20,
        days: int = 30
    ) -> list[ContentHistory]:
        """
        Get top performing TikTok videos by engagement rate

        Args:
            limit: Max videos to return
            days: Only videos from last N days

        Returns videos with highest engagement_rate
        """
        since_date = datetime.now() - timedelta(days = days)

        result = await session.execute(
            select(ContentHistory).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.status == ContentStatus.PUBLISHED,
                    ContentHistory.published_at >= since_date,
                    ContentHistory.engagement_rate.is_not(None),
                )
            ).order_by(ContentHistory.engagement_rate.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_high_engagement_videos(
        session: AsyncSession,
        limit: int = 10,
        days: int = 90
    ) -> list[ContentHistory]:
        """
        Get videos with HIGH engagement (above threshold)

        Used for analyzing what hooks/topics/formats work best
        """
        since_date = datetime.now() - timedelta(days = days)

        result = await session.execute(
            select(ContentHistory).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.status == ContentStatus.PUBLISHED,
                    ContentHistory.published_at >= since_date,
                    ContentHistory.engagement_rate
                    >= HIGH_ENGAGEMENT_RATE_THRESHOLD,
                )
            ).order_by(ContentHistory.published_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_topic(
        session: AsyncSession,
        topic: str,
        limit: int = 20
    ) -> list[ContentHistory]:
        """
        Get TikTok videos by topic

        Args:
            topic: Topic to search for (e.g., "certifications", "Python")
        """
        result = await session.execute(
            select(ContentHistory).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.topic.ilike(f"%{topic}%"),
                    ContentHistory.status == ContentStatus.PUBLISHED,
                )
            ).order_by(ContentHistory.published_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_tags(
        session: AsyncSession,
        tags: list[str],
        limit: int = 20
    ) -> list[ContentHistory]:
        """
        Get TikTok videos by tags

        Args:
            tags: List of tags to match (e.g., ["CompTIA", "Security+"])
        """
        result = await session.execute(
            select(ContentHistory).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.tags.overlap(tags),
                    ContentHistory.status == ContentStatus.PUBLISHED,
                )
            ).order_by(ContentHistory.published_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_performance_summary(
        session: AsyncSession,
        days: int = 30
    ) -> dict:
        """
        Get aggregated performance stats for TikTok

        Returns:
        - total_videos
        - avg_views
        - avg_likes
        - avg_engagement_rate
        - max_views
        - total_views
        """
        since_date = datetime.now() - timedelta(days = days)

        result = await session.execute(
            select(
                func.count(ContentHistory.id).label("total_videos"),
                func.avg(ContentHistory.views).label("avg_views"),
                func.avg(ContentHistory.likes).label("avg_likes"),
                func.avg(ContentHistory.engagement_rate
                         ).label("avg_engagement"),
                func.max(ContentHistory.views).label("max_views"),
                func.sum(ContentHistory.views).label("total_views"),
            ).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.status == ContentStatus.PUBLISHED,
                    ContentHistory.published_at >= since_date,
                )
            )
        )

        row = result.first()
        return {
            "total_videos":
            row.total_videos or 0,
            "avg_views":
            int(row.avg_views) if row.avg_views else 0,
            "avg_likes":
            int(row.avg_likes) if row.avg_likes else 0,
            "avg_engagement":
            float(row.avg_engagement) if row.avg_engagement else 0.0,
            "max_views":
            row.max_views or 0,
            "total_views":
            row.total_views or 0,
        }

    @staticmethod
    async def get_content_gaps(session: AsyncSession) -> list[str]:
        """
        Get topics NOT yet covered (content gaps)

        Returns list of topics Carter hasn't made videos about yet
        """
        result = await session.execute(
            select(ContentHistory.topic).where(
                and_(
                    ContentHistory.platform == PlatformType.TIKTOK,
                    ContentHistory.status == ContentStatus.PUBLISHED,
                )
            ).distinct()
        )

        covered_topics = [row[0] for row in result.all() if row[0]]

        all_potential_topics = [
            "Python",
            "Flask",
            "FastAPI",
            "React",
            "Docker",
            "Redis",
            "WebSockets",
            "CI/CD",
            "Certifications",
            "Cybersecurity",
            "Career advice",
            "Building in public",
        ]

        return [t for t in all_potential_topics if t not in covered_topics]

    @staticmethod
    async def get_hook_templates(
        session: AsyncSession,
        category: str | None = None,
        limit: int = 100
    ) -> list[HookList]:
        """
        Get hook templates from internet (not actual hooks used)

        These are TEMPLATES with [placeholders] that AI adapts

        Args:
            category: Optional filter (mistake_warning, contrarian, curiosity_gap, etc.)
            limit: Max templates to return (default 100)

        Note: platform='all' for these templates (not platform-specific)
        """
        query = select(HookList).where(
            or_(
                HookList.platform == PlatformType.TIKTOK,
                HookList.platform.is_(None),
            )
        )

        if category:
            query = query.where(HookList.hook_category == category)

        query = query.limit(limit)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_hook_templates_by_category(
        session: AsyncSession,
    ) -> dict[str,
              list[HookList]]:
        """
        Get hook templates grouped by category

        Returns dict like:
        {
            "mistake_warning": [hooks...],
            "contrarian": [hooks...],
            "curiosity_gap": [hooks...],
            etc.
        }
        """
        result = await session.execute(
            select(HookList).where(
                or_(
                    HookList.platform == PlatformType.TIKTOK,
                    HookList.platform.is_(None),
                )
            )
        )

        hooks = result.scalars().all()

        grouped = {}
        for hook in hooks:
            category = hook.hook_category or "uncategorized"
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(hook)

        return grouped

    @staticmethod
    async def create_workflow_session(
        session: AsyncSession,
        mode: WorkflowMode,
        initial_idea: str | None = None,
    ) -> WorkflowSession:
        """
        Create new TikTok workflow session

        Args:
            mode: GIVE_ME_IDEAS or I_HAVE_IDEA
            initial_idea: If mode=I_HAVE_IDEA, the initial topic
        """
        starting_stage = (
            WorkflowStage.IDEAS
            if mode == WorkflowMode.GIVE_ME_IDEAS else WorkflowStage.HOOKS
        )

        workflow = WorkflowSession(
            platform = PlatformType.TIKTOK,
            mode = mode,
            current_stage = starting_stage,
            initial_idea = initial_idea,
        )

        session.add(workflow)
        await session.flush()
        await session.refresh(workflow)
        return workflow

    @staticmethod
    async def get_workflow_session(
        session: AsyncSession,
        session_id: UUID
    ) -> WorkflowSession | None:
        """
        Get workflow session by ID
        """
        result = await session.execute(
            select(WorkflowSession).where(
                WorkflowSession.id == session_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_workflow_chain(session: AsyncSession,
                                 session_id: UUID
                                 ) -> list[GeneratedContent]:
        """
        Get all generated content for a TikTok workflow session

        Returns ordered by creation (Stage 1 → Stage 2 → etc.)
        """
        result = await session.execute(
            select(GeneratedContent).where(
                GeneratedContent.session_id == session_id
            ).order_by(GeneratedContent.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_generated_content(
        session: AsyncSession,
        session_id: UUID,
        workflow_stage: WorkflowStage,
        input_data: dict,
        output_data: dict,
        ai_model: str,
        parent_id: UUID | None = None,
        tokens_used: int | None = None,
        generation_time_ms: int | None = None,
    ) -> GeneratedContent:
        """
        Create new generated content record for TikTok workflow
        """
        generated = GeneratedContent(
            session_id = session_id,
            platform = PlatformType.TIKTOK,
            workflow_stage = workflow_stage,
            parent_id = parent_id,
            input_data = input_data,
            output_data = output_data,
            ai_model = ai_model,
            tokens_used = tokens_used,
            generation_time_ms = generation_time_ms,
            status = GeneratedContentStatus.GENERATED,
        )

        session.add(generated)
        await session.flush()
        await session.refresh(generated)
        return generated

    @staticmethod
    async def update_user_selection(
        session: AsyncSession,
        generation_id: UUID,
        user_selected: dict
    ) -> GeneratedContent:
        """
        Update user's selections for a generation (e.g., chosen hook indices)
        """
        result = await session.execute(
            select(GeneratedContent).where(
                GeneratedContent.id == generation_id
            )
        )
        generated = result.scalar_one()
        generated.user_selected = user_selected
        generated.status = GeneratedContentStatus.APPROVED

        await session.flush()
        await session.refresh(generated)
        return generated

    @staticmethod
    async def get_generated_by_stage(
        session: AsyncSession,
        session_id: UUID,
        stage: WorkflowStage
    ) -> GeneratedContent | None:
        """
        Get generated content for specific stage in workflow

        Example: Get hooks generated in Stage 2
        """
        result = await session.execute(
            select(GeneratedContent).where(
                and_(
                    GeneratedContent.session_id == session_id,
                    GeneratedContent.workflow_stage == stage,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_latest_generation(
        session: AsyncSession,
        session_id: UUID
    ) -> GeneratedContent | None:
        """
        Get most recent generation in workflow
        """
        result = await session.execute(
            select(GeneratedContent).where(
                GeneratedContent.session_id == session_id
            ).order_by(GeneratedContent.created_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()
