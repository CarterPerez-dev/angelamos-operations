"""
ⒸAngelaMos | 2025
tiktok.py
"""

from uuid import UUID
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from redis.asyncio import Redis

from core.security.auth.dependencies import CurrentUser, DBSession
from core.infrastructure.cache.dependencies import get_redis_client
from core.infrastructure.cache.keys import claude_session_key

from core.integrations.claude.service import ClaudeService
from core.integrations.mcp.context.builder import PromptBuilder
from core.integrations.mcp.context.tiktok_loader import TikTokContextLoader

from aspects.content_studio.shared.services.session_service import SessionService
from aspects.content_studio.shared.schemas.tiktok import (
    IdeaGenerationRequest,
    IdeaGenerationResponse,
    HookGenerationRequest,
    HookGenerationResponse,
    HookAnalysisRequest,
    HookAnalysisResponse,
    ScriptGenerationRequest,
    ScriptGenerationResponse,
    ScriptAnalysisRequest,
    ScriptAnalysisResponse,
    FinalReviewRequest,
    FinalReviewResponse,
)
from core.enums import (
    WorkflowStage,
    PlatformType,
)
from core.foundation.logging import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix = "/tiktok", tags = ["TikTok"])


@router.post("/ideas", response_model = IdeaGenerationResponse)
async def generate_ideas(
    request: IdeaGenerationRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> IdeaGenerationResponse:
    """
    Stage 1: Generate TikTok video ideas

    Creates workflow session and generates 10 ideas based on:
    - Carter's skills and interests
    - Past video performance
    - Content gaps
    - Platform goals
    """
    start_time = datetime.now()

    session_result = await SessionService.create_session(
        db,
        request.mode,
        initial_idea = None
    )
    session_id = UUID(session_result["session_id"])

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(WorkflowStage.IDEAS, session_id)

    builder = PromptBuilder()
    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.IDEAS,
        context,
        {
            "user_request": f"I need {request.count} TikTok ideas",
            "count": request.count,
            "topic_focus": request.topic_focus,
            "risk_tolerance": request.risk_tolerance,
            "video_type": request.video_type,
        },
    )

    claude = ClaudeService()
    result, claude_session_id = await claude.generate_structured(
        prompt,
        session_id = str(session_id)
    )

    if claude_session_id:
        await redis.set(
            claude_session_key(str(session_id)),
            claude_session_id,
            ex = 3600
        )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    await SessionService.save_generation(
        db,
        session_id = session_id,
        stage = WorkflowStage.IDEAS,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Ideas generated",
        session_id = session_id,
        claude_session_id = claude_session_id,
        ideas_count = len(result.get("ideas",
                                     [])),
        generation_time_ms = generation_time_ms,
    )

    return IdeaGenerationResponse(
        session_id = session_id,
        ideas = result["ideas"],
        content_gap_analysis = result.get("content_gap_analysis",
                                          {}),
        balance_recommendation = result.get("balance_recommendation",
                                            {}),
    )


@router.post("/hooks", response_model = HookGenerationResponse)
async def generate_hooks(
    request: HookGenerationRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> HookGenerationResponse:
    """
    Stage 2: Generate 20 TikTok hook variations

    Generates hooks using:
    - Three-hook system (visual + text + verbal)
    - Hook formulas and templates (100+)
    - Carter's brand voice
    - Past top performers
    """
    start_time = datetime.now()

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(
        WorkflowStage.HOOKS,
        request.session_id
    )

    builder = PromptBuilder()
    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.HOOKS,
        context,
        {
            "topic": request.topic,
            "category": request.category or "general",
            "target_length": request.target_length or "30-45 seconds",
            "format": request.format or "talking head",
            "credibility_signals": request.credibility_signals or "",
            "target_audience": request.target_audience or "",
            "count": request.count,
        },
    )

    resume_session = await redis.get(
        claude_session_key(str(request.session_id))
    )
    if isinstance(resume_session, bytes):
        resume_session = resume_session.decode()

    claude = ClaudeService()
    result, claude_session_id = await claude.generate_structured(
        prompt,
        session_id = str(request.session_id),
        resume_session = resume_session,
    )

    if claude_session_id and not resume_session:
        await redis.set(
            claude_session_key(str(request.session_id)),
            claude_session_id,
            ex = 3600
        )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    gen_result = await SessionService.save_generation(
        db,
        session_id = request.session_id,
        stage = WorkflowStage.HOOKS,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Hooks generated",
        session_id = request.session_id,
        resumed_session = resume_session is not None,
        hooks_count = len(result.get("hooks",
                                     [])),
        generation_time_ms = generation_time_ms,
    )

    return HookGenerationResponse(
        generation_id = UUID(gen_result["generation_id"]),
        session_id = request.session_id,
        hooks = result["hooks"],
        hook_analysis = result.get("hook_analysis",
                                   {}),
    )


