// ===================
// © AngelaMos | 2025
// tracker.types.ts
// ===================

export interface ChallengeLog {
  id: string
  challenge_id: string
  log_date: string
  day_number: number
  tiktok: number
  instagram_reels: number
  youtube_shorts: number
  twitter: number
  reddit: number
  linkedin_personal: number
  linkedin_company: number
  youtube_full: number
  medium: number
  jobs_applied: number
  total_content: number
  created_at: string
  updated_at: string | null
}

export interface Challenge {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  content_goal: number
  jobs_goal: number
  created_at: string
  updated_at: string | null
}

export interface ChallengeWithStats extends Challenge {
  total_content: number
  total_jobs: number
  current_day: number
  content_percentage: number
  jobs_percentage: number
  logs: ChallengeLog[]
}

export interface ChallengeHistoryResponse {
  items: Challenge[]
  total: number
}

export interface ChallengeStartRequest {
  start_date?: string
  content_goal?: number
  jobs_goal?: number
}

export interface LogCreateRequest {
  log_date?: string
  tiktok?: number
  instagram_reels?: number
  youtube_shorts?: number
  twitter?: number
  reddit?: number
  linkedin_personal?: number
  linkedin_company?: number
  youtube_full?: number
  medium?: number
  jobs_applied?: number
}

export interface LogUpdateRequest {
  tiktok?: number
  instagram_reels?: number
  youtube_shorts?: number
  twitter?: number
  reddit?: number
  linkedin_personal?: number
  linkedin_company?: number
  youtube_full?: number
  medium?: number
  jobs_applied?: number
}

export type PlatformKey =
  | 'tiktok'
  | 'instagram_reels'
  | 'youtube_shorts'
  | 'twitter'
  | 'reddit'
  | 'linkedin_personal'
  | 'linkedin_company'
  | 'youtube_full'
  | 'medium'

export interface PlatformInfo {
  key: PlatformKey
  label: string
  shortLabel: string
  dailyTarget: number
}
