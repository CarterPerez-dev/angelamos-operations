// ===================
// © AngelaMos | 2025
// tiktok.enums.ts
// ===================

export enum WorkflowMode {
  GIVE_ME_IDEAS = 'give_me_ideas',
  I_HAVE_IDEA = 'i_have_idea',
}

export enum WorkflowStage {
  MODE_SELECTION = 'mode_selection',
  IDEAS = 'ideas',
  HOOKS = 'hooks',
  HOOK_ANALYSIS = 'hook_analysis',
  SCRIPT = 'script',
  SCRIPT_ANALYSIS = 'script_analysis',
  FINAL_REVIEW = 'final_review',
}

export enum GeneratedContentStatus {
  GENERATED = 'generated',
  USER_MODIFIED = 'user_modified',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PlatformType {
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  REDDIT = 'reddit',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
}

export const TIKTOK_API = {
  IDEAS: '/v1/content-studio/tiktok/ideas',
  HOOKS: '/v1/content-studio/tiktok/hooks',
  HOOKS_ANALYZE: '/content-studio/tiktok/hooks/analyze',
  SCRIPT: '/v1/content-studio/tiktok/script',
  SCRIPT_ANALYZE: '/content-studio/tiktok/script/analyze',
  REVIEW: '/v1/content-studio/tiktok/review',
} as const

export const STAGE_ORDER: WorkflowStage[] = [
  WorkflowStage.MODE_SELECTION,
  WorkflowStage.IDEAS,
  WorkflowStage.HOOKS,
  WorkflowStage.HOOK_ANALYSIS,
  WorkflowStage.SCRIPT,
  WorkflowStage.SCRIPT_ANALYSIS,
  WorkflowStage.FINAL_REVIEW,
]

export const STAGE_TITLES: Record<WorkflowStage, string> = {
  [WorkflowStage.MODE_SELECTION]: 'Choose Your Path',
  [WorkflowStage.IDEAS]: 'Idea Generation',
  [WorkflowStage.HOOKS]: 'Hook Generation',
  [WorkflowStage.HOOK_ANALYSIS]: 'Hook Analysis',
  [WorkflowStage.SCRIPT]: 'Script Generation',
  [WorkflowStage.SCRIPT_ANALYSIS]: 'Script Analysis',
  [WorkflowStage.FINAL_REVIEW]: 'Final Review',
}

export const STAGE_DESCRIPTIONS: Record<WorkflowStage, string> = {
  [WorkflowStage.MODE_SELECTION]: 'Start with AI-generated ideas or bring your own topic',
  [WorkflowStage.IDEAS]: 'AI generates 10 video ideas based on your skills and past performance',
  [WorkflowStage.HOOKS]: 'AI generates 20 hook variations for your chosen topic',
  [WorkflowStage.HOOK_ANALYSIS]: 'AI analyzes your top 3-5 hook choices with pros and cons',
  [WorkflowStage.SCRIPT]: 'AI generates your script with 10 variations per sentence',
  [WorkflowStage.SCRIPT_ANALYSIS]: 'AI reviews your assembled script for flow and retention',
  [WorkflowStage.FINAL_REVIEW]: 'Final checks and GO/NO-GO decision before recording',
}

export const LOADING_MESSAGES: Record<WorkflowStage, string> = {
  [WorkflowStage.MODE_SELECTION]: '',
  [WorkflowStage.IDEAS]: 'Analyzing your skills, interests, and past performance to generate 10 video ideas...',
  [WorkflowStage.HOOKS]: 'Crafting 20 hook variations using proven formulas and your brand voice...',
  [WorkflowStage.HOOK_ANALYSIS]: 'Deep diving into your chosen hooks to find the strongest performer...',
  [WorkflowStage.SCRIPT]: 'Writing your script with 10 variations per sentence for maximum flexibility...',
  [WorkflowStage.SCRIPT_ANALYSIS]: 'Analyzing flow, pacing, retention triggers, and engagement potential...',
  [WorkflowStage.FINAL_REVIEW]: 'Running final checks on AI detection, pacing, and performance prediction...',
}

export const DEFAULT_HOOK_COUNT = 20
export const DEFAULT_IDEA_COUNT = 10
export const DEFAULT_VIDEO_LENGTH = 30
export const MIN_VIDEO_LENGTH = 15
export const MAX_VIDEO_LENGTH = 90
export const MIN_SELECTED_HOOKS = 1
export const MAX_SELECTED_HOOKS = 5
export const VARIATIONS_PER_SENTENCE = 10