@router.post("/hooks/analyze", response_model = HookAnalysisResponse)
async def analyze_hooks(
    request: HookAnalysisRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> HookAnalysisResponse:
    """
    Stage 3: Consultative analysis of chosen hooks

    Analyzes each hook for:
    - Credibility, curiosity, FOMO
    - Pros/cons
    - Performance prediction
    - Recommendations
    """
    start_time = datetime.now()

    await SessionService.save_user_selection(
        db,
        request.generation_id,
        {"selected_hook_ids": request.selected_hook_ids},
    )

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(
        WorkflowStage.HOOK_ANALYSIS,
        request.session_id
    )

    if not context.get("workflow", {}).get("generated_hooks"):
        raise HTTPException(
            status_code = 400,
            detail = "No hooks found for this session"
        )

    all_hooks = context["workflow"]["generated_hooks"].get("hooks", [])
    selected_hooks = [
        h for h in all_hooks if h["id"] in request.selected_hook_ids
    ]

    builder = PromptBuilder()
    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.HOOK_ANALYSIS,
        context,
        {
            "selected_hooks": selected_hooks,
        },
    )

    resume_session = await redis.get(
        claude_session_key(str(request.session_id))
    )
    if isinstance(resume_session, bytes):
        resume_session = resume_session.decode()

    claude = ClaudeService()
    result, _ = await claude.generate_structured(
        prompt,
        session_id = str(request.session_id),
        resume_session = resume_session,
    )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    gen_result = await SessionService.save_generation(
        db,
        session_id = request.session_id,
        stage = WorkflowStage.HOOK_ANALYSIS,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Hook analysis complete",
        session_id = request.session_id,
        resumed_session = resume_session is not None,
        hooks_analyzed = len(selected_hooks),
        generation_time_ms = generation_time_ms,
    )

    return HookAnalysisResponse(
        generation_id = UUID(gen_result["generation_id"]),
        session_id = request.session_id,
        analysis = result["analysis"],
        recommendation = result["recommendation"],
        if_none_feel_right = result.get("if_none_feel_right",
                                        {}),
    )


@router.post("/script", response_model = ScriptGenerationResponse)
async def generate_script(
    request: ScriptGenerationRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> ScriptGenerationResponse:
    """
    Stage 4: Generate script with 10 variations per sentence

    Generates script using:
    - Chosen hook
    - Pacing rules (7-12 words, 150-180 WPM)
    - Structure templates (30s vs 60s)
    - Retention tactics
    - Carter's voice
    """
    start_time = datetime.now()

    await SessionService.save_user_selection(
        db,
        request.session_id,
        {
            "chosen_hook_id": request.chosen_hook_id,
            "video_length": request.video_length
        },
    )

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(
        WorkflowStage.SCRIPT,
        request.session_id
    )

    builder = PromptBuilder()

    video_length_template = (
        "30_second" if request.video_length <= 45 else "60_second"
    )

    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.SCRIPT,
        context,
        {
            "topic": request.topic,
            "video_length": request.video_length,
            "video_length_template": video_length_template,
            "format": request.format or "talking head",
            "credibility_to_establish": request.credibility_to_establish
            or "",
            "carter_expertise": request.carter_expertise or "",
        },
    )

    resume_session = await redis.get(
        claude_session_key(str(request.session_id))
    )
    if isinstance(resume_session, bytes):
        resume_session = resume_session.decode()

    claude = ClaudeService()
    result, _ = await claude.generate_structured(
        prompt,
        session_id = str(request.session_id),
        resume_session = resume_session,
    )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    gen_result = await SessionService.save_generation(
        db,
        session_id = request.session_id,
        stage = WorkflowStage.SCRIPT,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Script generated",
        session_id = request.session_id,
        resumed_session = resume_session is not None,
        video_length = request.video_length,
        generation_time_ms = generation_time_ms,
    )

    return ScriptGenerationResponse(
        generation_id = UUID(gen_result["generation_id"]),
        session_id = request.session_id,
        script = result["script"],
        full_script_assembled = result["full_script_assembled"],
        pacing_notes = result["pacing_notes"],
        ai_detection_check = result["ai_detection_check"],
    )


