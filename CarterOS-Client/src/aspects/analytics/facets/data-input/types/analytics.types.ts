// ===================
// © AngelaMos | 2026
// analytics.types.ts
// ===================

import { z } from 'zod'

export const tiktokVideoSchema = z.object({
  id: z.string().uuid(),
  rank: z.number().int().positive(),
  date_posted: z.string(),
  video_url: z.string().nullable(),

  views: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  bookmarks: z.number().int().nonnegative(),
  shares: z.number().int().nonnegative(),
  avg_watch_time: z.number().nonnegative(),
  new_followers: z.number().int().nonnegative(),
  watched_full_video_percentage: z.number().nonnegative(),

  top_comment_words: z.record(z.string(), z.number()).nullable(),
  search_queries: z.record(z.string(), z.number()).nullable(),
  traffic_sources: z.record(z.string(), z.number()).nullable(),

  hook: z.string(),
  text_on_screen_hook: z.string().nullable(),
  length: z.number().positive(),
  description: z.string(),
  hashtags: z.array(z.string()).nullable(),
  cta: z.string().nullable(),
  full_transcription: z.string().nullable(),
  notes: z.string().nullable(),

  created_at: z.string(),
  updated_at: z.string().nullable(),
})

export const tiktokVideoListResponseSchema = z.object({
  items: z.array(tiktokVideoSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
})

export type TikTokVideo = z.infer<typeof tiktokVideoSchema>
export type TikTokVideoListResponse = z.infer<
  typeof tiktokVideoListResponseSchema
>

export interface TikTokVideoCreate {
  rank: number
  date_posted: string
  video_url?: string

  views: number
  comments: number
  likes: number
  bookmarks: number
  shares: number
  avg_watch_time: number
  new_followers: number
  watched_full_video_percentage: number

  top_comment_words?: Record<string, number>
  search_queries?: Record<string, number>
  traffic_sources?: Record<string, number>

  hook: string
  text_on_screen_hook?: string
  length: number
  description: string
  hashtags?: string[]
  cta?: string
  full_transcription?: string
  notes?: string
}

export interface TikTokVideoUpdate {
  rank?: number
  date_posted?: string
  video_url?: string

  views?: number
  comments?: number
  likes?: number
  bookmarks?: number
  shares?: number
  avg_watch_time?: number
  new_followers?: number
  watched_full_video_percentage?: number

  top_comment_words?: Record<string, number>
  search_queries?: Record<string, number>
  traffic_sources?: Record<string, number>

  hook?: string
  text_on_screen_hook?: string
  length?: number
  description?: string
  hashtags?: string[]
  cta?: string
  full_transcription?: string
  notes?: string
}

export const isValidTikTokVideo = (data: unknown): data is TikTokVideo => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return tiktokVideoSchema.safeParse(data).success
}

export const isValidTikTokVideoListResponse = (
  data: unknown
): data is TikTokVideoListResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return tiktokVideoListResponseSchema.safeParse(data).success
}

export interface VideoFilters {
  searchQuery?: string
  startDate?: string
  endDate?: string
  minViews?: number
}
