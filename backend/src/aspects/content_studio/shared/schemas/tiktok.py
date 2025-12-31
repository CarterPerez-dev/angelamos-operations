"""
ⒸAngelaMos | 2025
tiktok.py
"""

from uuid import UUID
from typing import Any
from pydantic import BaseModel, Field

from core.enums import WorkflowMode


class IdeaGenerationRequest(BaseModel):
    """
    Stage 1: Idea Generation request
    """

    mode: WorkflowMode = WorkflowMode.GIVE_ME_IDEAS
    count: int = Field(default = 10, ge = 1, le = 20)
    topic_focus: str | None = None
    risk_tolerance: str | None = None
    video_type: str | None = None


class TikTokIdea(BaseModel):
    """
    Single TikTok idea
    """

    id: int
    topic: str
    category: str
    risk_level: str
    reasoning: dict[str, str]
    suggested_hook_style: str
    example_hooks: list[str]
    estimated_engagement: str
    video_length_target: str
    format: str
    note: str | None = None


class IdeaGenerationResponse(BaseModel):
    """
    Stage 1: Idea Generation response
    """

    session_id: UUID
    ideas: list[TikTokIdea]
    content_gap_analysis: dict[str, list[str]]
    balance_recommendation: dict[str, Any]


class HookGenerationRequest(BaseModel):
    """
    Stage 2: Hook Generation request
    """

    session_id: UUID
    topic: str
    category: str | None = None
    target_length: str | None = None
    format: str | None = None
    credibility_signals: str | None = None
    target_audience: str | None = None
    count: int = Field(default = 20, ge = 10, le = 30)


class TikTokHook(BaseModel):
    """
    Single TikTok hook (visual + text + verbal)
    """

    id: int
    visual_hook: str
    text_hook: str
    verbal_hook: str
    word_count: int
    hook_formulas_used: list[str]
    credibility_signals: list[str]
    fomo_elements: list[str]
    curiosity_drivers: list[str]
    estimated_stop_rate: str
    reasoning: str


class HookGenerationResponse(BaseModel):
    """
    Stage 2: Hook Generation response
    """

    generation_id: UUID
    session_id: UUID
    hooks: list[TikTokHook]
    hook_analysis: dict[str, Any]


class HookAnalysisRequest(BaseModel):
    """
    Stage 3: Hook Analysis request
    """

    session_id: UUID
    generation_id: UUID
    selected_hook_ids: list[int] = Field(min_length = 1, max_length = 10)
    question: str | None = None


class HookAnalysis(BaseModel):
    """
    Analysis for single hook
    """

    hook_id: int
    credibility: dict[str, Any]
    curiosity: dict[str, Any]
    fomo: dict[str, Any]
    length: dict[str, Any]
    authenticity: dict[str, Any]
    pros: list[str]
    cons: list[str]
    risk_factors: list[str]
    performance_prediction: str


class HookAnalysisResponse(BaseModel):
    """
    Stage 3: Hook Analysis response
    """

    generation_id: UUID
    session_id: UUID
    analysis: dict[str, HookAnalysis]
    recommendation: dict[str, Any]
    if_none_feel_right: dict[str, Any]


class ScriptGenerationRequest(BaseModel):
    """
    Stage 4: Script Generation request
    """

    session_id: UUID
    chosen_hook_id: int
    video_length: int = Field(default = 30, ge = 15, le = 90)
    topic: str
    format: str | None = None
    credibility_to_establish: str | None = None
    carter_expertise: str | None = None


class ScriptSentence(BaseModel):
    """
    Single sentence with 10 variations
    """

    sentence_number: int
    purpose: str
    variations: list[str] = Field(min_length = 10, max_length = 10)
    recommendation: str


class ScriptSection(BaseModel):
    """
    Script section with sentences
    """

    timestamp: str
    energy_level: str
    sentences: list[ScriptSentence]
    pattern_interrupt_suggestion: str | None = None


class ScriptGenerationResponse(BaseModel):
    """
    Stage 4: Script Generation response
    """

    generation_id: UUID
    session_id: UUID
    script: dict[str, Any]
    full_script_assembled: dict[str, Any]
    pacing_notes: dict[str, Any]
    ai_detection_check: dict[str, Any]


class ScriptAnalysisRequest(BaseModel):
    """
    Stage 5: Script Analysis request
    """

    session_id: UUID
    chosen_variations: dict[int, int]
    questions: list[str] | None = None


class SentenceFeedback(BaseModel):
    """
    Feedback for single sentence choice
    """

    your_choice: str
    assessment: str
    why_it_works: str
    alternative_suggestion: str | None = None
    keep_or_swap: str


class ScriptAnalysisResponse(BaseModel):
    """
    Stage 5: Script Analysis response
    """

    generation_id: UUID
    session_id: UUID
    overall_assessment: dict[str, Any]
    sentence_by_sentence_feedback: dict[str, SentenceFeedback]
    flow_analysis: dict[str, Any]
    retention_prediction: dict[str, Any]
    engagement_prediction: dict[str, Any]
    recommended_changes_summary: dict[str, Any]
    final_recommendation: dict[str, Any]


class FinalReviewRequest(BaseModel):
    """
    Stage 6: Final Review request
    """

    session_id: UUID
    finalized_script: str
    chosen_hook: dict[str, str]
    target_length: int
    format: str


class FinalReviewResponse(BaseModel):
    """
    Stage 6: Final Review response
    """

    generation_id: UUID
    session_id: UUID
    final_checks: dict[str, Any]
    recording_notes: dict[str, Any]
    performance_prediction: dict[str, Any]
    comparison_to_past_videos: dict[str, Any]
    go_no_go_decision: dict[str, Any]
