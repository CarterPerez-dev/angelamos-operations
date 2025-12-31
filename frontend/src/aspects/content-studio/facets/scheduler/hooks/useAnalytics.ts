// ===================
// © AngelaMos | 2025
// useAnalytics.ts
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/core/api'
import { API_ENDPOINTS, QUERY_KEYS } from '@/config'
import { useSchedulerStore } from '../stores'
import type {
  AnalyticsOverview,
  PostAnalytics,
  FollowerGrowthResponse,
  FollowerStats,
  BestTimesResponse,
  SyncResponse,
} from '../types'
import type { PlatformType } from '../types/scheduler.enums'

interface AnalyticsParams {
  platform?: PlatformType
  days?: number
  limit?: number
}

const fetchAnalyticsOverview = async (days = 30): Promise<AnalyticsOverview> => {
  const response = await apiClient.get<AnalyticsOverview>(
    `${API_ENDPOINTS.SCHEDULER.ANALYTICS.OVERVIEW}?days=${days}`
  )
  return response.data
}

export const useAnalyticsOverview = (
  days = 30
): UseQueryResult<AnalyticsOverview, Error> => {
  const setAnalytics = useSchedulerStore((s) => s.setAnalytics)
  const setLoadingAnalytics = useSchedulerStore((s) => s.setLoadingAnalytics)

  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.OVERVIEW(days),
    queryFn: async () => {
      setLoadingAnalytics(true)
      try {
        const data = await fetchAnalyticsOverview(days)
        setAnalytics(data)
        return data
      } finally {
        setLoadingAnalytics(false)
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}

const fetchPostAnalytics = async (
  params: AnalyticsParams = {}
): Promise<PostAnalytics[]> => {
  const queryParams = new URLSearchParams()
  if (params.platform) queryParams.append('platform', params.platform)
  if (params.days) queryParams.append('days', params.days.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString()
    ? `${API_ENDPOINTS.SCHEDULER.ANALYTICS.POSTS}?${queryParams}`
    : API_ENDPOINTS.SCHEDULER.ANALYTICS.POSTS

  const response = await apiClient.get<PostAnalytics[]>(url)
  return response.data
}

export const usePostAnalytics = (
  params: AnalyticsParams = {}
): UseQueryResult<PostAnalytics[], Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.POSTS({
      platform: params.platform,
      days: params.days,
    }),
    queryFn: () => fetchPostAnalytics(params),
    staleTime: 1000 * 60 * 5,
  })
}

const fetchTopPerformers = async (
  params: AnalyticsParams = {}
): Promise<PostAnalytics[]> => {
  const queryParams = new URLSearchParams()
  if (params.platform) queryParams.append('platform', params.platform)
  if (params.days) queryParams.append('days', params.days.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString()
    ? `${API_ENDPOINTS.SCHEDULER.ANALYTICS.TOP}?${queryParams}`
    : API_ENDPOINTS.SCHEDULER.ANALYTICS.TOP

  const response = await apiClient.get<PostAnalytics[]>(url)
  return response.data
}

export const useTopPerformers = (
  params: AnalyticsParams = {}
): UseQueryResult<PostAnalytics[], Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.TOP({
      platform: params.platform,
      days: params.days,
      limit: params.limit,
    }),
    queryFn: () => fetchTopPerformers(params),
    staleTime: 1000 * 60 * 5,
  })
}

const fetchBestTimes = async (
  params: { platform?: PlatformType; days?: number } = {}
): Promise<BestTimesResponse> => {
  const queryParams = new URLSearchParams()
  if (params.platform) queryParams.append('platform', params.platform)
  if (params.days) queryParams.append('days', params.days.toString())

  const url = queryParams.toString()
    ? `${API_ENDPOINTS.SCHEDULER.ANALYTICS.BEST_TIMES}?${queryParams}`
    : API_ENDPOINTS.SCHEDULER.ANALYTICS.BEST_TIMES

  const response = await apiClient.get<BestTimesResponse>(url)
  return response.data
}

export const useBestTimes = (
  params: { platform?: PlatformType; days?: number } = {}
): UseQueryResult<BestTimesResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.BEST_TIMES({
      platform: params.platform,
      days: params.days,
    }),
    queryFn: () => fetchBestTimes(params),
    staleTime: 1000 * 60 * 15,
  })
}

const fetchFollowerGrowth = async (
  accountId: string,
  days = 30
): Promise<FollowerGrowthResponse> => {
  const response = await apiClient.get<FollowerGrowthResponse>(
    `${API_ENDPOINTS.SCHEDULER.ANALYTICS.FOLLOWERS(accountId)}?days=${days}`
  )
  return response.data
}

export const useFollowerGrowth = (
  accountId: string | null,
  days = 30
): UseQueryResult<FollowerGrowthResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.FOLLOWERS(accountId ?? '', days),
    queryFn: () => fetchFollowerGrowth(accountId!, days),
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
  })
}

const syncAnalytics = async (days = 7): Promise<SyncResponse> => {
  const response = await apiClient.post<SyncResponse>(
    `${API_ENDPOINTS.SCHEDULER.ANALYTICS.SYNC}?days=${days}`
  )
  return response.data
}

export const useSyncAnalytics = (): UseMutationResult<
  SyncResponse,
  Error,
  number | undefined
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (days?: number) => syncAnalytics(days),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(),
      })
      if (data.synced > 0) {
        toast.success(`Synced analytics for ${data.synced} post(s)`)
      }
      if (data.failed > 0) {
        toast.warning(`Failed to sync ${data.failed} post(s)`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync analytics')
    },
  })
}

const syncFollowerStats = async (): Promise<SyncResponse> => {
  const response = await apiClient.post<SyncResponse>(
    API_ENDPOINTS.SCHEDULER.ANALYTICS.SYNC_FOLLOWERS
  )
  return response.data
}

export const useSyncFollowerStats = (): UseMutationResult<
  SyncResponse,
  Error,
  void
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncFollowerStats,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(),
      })
      if (data.synced > 0) {
        toast.success(`Synced follower stats for ${data.synced} account(s)`)
      }
      if (data.failed > 0) {
        toast.warning(`Failed to sync ${data.failed} account(s)`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync follower stats')
    },
  })
}

const fetchFollowerHistory = async (days = 30): Promise<FollowerStats[]> => {
  const response = await apiClient.get<FollowerStats[]>(
    `${API_ENDPOINTS.SCHEDULER.ANALYTICS.FOLLOWERS_HISTORY}?days=${days}`
  )
  return response.data
}

export const useFollowerHistory = (
  days = 30
): UseQueryResult<FollowerStats[], Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.FOLLOWERS_HISTORY(days),
    queryFn: () => fetchFollowerHistory(days),
    staleTime: 1000 * 60 * 5,
  })
}

interface RecordFollowerStatsInput {
  connected_account_id: string
  follower_count: number
  recorded_date?: string
}

const recordFollowerStats = async (
  data: RecordFollowerStatsInput
): Promise<FollowerStats> => {
  const response = await apiClient.post<FollowerStats>(
    API_ENDPOINTS.SCHEDULER.ANALYTICS.RECORD_FOLLOWERS,
    data
  )
  return response.data
}

export const useRecordFollowerStats = (): UseMutationResult<
  FollowerStats,
  Error,
  RecordFollowerStatsInput
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordFollowerStats,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(),
      })
      toast.success('Follower count saved')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save follower count')
    },
  })
}
