// ===================
// © AngelaMos | 2025
// tracker.enums.ts
// ===================

import type { PlatformInfo, PlatformKey } from './tracker.types'

export const PLATFORM_INFO: Record<PlatformKey, PlatformInfo> = {
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TikTok',
    dailyTarget: 5,
  },
  instagram_reels: {
    key: 'instagram_reels',
    label: 'Instagram',
    shortLabel: 'Instagram',
    dailyTarget: 5,
  },
  youtube_shorts: {
    key: 'youtube_shorts',
    label: 'YT Shorts',
    shortLabel: 'YT Shorts',
    dailyTarget: 5,
  },
  reddit: {
    key: 'reddit',
    label: 'Reddit',
    shortLabel: 'Reddit',
    dailyTarget: 1,
  },
  linkedin_personal: {
    key: 'linkedin_personal',
    label: 'LinkedIn',
    shortLabel: 'LinkedIn',
    dailyTarget: 1,
  },
} as const

export const PLATFORM_KEYS: PlatformKey[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'reddit',
  'linkedin_personal',
] as const

export const CHALLENGE_DEFAULTS = {
  CONTENT_GOAL: 450,
  JOBS_GOAL: 150,
  DURATION_DAYS: 30,
  DAILY_CONTENT_TARGET: 17,
  DAILY_JOBS_TARGET: 5,
} as const

export enum TrackerTab {
  DASHBOARD = 'dashboard',
  ALL_DAYS = 'all_days',
}

const API_VERSION = 'v1'

export const CHALLENGE_API = {
  ACTIVE: `/${API_VERSION}/challenge/active`,
  START: `/${API_VERSION}/challenge/start`,
  HISTORY: `/${API_VERSION}/challenge/history`,
  LOGS: {
    CREATE: `/${API_VERSION}/challenge/logs`,
    BY_DATE: (date: string) => `/${API_VERSION}/challenge/logs/${date}`,
    UPDATE: (date: string) => `/${API_VERSION}/challenge/logs/${date}`,
  },
} as const
