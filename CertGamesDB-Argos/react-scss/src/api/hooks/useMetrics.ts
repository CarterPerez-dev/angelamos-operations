// ===================
// AngelaMos | 2026
// useMetrics.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/core/api'
import { API_ENDPOINTS, QUERY_CONFIG, QUERY_KEYS } from '@/config'
import {
  parseApiResponse,
  DashboardMetricsSchema,
  SlowQueryReportSchema,
  SlowQueryAnalysisSchema,
  ProfilingStatusSchema,
  type DashboardMetrics,
  type SlowQueryReport,
  type SlowQueryAnalysis,
  type ProfilingStatus,
  type SetProfilingRequest,
} from '../types'

export function useMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.DASHBOARD(),
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data } = await apiClient.get(API_ENDPOINTS.METRICS.DASHBOARD)
      return parseApiResponse(DashboardMetricsSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVAL.METRICS,
  })
}

export function useSlowQueries(minMillis?: number, limit?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.SLOW_QUERIES(minMillis),
    queryFn: async (): Promise<SlowQueryReport> => {
      const params = new URLSearchParams()
      if (minMillis) params.append('min_millis', String(minMillis))
      if (limit) params.append('limit', String(limit))
      const url = `${API_ENDPOINTS.METRICS.SLOW_QUERIES}?${params}`
      const { data } = await apiClient.get(url)
      return parseApiResponse(SlowQueryReportSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
  })
}

export function useSlowQueryAnalysis(minMillis?: number, limit?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.ANALYSIS(),
    queryFn: async (): Promise<SlowQueryAnalysis> => {
      const params = new URLSearchParams()
      if (minMillis) params.append('min_millis', String(minMillis))
      if (limit) params.append('limit', String(limit))
      const url = `${API_ENDPOINTS.METRICS.ANALYZE}?${params}`
      const { data } = await apiClient.get(url)
      return parseApiResponse(SlowQueryAnalysisSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
  })
}

export function useProfilingStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.PROFILING(),
    queryFn: async (): Promise<ProfilingStatus> => {
      const { data } = await apiClient.get(API_ENDPOINTS.METRICS.PROFILING)
      return parseApiResponse(ProfilingStatusSchema, data)
    },
  })
}

export function useSetProfiling() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: SetProfilingRequest) => {
      const { data } = await apiClient.put(API_ENDPOINTS.METRICS.PROFILING, request)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.METRICS.PROFILING() })
    },
  })
}
