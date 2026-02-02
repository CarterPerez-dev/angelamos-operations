// ===================
// © AngelaMos | 2026
// useInsights.ts
// ===================

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/core/api/api.config'
import { API_ENDPOINTS } from '@/config'
import type {
  OverviewInsights,
  PerformanceRankings,
  HookInsights,
  CTAInsights,
  TrafficSourceInsights,
  SearchQueryInsights,
  CommentWordInsights,
  VideoLengthInsights,
  HashtagInsights,
  PostingTimeInsights,
  TimeSeriesInsights,
  ExportData,
} from '../types'

const QUERY_KEYS = {
  overview: ['analytics', 'insights', 'overview'] as const,
  rankings: (limit: number) => ['analytics', 'insights', 'rankings', limit] as const,
  hooks: (limit: number) => ['analytics', 'insights', 'hooks', limit] as const,
  ctas: (limit: number) => ['analytics', 'insights', 'ctas', limit] as const,
  trafficSources: ['analytics', 'insights', 'traffic-sources'] as const,
  searchQueries: (limit: number) => ['analytics', 'insights', 'search-queries', limit] as const,
  commentWords: (limit: number) => ['analytics', 'insights', 'comment-words', limit] as const,
  videoLength: ['analytics', 'insights', 'video-length'] as const,
  hashtags: (limit: number) => ['analytics', 'insights', 'hashtags', limit] as const,
  postingTime: ['analytics', 'insights', 'posting-time'] as const,
  timeSeries: ['analytics', 'insights', 'time-series'] as const,
  export: ['analytics', 'insights', 'export'] as const,
}

export function useOverviewInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.overview,
    queryFn: async () => {
      const { data } = await apiClient.get<OverviewInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.OVERVIEW
      )
      return data
    },
  })
}

export function usePerformanceRankings(limit: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.rankings(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<PerformanceRankings>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.RANKINGS,
        { params: { limit } }
      )
      return data
    },
  })
}

export function useHookInsights(limit: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.hooks(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<HookInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.HOOKS,
        { params: { limit } }
      )
      return data
    },
  })
}

export function useCTAInsights(limit: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.ctas(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<CTAInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.CTAS,
        { params: { limit } }
      )
      return data
    },
  })
}

export function useTrafficSourceInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.trafficSources,
    queryFn: async () => {
      const { data } = await apiClient.get<TrafficSourceInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.TRAFFIC_SOURCES
      )
      return data
    },
  })
}

export function useSearchQueryInsights(limit: number = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.searchQueries(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<SearchQueryInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.SEARCH_QUERIES,
        { params: { limit } }
      )
      return data
    },
  })
}

export function useCommentWordInsights(limit: number = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.commentWords(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<CommentWordInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.COMMENT_WORDS,
        { params: { limit } }
      )
      return data
    },
  })
}

export function useVideoLengthInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.videoLength,
    queryFn: async () => {
      const { data } = await apiClient.get<VideoLengthInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.VIDEO_LENGTH
      )
      return data
    },
  })
}

export function useHashtagInsights(limit: number = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.hashtags(limit),
    queryFn: async () => {
      const { data } = await apiClient.get<HashtagInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.HASHTAGS,
        { params: { limit } }
      )
      return data
    },
  })
}

export function usePostingTimeInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.postingTime,
    queryFn: async () => {
      const { data } = await apiClient.get<PostingTimeInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.POSTING_TIME
      )
      return data
    },
  })
}

export function useTimeSeriesInsights() {
  return useQuery({
    queryKey: QUERY_KEYS.timeSeries,
    queryFn: async () => {
      const { data } = await apiClient.get<TimeSeriesInsights>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.TIME_SERIES
      )
      return data
    },
  })
}

export function useExportData() {
  return useQuery({
    queryKey: QUERY_KEYS.export,
    queryFn: async () => {
      const { data } = await apiClient.get<ExportData>(
        API_ENDPOINTS.ANALYTICS.INSIGHTS.EXPORT
      )
      return data
    },
    enabled: false, // Only fetch when manually triggered
  })
}

export async function downloadExport() {
  const response = await apiClient.get(
    API_ENDPOINTS.ANALYTICS.INSIGHTS.EXPORT_DOWNLOAD
  )

  const blob = new Blob([JSON.stringify(response.data, null, 2)], {
    type: 'application/json',
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tiktok-analytics-${new Date().toISOString()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
