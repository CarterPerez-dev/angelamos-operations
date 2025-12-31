// ===================
// © AngelaMos | 2025
// useTracker.ts
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
import { useTrackerStore } from '../stores/tracker.store'
import type {
  ChallengeWithStats,
  ChallengeHistoryResponse,
  ChallengeStartRequest,
  LogCreateRequest,
  LogUpdateRequest,
  ChallengeLog,
} from '../types/tracker.types'

const fetchActiveChallenge = async (): Promise<ChallengeWithStats> => {
  const response = await apiClient.get<ChallengeWithStats>(
    API_ENDPOINTS.CHALLENGE.ACTIVE
  )
  return response.data
}

export const useActiveChallenge = (): UseQueryResult<ChallengeWithStats, Error> => {
  const setChallenge = useTrackerStore((s) => s.setChallenge)
  const setLoading = useTrackerStore((s) => s.setLoading)

  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.ACTIVE(),
    queryFn: async () => {
      setLoading(true)
      try {
        const challenge = await fetchActiveChallenge()
        setChallenge(challenge)
        return challenge
      } finally {
        setLoading(false)
      }
    },
    staleTime: 1000 * 60,
    retry: false,
  })
}

const startChallenge = async (
  data: ChallengeStartRequest
): Promise<ChallengeWithStats> => {
  const response = await apiClient.post<ChallengeWithStats>(
    API_ENDPOINTS.CHALLENGE.START,
    data
  )
  return response.data
}

export const useStartChallenge = (): UseMutationResult<
  ChallengeWithStats,
  Error,
  ChallengeStartRequest
> => {
  const queryClient = useQueryClient()
  const setChallenge = useTrackerStore((s) => s.setChallenge)
  const setStarting = useTrackerStore((s) => s.setStarting)

  return useMutation({
    mutationFn: async (data) => {
      setStarting(true)
      try {
        return await startChallenge(data)
      } finally {
        setStarting(false)
      }
    },
    onSuccess: (data) => {
      setChallenge(data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGE.ALL })
      toast.success('Challenge started!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start challenge')
    },
  })
}

const fetchChallengeHistory = async (
  page: number,
  size: number
): Promise<ChallengeHistoryResponse> => {
  const response = await apiClient.get<ChallengeHistoryResponse>(
    API_ENDPOINTS.CHALLENGE.HISTORY,
    { params: { page, size } }
  )
  return response.data
}

export const useChallengeHistory = (
  page = 1,
  size = 10
): UseQueryResult<ChallengeHistoryResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.HISTORY(page, size),
    queryFn: () => fetchChallengeHistory(page, size),
    staleTime: 1000 * 60 * 5,
  })
}

const createOrUpdateLog = async (
  data: LogCreateRequest
): Promise<ChallengeLog> => {
  const response = await apiClient.post<ChallengeLog>(
    API_ENDPOINTS.CHALLENGE.LOGS.CREATE,
    data
  )
  return response.data
}

export const useCreateLog = (): UseMutationResult<
  ChallengeLog,
  Error,
  LogCreateRequest
> => {
  const queryClient = useQueryClient()
  const updateLog = useTrackerStore((s) => s.updateLog)
  const setSavingLog = useTrackerStore((s) => s.setSavingLog)

  return useMutation({
    mutationFn: async (data) => {
      setSavingLog(true)
      try {
        return await createOrUpdateLog(data)
      } finally {
        setSavingLog(false)
      }
    },
    onSuccess: (data) => {
      updateLog(data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGE.ACTIVE() })
      toast.success('Log saved')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save log')
    },
  })
}

const updateLog = async (
  date: string,
  data: LogUpdateRequest
): Promise<ChallengeLog> => {
  const response = await apiClient.put<ChallengeLog>(
    API_ENDPOINTS.CHALLENGE.LOGS.UPDATE(date),
    data
  )
  return response.data
}

export const useUpdateLog = (): UseMutationResult<
  ChallengeLog,
  Error,
  { date: string; data: LogUpdateRequest }
> => {
  const queryClient = useQueryClient()
  const storeUpdateLog = useTrackerStore((s) => s.updateLog)
  const setSavingLog = useTrackerStore((s) => s.setSavingLog)

  return useMutation({
    mutationFn: async ({ date, data }) => {
      setSavingLog(true)
      try {
        return await updateLog(date, data)
      } finally {
        setSavingLog(false)
      }
    },
    onSuccess: (data) => {
      storeUpdateLog(data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGE.ACTIVE() })
      toast.success('Log updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update log')
    },
  })
}

const fetchLogByDate = async (date: string): Promise<ChallengeLog> => {
  const response = await apiClient.get<ChallengeLog>(
    API_ENDPOINTS.CHALLENGE.LOGS.BY_DATE(date)
  )
  return response.data
}

export const useLogByDate = (
  date: string | null
): UseQueryResult<ChallengeLog, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.LOG(date ?? ''),
    queryFn: () => fetchLogByDate(date!),
    enabled: !!date,
    staleTime: 1000 * 60,
  })
}
