// ===================
// © AngelaMos | 2025
// tiktok.types.ts
// ===================

import type { WorkflowMode, WorkflowStage } from './tiktok.enums'

export interface TikTokIdea {
  id: number
  topic: string
  category: string
  risk_level: string
  reasoning: Record<string, string>
  suggested_hook_style: string
  example_hooks: string[]
  estimated_engagement: string
  video_length_target: string
  format: string
  note?: string
}

export interface TikTokHook {
  id: number
  visual_hook: string
  text_hook: string
  verbal_hook: string
  word_count: number
  hook_formulas_used: string[]
  credibility_signals: string[]
  fomo_elements: string[]
  curiosity_drivers: string[]
  estimated_stop_rate: string
  reasoning: string
}

export interface HookAnalysisScore {
  score: number
  reasoning: string
}

export interface HookAnalysis {
  hook_id: number
  credibility: HookAnalysisScore
  curiosity: HookAnalysisScore
  fomo: HookAnalysisScore
  length: {
    text_hook_words: number
    verbal_hook_words: number
    assessment: string
  }
  authenticity: HookAnalysisScore
  pros: string[]
  cons: string[]
  risk_factors: string[]
  performance_prediction: string
}

export interface ScriptSentence {
  sentence_number: number
  purpose: string
  variations: string[]
  recommendation: string
}

export interface ScriptSection {
  timestamp: string
  energy_level: string
  sentences: ScriptSentence[]
  pattern_interrupt_suggestion?: string
}

export interface ScriptHook {
  timestamp: string
  energy_level: string
  visual: string
  text_overlay: string
  spoken: string
  notes: string
}

export interface SentenceFeedback {
  your_choice: string
  assessment: string
  why_it_works: string
  alternative_suggestion?: string
  keep_or_swap: string
}

export interface OverallAssessment {
  flow_quality: number
  authenticity: number
  retention_potential: number
  hook_delivery: number
  summary: string
}

export interface FinalCheck {
  status: string
  em_dashes_found?: number
  word_count?: number
  speaking_pace_wpm?: number
  details?: string
}

export interface GoNoGoDecision {
  decision: string
  confidence_level: string
  reasoning: string[]
  final_notes: string
}

export interface IdeaGenerationRequest {
  mode: WorkflowMode
  count?: number
  topic_focus?: string
  risk_tolerance?: string
  video_type?: string
}

export interface HookGenerationRequest {
  session_id?: string
  topic: string
  category?: string
  target_length?: string
  format?: string
  credibility_signals?: string
  target_audience?: string
  count?: number
}

export interface HookAnalysisRequest {
  session_id: string
  generation_id: string
  selected_hook_ids: number[]
  question?: string
}

export interface ScriptGenerationRequest {
  session_id: string
  chosen_hook_id: number
  video_length?: number
  topic: string
  format?: string
  credibility_to_establish?: string
  carter_expertise?: string
}

export interface ScriptAnalysisRequest {
  session_id: string
  chosen_variations: Record<number, number>
  questions?: string[]
}

export interface FinalReviewRequest {
  session_id: string
  finalized_script: string
  chosen_hook: {
    visual: string
    text: string
    verbal: string
  }
  target_length: number
  format: string
}

export interface ContentGapAnalysis {
  topics_you_havent_covered: string[]
  trending_topics_in_your_niche: string[]
}

export interface BalanceRecommendation {
  safe_bets: number
  experimental: number
  rationale: string
}

export interface IdeaGenerationResponse {
  session_id: string
  ideas: TikTokIdea[]
  content_gap_analysis: ContentGapAnalysis
  balance_recommendation: BalanceRecommendation
}

export interface HookGenerationAnalysis {
  strongest_credibility_signals: number[]
  highest_curiosity_drivers: number[]
  best_fomo_elements: number[]
  most_authentic_to_carter_voice: number[]
  recommendation: string
}

export interface HookGenerationResponse {
  generation_id: string
  session_id: string
  hooks: TikTokHook[]
  hook_analysis: HookGenerationAnalysis
}

export interface HookRecommendation {
  best_choice: string
  reasoning: string
  suggested_tweak?: string
  runner_up: string
  runner_up_reasoning: string
}

export interface NoneFeelRight {
  none_are_strong: boolean
  all_three_are_solid: boolean
  suggestion: string
}

export interface HookAnalysisResponse {
  generation_id: string
  session_id: string
  analysis: Record<string, HookAnalysis>
  recommendation: HookRecommendation
  if_none_feel_right: NoneFeelRight
}

export interface FullScriptAssembled {
  recommended_version: string
  full_text: string
  word_count: number
  estimated_speaking_time: string
  fits_target_length: boolean
}

export interface PacingNotes {
  overall_rhythm: string
  energy_progression: string[]
  suggested_emphasis: string[]
}

export interface AIDetectionCheck {
  em_dashes_found: number
  ai_language_patterns: string[]
  authenticity_score: number
  recommendation: string
}

export interface ScriptGenerationResponse {
  generation_id: string
  session_id: string
  script: {
    hook: ScriptHook
    context_building: ScriptSection
    core_delivery: ScriptSection
    key_revelation: ScriptSection
    cta: ScriptSection
  }
  full_script_assembled: FullScriptAssembled
  pacing_notes: PacingNotes
  ai_detection_check: AIDetectionCheck
}

export interface FlowAnalysis {
  transitions: string
  rhythm: string
  narrative_arc: string
}

export interface RetentionPrediction {
  first_3_seconds: string
  mid_video: string
  full_video: string
  drop_off_risk_points: string[]
}

export interface EngagementPrediction {
  views: string
  likes: string
  comments: string
  shares: string
  save_rate: string
}

export interface RecommendedChangesSummary {
  keep_as_is: string[]
  consider_swapping: string[]
  must_change: string[]
}

export interface FinalRecommendation {
  ready_to_record: boolean
  confidence_level: string
  notes: string
}

export interface ScriptAnalysisResponse {
  generation_id: string
  session_id: string
  overall_assessment: OverallAssessment
  sentence_by_sentence_feedback: Record<string, SentenceFeedback>
  flow_analysis: FlowAnalysis
  retention_prediction: RetentionPrediction
  engagement_prediction: EngagementPrediction
  recommended_changes_summary: RecommendedChangesSummary
  final_recommendation: FinalRecommendation
}

export interface FinalChecks {
  ai_detection: FinalCheck
  speaking_pace: FinalCheck
  pattern_interrupts: FinalCheck
  energy_progression: FinalCheck
  hook_delivery: FinalCheck
}

export interface RecordingNotes {
  emphasis_words: string[]
  pause_points: string[]
  energy_guidance: Record<string, string>
  camera_angles: Record<string, string>
}

export interface PerformancePrediction {
  retention_estimate: {
    first_3_seconds: string
    full_video: string
  }
  engagement_estimate: {
    views: string
    likes: string
    comments: string
    shares: string
  }
  virality_potential: {
    score: number
    reasoning: string
  }
}

export interface ComparisonToPastVideos {
  similar_videos: string[]
  predicted_ranking: string
  improvement_areas: string[]
}

export interface FinalReviewResponse {
  generation_id: string
  session_id: string
  final_checks: FinalChecks
  recording_notes: RecordingNotes
  performance_prediction: PerformancePrediction
  comparison_to_past_videos: ComparisonToPastVideos
  go_no_go_decision: GoNoGoDecision
}

export interface WorkflowSession {
  session_id: string
  platform: string
  mode: WorkflowMode
  current_stage: WorkflowStage
  initial_idea?: string
  created_at: string
  updated_at: string
}
