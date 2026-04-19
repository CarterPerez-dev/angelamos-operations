// ===================
// © AngelaMos | 2025
// useJobTracker.ts
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_ENDPOINTS, QUERY_KEYS } from '@/config'
import { apiClient } from '@/core/api'
import type {
  ApplicationStatus,
  JobApplication,
  JobApplicationCreateRequest,
  JobApplicationListResponse,
  JobApplicationStats,
  JobApplicationUpdateRequest,
  Outcome,
} from '../types'
import {
  isValidJobApplication,
  isValidJobApplicationListResponse,
  isValidJobApplicationStats,
  JOB_TRACKER_ERROR_MESSAGES,
  JOB_TRACKER_SUCCESS_MESSAGES,
  JobTrackerResponseError,
} from '../types'

const fetchApplications = async (
  skip = 0,
  limit = 50
): Promise<JobApplicationListResponse> => {
  const response = await apiClient.get<JobApplicationListResponse>(
    API_ENDPOINTS.JOB_TRACKER.LIST,
    { params: { skip, limit } }
  )
  if (!isValidJobApplicationListResponse(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_LIST_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.LIST
    )
  }
  return response.data
}

export const useJobApplications = (
  skip = 0,
  limit = 50
): UseQueryResult<JobApplicationListResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.LIST(skip, limit),
    queryFn: () => fetchApplications(skip, limit),
    staleTime: 1000 * 60,
  })
}

const fetchApplicationById = async (id: string): Promise<JobApplication> => {
  const response = await apiClient.get<JobApplication>(
    API_ENDPOINTS.JOB_TRACKER.BY_ID(id)
  )
  if (!isValidJobApplication(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_APPLICATION_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.BY_ID(id)
    )
  }
  return response.data
}

export const useJobApplication = (
  id: string | null
): UseQueryResult<JobApplication, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.BY_ID(id ?? ''),
    queryFn: () => fetchApplicationById(id ?? ''),
    enabled: id !== null,
    staleTime: 1000 * 60,
  })
}

const fetchStats = async (): Promise<JobApplicationStats> => {
  const response = await apiClient.get<JobApplicationStats>(
    API_ENDPOINTS.JOB_TRACKER.STATS
  )
  if (!isValidJobApplicationStats(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_STATS_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.STATS
    )
  }
  return response.data
}

export const useJobApplicationStats = (): UseQueryResult<
  JobApplicationStats,
  Error
> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.STATS(),
    queryFn: fetchStats,
    staleTime: 1000 * 60,
  })
}

const fetchFollowups = async (): Promise<JobApplicationListResponse> => {
  const response = await apiClient.get<JobApplicationListResponse>(
    API_ENDPOINTS.JOB_TRACKER.FOLLOWUPS
  )
  if (!isValidJobApplicationListResponse(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_LIST_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.FOLLOWUPS
    )
  }
  return response.data
}

export const useJobApplicationFollowups = (): UseQueryResult<
  JobApplicationListResponse,
  Error
> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.FOLLOWUPS(),
    queryFn: fetchFollowups,
    staleTime: 1000 * 60,
  })
}

const fetchByStatus = async (
  status: ApplicationStatus
): Promise<JobApplicationListResponse> => {
  const response = await apiClient.get<JobApplicationListResponse>(
    API_ENDPOINTS.JOB_TRACKER.BY_STATUS(status)
  )
  if (!isValidJobApplicationListResponse(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_LIST_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.BY_STATUS(status)
    )
  }
  return response.data
}

export const useJobApplicationsByStatus = (
  status: ApplicationStatus
): UseQueryResult<JobApplicationListResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.BY_STATUS(status),
    queryFn: () => fetchByStatus(status),
    staleTime: 1000 * 60,
  })
}

const fetchByOutcome = async (
  outcome: Outcome
): Promise<JobApplicationListResponse> => {
  const response = await apiClient.get<JobApplicationListResponse>(
    API_ENDPOINTS.JOB_TRACKER.BY_OUTCOME(outcome)
  )
  if (!isValidJobApplicationListResponse(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_LIST_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.BY_OUTCOME(outcome)
    )
  }
  return response.data
}

export const useJobApplicationsByOutcome = (
  outcome: Outcome
): UseQueryResult<JobApplicationListResponse, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.JOB_TRACKER.BY_OUTCOME(outcome),
    queryFn: () => fetchByOutcome(outcome),
    staleTime: 1000 * 60,
  })
}

const createApplication = async (
  data: JobApplicationCreateRequest
): Promise<JobApplication> => {
  const response = await apiClient.post<JobApplication>(
    API_ENDPOINTS.JOB_TRACKER.CREATE,
    data
  )
  if (!isValidJobApplication(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_APPLICATION_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.CREATE
    )
  }
  return response.data
}

export const useCreateJobApplication = (): UseMutationResult<
  JobApplication,
  Error,
  JobApplicationCreateRequest
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOB_TRACKER.ALL })
      toast.success(JOB_TRACKER_SUCCESS_MESSAGES.APPLICATION_CREATED)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create application')
    },
  })
}

const updateApplication = async (
  id: string,
  data: JobApplicationUpdateRequest
): Promise<JobApplication> => {
  const response = await apiClient.patch<JobApplication>(
    API_ENDPOINTS.JOB_TRACKER.UPDATE(id),
    data
  )
  if (!isValidJobApplication(response.data)) {
    throw new JobTrackerResponseError(
      JOB_TRACKER_ERROR_MESSAGES.INVALID_APPLICATION_RESPONSE,
      API_ENDPOINTS.JOB_TRACKER.UPDATE(id)
    )
  }
  return response.data
}

export const useUpdateJobApplication = (): UseMutationResult<
  JobApplication,
  Error,
  { id: string; data: JobApplicationUpdateRequest }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOB_TRACKER.ALL })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.JOB_TRACKER.BY_ID(variables.id),
      })
      toast.success(JOB_TRACKER_SUCCESS_MESSAGES.APPLICATION_UPDATED)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update application')
    },
  })
}

const deleteApplication = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.JOB_TRACKER.DELETE(id))
}

export const useDeleteJobApplication = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOB_TRACKER.ALL })
      toast.success(JOB_TRACKER_SUCCESS_MESSAGES.APPLICATION_DELETED)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete application')
    },
  })
}
