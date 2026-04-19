// ===================
// © AngelaMos | 2026
// useAnalytics.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_ENDPOINTS } from '@/config'
import { apiClient } from '@/core/api/api.config'
import type {
  TikTokVideo,
  TikTokVideoCreate,
  TikTokVideoListResponse,
  TikTokVideoUpdate,
} from '../types/analytics.types'

const QUERY_KEYS = {
  videos: (page: number, pageSize: number) =>
    ['analytics', 'videos', page, pageSize] as const,
  video: (id: string) => ['analytics', 'videos', id] as const,
}

export function useVideos(page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.videos(page, pageSize),
    queryFn: async () => {
      const { data } = await apiClient.get<TikTokVideoListResponse>(
        API_ENDPOINTS.ANALYTICS.VIDEOS,
        { params: { page, page_size: pageSize } }
      )
      return data
    },
  })
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.video(id),
    queryFn: async () => {
      const { data } = await apiClient.get<TikTokVideo>(
        API_ENDPOINTS.ANALYTICS.VIDEO(id)
      )
      return data
    },
    enabled: !!id,
  })
}

export function useCreateVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TikTokVideoCreate) => {
      const { data: result } = await apiClient.post<TikTokVideo>(
        API_ENDPOINTS.ANALYTICS.VIDEOS,
        data
      )
      return result
    },
    onSuccess: (newVideo) => {
      const queries = queryClient.getQueriesData<TikTokVideoListResponse>({
        queryKey: ['analytics', 'videos'],
      })

      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<TikTokVideoListResponse>(key, {
            ...data,
            items: [newVideo, ...data.items],
            total: data.total + 1,
          })
        }
      }
    },
  })
}

export function useUpdateVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TikTokVideoUpdate }) => {
      const { data: result } = await apiClient.put<TikTokVideo>(
        API_ENDPOINTS.ANALYTICS.VIDEO(id),
        data
      )
      return result
    },
    onSuccess: (updatedVideo) => {
      const queries = queryClient.getQueriesData<TikTokVideoListResponse>({
        queryKey: ['analytics', 'videos'],
      })

      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<TikTokVideoListResponse>(key, {
            ...data,
            items: data.items.map((v) =>
              v.id === updatedVideo.id ? updatedVideo : v
            ),
          })
        }
      }

      queryClient.setQueryData(QUERY_KEYS.video(updatedVideo.id), updatedVideo)
    },
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.ANALYTICS.VIDEO(id))
      return id
    },
    onSuccess: (deletedId) => {
      const queries = queryClient.getQueriesData<TikTokVideoListResponse>({
        queryKey: ['analytics', 'videos'],
      })

      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<TikTokVideoListResponse>(key, {
            ...data,
            items: data.items.filter((v) => v.id !== deletedId),
            total: data.total - 1,
          })
        }
      }

      queryClient.removeQueries({ queryKey: QUERY_KEYS.video(deletedId) })
    },
  })
}

export function useSearchVideos(searchQuery: string) {
  return useQuery({
    queryKey: ['analytics', 'videos', 'search', searchQuery] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<TikTokVideo[]>(
        API_ENDPOINTS.ANALYTICS.SEARCH,
        { params: { q: searchQuery } }
      )
      return data
    },
    enabled: searchQuery.length > 0,
  })
}

export function useFilterByDateRange(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'videos', 'date-range', startDate, endDate] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<TikTokVideo[]>(
        API_ENDPOINTS.ANALYTICS.FILTER_DATE_RANGE,
        { params: { start_date: startDate, end_date: endDate } }
      )
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

export function useFilterByMinViews(minViews?: number) {
  return useQuery({
    queryKey: ['analytics', 'videos', 'min-views', minViews] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<TikTokVideo[]>(
        API_ENDPOINTS.ANALYTICS.FILTER_MIN_VIEWS,
        { params: { min_views: minViews } }
      )
      return data
    },
    enabled: minViews !== undefined && minViews >= 0,
  })
}