@router.post("/script/analyze", response_model = ScriptAnalysisResponse)
async def analyze_script(
    request: ScriptAnalysisRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> ScriptAnalysisResponse:
    """
    Stage 5: Consultative analysis of assembled script

    Analyzes:
    - Flow and pacing
    - Sentence-by-sentence feedback
    - Retention prediction
    - Engagement prediction
    - Recommendations
    """
    start_time = datetime.now()

    await SessionService.save_user_selection(
        db,
        request.session_id,
        {"chosen_variations": request.chosen_variations},
    )

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(
        WorkflowStage.SCRIPT_ANALYSIS,
        request.session_id
    )

    if not context.get("workflow", {}).get("generated_script"):
        raise HTTPException(
            status_code = 400,
            detail = "No script found for this session"
        )

    full_script = ""

    builder = PromptBuilder()
    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.SCRIPT_ANALYSIS,
        context,
        {
            "chosen_variations": request.chosen_variations,
            "full_script": full_script,
        },
    )

    resume_session = await redis.get(
        claude_session_key(str(request.session_id))
    )
    if isinstance(resume_session, bytes):
        resume_session = resume_session.decode()

    claude = ClaudeService()
    result, _ = await claude.generate_structured(
        prompt,
        session_id = str(request.session_id),
        resume_session = resume_session,
    )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    gen_result = await SessionService.save_generation(
        db,
        session_id = request.session_id,
        stage = WorkflowStage.SCRIPT_ANALYSIS,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Script analysis complete",
        session_id = request.session_id,
        resumed_session = resume_session is not None,
        generation_time_ms = generation_time_ms,
    )

    return ScriptAnalysisResponse(
        generation_id = UUID(gen_result["generation_id"]),
        session_id = request.session_id,
        overall_assessment = result["overall_assessment"],
        sentence_by_sentence_feedback = result[
            "sentence_by_sentence_feedback"],
        flow_analysis = result["flow_analysis"],
        retention_prediction = result["retention_prediction"],
        engagement_prediction = result["engagement_prediction"],
        recommended_changes_summary = result["recommended_changes_summary"
                                             ],
        final_recommendation = result["final_recommendation"],
    )


@router.post("/review", response_model = FinalReviewResponse)
async def final_review(
    request: FinalReviewRequest,
    db: DBSession,
    redis: Redis = Depends(get_redis_client),
    current_user: CurrentUser = None,
) -> FinalReviewResponse:
    """
    Stage 6: Final review before recording

    Performs:
    - AI detection scan
    - Speaking pace check
    - Pattern interrupt placement
    - Energy progression check
    - Performance prediction
    - GO/NO-GO decision
    """
    start_time = datetime.now()

    loader = TikTokContextLoader(redis, db)
    context = await loader.load_for_stage(
        WorkflowStage.FINAL_REVIEW,
        request.session_id
    )

    builder = PromptBuilder()
    prompt = builder.build_prompt(
        PlatformType.TIKTOK,
        WorkflowStage.FINAL_REVIEW,
        context,
        {
            "finalized_script": request.finalized_script,
            "chosen_hook": request.chosen_hook,
            "target_length": request.target_length,
            "format": request.format,
        },
    )

    resume_session = await redis.get(
        claude_session_key(str(request.session_id))
    )
    if isinstance(resume_session, bytes):
        resume_session = resume_session.decode()

    claude = ClaudeService()
    result, _ = await claude.generate_structured(
        prompt,
        session_id = str(request.session_id),
        resume_session = resume_session,
    )

    generation_time_ms = int(
        (datetime.now() - start_time).total_seconds() * 1000
    )

    gen_result = await SessionService.save_generation(
        db,
        session_id = request.session_id,
        stage = WorkflowStage.FINAL_REVIEW,
        output_data = result,
        ai_model = "claude-opus-4-5",
        generation_time_ms = generation_time_ms,
    )

    logger.info(
        "Final review complete",
        session_id = request.session_id,
        resumed_session = resume_session is not None,
        go_decision = result.get("go_no_go_decision",
                                 {}).get("decision"),
        generation_time_ms = generation_time_ms,
    )

    return FinalReviewResponse(
        generation_id = UUID(gen_result["generation_id"]),
        session_id = request.session_id,
        final_checks = result["final_checks"],
        recording_notes = result["recording_notes"],
        performance_prediction = result["performance_prediction"],
        comparison_to_past_videos = result["comparison_to_past_videos"],
        go_no_go_decision = result["go_no_go_decision"],
    )
