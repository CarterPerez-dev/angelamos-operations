// ===================
// © AngelaMos | 2025
// tracker.enums.ts
// ===================

import type { PlatformInfo, PlatformKey } from './tracker.types'

export const PLATFORM_INFO: Record<PlatformKey, PlatformInfo> = {
  tiktok: {
    key: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TT',
    dailyTarget: 10,
  },
  instagram_reels: {
    key: 'instagram_reels',
    label: 'Instagram Reels',
    shortLabel: 'IG',
    dailyTarget: 10,
  },
  youtube_shorts: {
    key: 'youtube_shorts',
    label: 'YouTube Shorts',
    shortLabel: 'YT',
    dailyTarget: 10,
  },
  twitter: {
    key: 'twitter',
    label: 'Twitter/X',
    shortLabel: 'TW',
    dailyTarget: 10,
  },
  reddit: {
    key: 'reddit',
    label: 'Reddit',
    shortLabel: 'RD',
    dailyTarget: 5,
  },
  linkedin_personal: {
    key: 'linkedin_personal',
    label: 'LinkedIn (Personal)',
    shortLabel: 'LI-P',
    dailyTarget: 1,
  },
  linkedin_company: {
    key: 'linkedin_company',
    label: 'LinkedIn (Company)',
    shortLabel: 'LI-C',
    dailyTarget: 1,
  },
  youtube_full: {
    key: 'youtube_full',
    label: 'YouTube (Full)',
    shortLabel: 'YT-F',
    dailyTarget: 1,
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    shortLabel: 'MED',
    dailyTarget: 1,
  },
} as const

export const PLATFORM_KEYS: PlatformKey[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'twitter',
  'reddit',
  'linkedin_personal',
  'linkedin_company',
  'youtube_full',
  'medium',
] as const

export const CHALLENGE_DEFAULTS = {
  CONTENT_GOAL: 1500,
  JOBS_GOAL: 1000,
  DURATION_DAYS: 30,
  DAILY_CONTENT_TARGET: 50,
  DAILY_JOBS_TARGET: 34,
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
