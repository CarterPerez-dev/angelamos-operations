"""
ⒸAngelaMos | 2025
session_service.py
"""

from typing import ClassVar
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from aspects.content_studio.shared.repositories.tiktok_content import (
    TikTokContentRepository,
)
from core.enums import WorkflowMode, WorkflowStage
from core.foundation.logging import get_logger


logger = get_logger(__name__)


class SessionService:
    """
    Service for managing TikTok workflow sessions

    Handles:
    - Session creation (Mode 1 vs Mode 2)
    - Stage progression
    - User selection storage
    - Workflow state retrieval
    - Back navigation (stage invalidation)
    """

    STAGE_ORDER: ClassVar[list[WorkflowStage]] = [
        WorkflowStage.IDEAS,
        WorkflowStage.HOOKS,
        WorkflowStage.HOOK_ANALYSIS,
        WorkflowStage.SCRIPT,
        WorkflowStage.SCRIPT_ANALYSIS,
        WorkflowStage.FINAL_REVIEW,
    ]

    @staticmethod
    async def create_session(
        session: AsyncSession,
        mode: WorkflowMode,
        initial_idea: str | None = None,
    ) -> dict:
        """
        Create new TikTok workflow session

        Args:
            session: Database session
            mode: GIVE_ME_IDEAS (Mode 2) or I_HAVE_IDEA (Mode 1)
            initial_idea: Required if mode=I_HAVE_IDEA

        Returns:
            Dict with session_id, platform, mode, current_stage

        Example:
            result = await SessionService.create_session(
                db, WorkflowMode.I_HAVE_IDEA, "Python async tutorial"
            )
            session_id = result["session_id"]
        """
        if mode == WorkflowMode.I_HAVE_IDEA and not initial_idea:
            raise ValueError("initial_idea required for I_HAVE_IDEA mode")

        workflow = await TikTokContentRepository.create_workflow_session(
            session,
            mode,
            initial_idea
        )

        await session.commit()

        logger.info(
            "Workflow session created",
            session_id = workflow.id,
            mode = mode.value,
            starting_stage = workflow.current_stage.value,
        )

        return {
            "session_id": str(workflow.id),
            "platform": workflow.platform.value,
            "mode": workflow.mode.value,
            "current_stage": workflow.current_stage.value,
            "initial_idea": workflow.initial_idea,
        }

    @staticmethod
    async def get_session(session: AsyncSession, session_id: UUID) -> dict:
        """
        Get workflow session with full generation history

        Returns:
            Session data + all generations + current stage
        """
        workflow = await TikTokContentRepository.get_workflow_session(
            session,
            session_id
        )

        if not workflow:
            raise ValueError(f"Session {session_id} not found")

        generations = await TikTokContentRepository.get_workflow_chain(
            session,
            session_id
        )

        return {
            "session_id":
            str(workflow.id),
            "platform":
            workflow.platform.value,
            "mode":
            workflow.mode.value,
            "current_stage":
            workflow.current_stage.value,
            "initial_idea":
            workflow.initial_idea,
            "generations": [
                {
                    "id":
                    str(g.id),
                    "stage":
                    g.workflow_stage.value,
                    "status":
                    g.status.value,
                    "output_preview":
                    str(g.output_data)[: 200] if g.output_data else None,
                    "user_selected":
                    g.user_selected,
                } for g in generations
            ],
        }

    @staticmethod
    async def save_generation(
        session: AsyncSession,
        session_id: UUID,
        stage: WorkflowStage,
        output_data: dict,
        ai_model: str = "claude-opus-4-5",
        tokens_used: int | None = None,
        generation_time_ms: int | None = None,
        parent_id: UUID | None = None,
    ) -> dict:
        """
        Save AI-generated content for a stage

        Args:
            session_id: Workflow session ID
            stage: Current stage
            output_data: Generated content (hooks, script, analysis, etc.)
            ai_model: Model used for generation
            tokens_used: Token count
            generation_time_ms: Generation duration
            parent_id: ID of previous stage generation

        Returns:
            Dict with generation_id
        """
        generated = await TikTokContentRepository.create_generated_content(
            session,
            session_id = session_id,
            workflow_stage = stage,
            input_data = {},
            output_data = output_data,
            ai_model = ai_model,
            parent_id = parent_id,
            tokens_used = tokens_used,
            generation_time_ms = generation_time_ms,
        )

        await session.commit()

        logger.info(
            "Generation saved",
            session_id = session_id,
            stage = stage.value,
            generation_id = generated.id,
            tokens_used = tokens_used,
        )

        return {
            "generation_id": str(generated.id),
            "session_id": str(session_id),
            "stage": stage.value,
        }

    @staticmethod
    async def save_user_selection(
        session: AsyncSession,
        generation_id: UUID,
        user_selected: dict,
    ) -> dict:
        """
        Save user's selections from a generation

        Example:
            User picked hooks #2, #7, #14 from 20 generated hooks

        Args:
            generation_id: ID of the generation
            user_selected: User's choices (e.g., {"chosen_hooks": [2, 7, 14]})

        Returns:
            Updated generation info
        """
        updated = await TikTokContentRepository.update_user_selection(
            session,
            generation_id,
            user_selected
        )

        await session.commit()

        logger.info(
            "User selection saved",
            generation_id = generation_id,
            stage = updated.workflow_stage.value,
            status = updated.status.value,
        )

        return {
            "generation_id": str(updated.id),
            "stage": updated.workflow_stage.value,
            "status": updated.status.value,
        }

    @staticmethod
    async def advance_stage(
        session: AsyncSession,
        session_id: UUID,
        next_stage: WorkflowStage
    ) -> dict:
        """
        Advance workflow to next stage

        Validates that transition is allowed based on stage order

        Args:
            session_id: Workflow session ID
            next_stage: Stage to advance to

        Returns:
            Updated session info

        Raises:
            ValueError: If transition is invalid
        """
        workflow = await TikTokContentRepository.get_workflow_session(
            session,
            session_id
        )

        if not workflow:
            raise ValueError(f"Session {session_id} not found")

        current_index = SessionService.STAGE_ORDER.index(
            workflow.current_stage
        )
        next_index = SessionService.STAGE_ORDER.index(next_stage)

        if next_index != current_index + 1:
            raise ValueError(
                f"Invalid stage transition: {workflow.current_stage.value} → {next_stage.value}"
            )

        workflow.current_stage = next_stage
        await session.commit()

        logger.info(
            "Workflow advanced",
            session_id = session_id,
            previous_stage = SessionService.STAGE_ORDER[current_index].
            value,
            current_stage = next_stage.value,
        )

        return {
            "session_id": str(session_id),
            "current_stage": next_stage.value,
            "can_go_back": next_index > 0,
            "can_go_forward": next_index
            < len(SessionService.STAGE_ORDER) - 1,
        }

    @staticmethod
    async def go_back(
        session: AsyncSession,
        session_id: UUID,
        invalidate_forward: bool = True
    ) -> dict:
        """
        Go back one stage in workflow

        Args:
            session_id: Workflow session ID
            invalidate_forward: If True, delete all subsequent generations
                                (user will re-generate from this stage)

        Returns:
            Updated session info with warning if stages invalidated
        """
        workflow = await TikTokContentRepository.get_workflow_session(
            session,
            session_id
        )

        if not workflow:
            raise ValueError(f"Session {session_id} not found")

        current_index = SessionService.STAGE_ORDER.index(
            workflow.current_stage
        )

        if current_index == 0:
            raise ValueError("Already at first stage, cannot go back")

        previous_stage = SessionService.STAGE_ORDER[current_index - 1]

        if invalidate_forward:
            generations = await TikTokContentRepository.get_workflow_chain(
                session,
                session_id
            )

            for gen in generations:
                gen_index = SessionService.STAGE_ORDER.index(
                    gen.workflow_stage
                )
                if gen_index >= current_index:
                    await session.delete(gen)

            logger.warning(
                "Forward stages invalidated",
                session_id = session_id,
                invalidated_from_stage = workflow.current_stage.value,
            )

        workflow.current_stage = previous_stage
        await session.commit()

        return {
            "session_id":
            str(session_id),
            "current_stage":
            previous_stage.value,
            "invalidated":
            invalidate_forward,
            "warning":
            "Subsequent stages deleted - will need to regenerate"
            if invalidate_forward else None,
        }
