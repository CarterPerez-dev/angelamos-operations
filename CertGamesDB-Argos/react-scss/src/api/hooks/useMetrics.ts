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
  ConversionTrendSchema,
  WeeklyCohortTrendSchema,
  TimeToConversionSchema,
  type DashboardMetrics,
  type SlowQueryReport,
  type SlowQueryAnalysis,
  type ProfilingStatus,
  type SetProfilingRequest,
  type ConversionTrend,
  type WeeklyCohortTrend,
  type TimeToConversion,
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

export function useConversionRolling(limit?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.CONVERSION_ROLLING(limit),
    queryFn: async (): Promise<ConversionTrend> => {
      const params = new URLSearchParams()
      if (limit) params.append('limit', String(limit))
      const url = params.toString()
        ? `${API_ENDPOINTS.METRICS.CONVERSION_ROLLING}?${params}`
        : API_ENDPOINTS.METRICS.CONVERSION_ROLLING
      const { data } = await apiClient.get(url)
      return parseApiResponse(ConversionTrendSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
  })
}

export function useConversionWeekly(weeks?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.CONVERSION_WEEKLY(weeks),
    queryFn: async (): Promise<WeeklyCohortTrend> => {
      const params = new URLSearchParams()
      if (weeks) params.append('weeks', String(weeks))
      const url = params.toString()
        ? `${API_ENDPOINTS.METRICS.CONVERSION_WEEKLY}?${params}`
        : API_ENDPOINTS.METRICS.CONVERSION_WEEKLY
      const { data } = await apiClient.get(url)
      return parseApiResponse(WeeklyCohortTrendSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
  })
}

export function useTimeToConversion() {
  return useQuery({
    queryKey: QUERY_KEYS.METRICS.TIME_TO_CONVERSION(),
    queryFn: async (): Promise<TimeToConversion> => {
      const { data } = await apiClient.get(API_ENDPOINTS.METRICS.TIME_TO_CONVERSION)
      return parseApiResponse(TimeToConversionSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.METRICS,
  })
}
