// ===================
// © AngelaMos | 2025
// tiktok.guards.ts
// ===================

import type {
  TikTokIdea,
  TikTokHook,
  HookAnalysis,
  IdeaGenerationResponse,
  HookGenerationResponse,
  HookAnalysisResponse,
  ScriptGenerationResponse,
  ScriptAnalysisResponse,
  FinalReviewResponse,
} from './tiktok.types'

export function isTikTokIdea(data: unknown): data is TikTokIdea {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.id === 'number' &&
    typeof obj.topic === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.risk_level === 'string' &&
    typeof obj.reasoning === 'object' &&
    Array.isArray(obj.example_hooks) &&
    typeof obj.estimated_engagement === 'string' &&
    typeof obj.video_length_target === 'string' &&
    typeof obj.format === 'string'
  )
}

export function isTikTokHook(data: unknown): data is TikTokHook {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.id === 'number' &&
    typeof obj.visual_hook === 'string' &&
    typeof obj.text_hook === 'string' &&
    typeof obj.verbal_hook === 'string' &&
    typeof obj.word_count === 'number' &&
    Array.isArray(obj.hook_formulas_used) &&
    typeof obj.reasoning === 'string'
  )
}

export function isHookAnalysis(data: unknown): data is HookAnalysis {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.hook_id === 'number' &&
    typeof obj.credibility === 'object' &&
    typeof obj.curiosity === 'object' &&
    typeof obj.fomo === 'object' &&
    Array.isArray(obj.pros) &&
    Array.isArray(obj.cons) &&
    typeof obj.performance_prediction === 'string'
  )
}

export function isIdeaGenerationResponse(data: unknown): data is IdeaGenerationResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.session_id === 'string' &&
    Array.isArray(obj.ideas) &&
    obj.ideas.every((idea: unknown) => isTikTokIdea(idea)) &&
    typeof obj.content_gap_analysis === 'object' &&
    typeof obj.balance_recommendation === 'object'
  )
}

export function isHookGenerationResponse(data: unknown): data is HookGenerationResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.generation_id === 'string' &&
    typeof obj.session_id === 'string' &&
    Array.isArray(obj.hooks) &&
    obj.hooks.every((hook: unknown) => isTikTokHook(hook)) &&
    typeof obj.hook_analysis === 'object'
  )
}

export function isHookAnalysisResponse(data: unknown): data is HookAnalysisResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.generation_id === 'string' &&
    typeof obj.session_id === 'string' &&
    typeof obj.analysis === 'object' &&
    typeof obj.recommendation === 'object' &&
    typeof obj.if_none_feel_right === 'object'
  )
}

export function isScriptGenerationResponse(data: unknown): data is ScriptGenerationResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.generation_id === 'string' &&
    typeof obj.session_id === 'string' &&
    typeof obj.script === 'object' &&
    typeof obj.full_script_assembled === 'object' &&
    typeof obj.pacing_notes === 'object' &&
    typeof obj.ai_detection_check === 'object'
  )
}

export function isScriptAnalysisResponse(data: unknown): data is ScriptAnalysisResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.generation_id === 'string' &&
    typeof obj.session_id === 'string' &&
    typeof obj.overall_assessment === 'object' &&
    typeof obj.sentence_by_sentence_feedback === 'object' &&
    typeof obj.flow_analysis === 'object' &&
    typeof obj.retention_prediction === 'object' &&
    typeof obj.final_recommendation === 'object'
  )
}

export function isFinalReviewResponse(data: unknown): data is FinalReviewResponse {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.generation_id === 'string' &&
    typeof obj.session_id === 'string' &&
    typeof obj.final_checks === 'object' &&
    typeof obj.recording_notes === 'object' &&
    typeof obj.performance_prediction === 'object' &&
    typeof obj.go_no_go_decision === 'object'
  )
}
