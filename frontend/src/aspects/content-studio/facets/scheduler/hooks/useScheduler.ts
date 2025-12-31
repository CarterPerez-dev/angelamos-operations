// ===================
// © AngelaMos | 2025
// useScheduler.ts
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
  ScheduledPost,
  ScheduleSingleRequest,
  ScheduleMultiRequest,
  ScheduleBatchResponse,
  RescheduleRequest,
} from '../types'

const fetchUpcomingPosts = async (limit = 20): Promise<ScheduledPost[]> => {
  const response = await apiClient.get<ScheduledPost[]>(
    `${API_ENDPOINTS.SCHEDULER.POSTS.UPCOMING}?limit=${limit}`
  )
  return response.data
}

export const useUpcomingPosts = (
  limit = 20
): UseQueryResult<ScheduledPost[], Error> => {
  const setScheduledPosts = useSchedulerStore((s) => s.setScheduledPosts)
  const setLoadingPosts = useSchedulerStore((s) => s.setLoadingPosts)

  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.POSTS.UPCOMING(limit),
    queryFn: async () => {
      setLoadingPosts(true)
      try {
        const posts = await fetchUpcomingPosts(limit)
        setScheduledPosts(posts)
        return posts
      } finally {
        setLoadingPosts(false)
      }
    },
    staleTime: 1000 * 60,
  })
}

const fetchBatchPosts = async (batchId: string): Promise<ScheduledPost[]> => {
  const response = await apiClient.get<ScheduledPost[]>(
    API_ENDPOINTS.SCHEDULER.POSTS.BATCH(batchId)
  )
  return response.data
}

export const useBatchPosts = (
  batchId: string | null
): UseQueryResult<ScheduledPost[], Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.POSTS.BATCH(batchId ?? ''),
    queryFn: () => fetchBatchPosts(batchId!),
    enabled: !!batchId,
  })
}

const scheduleSingle = async (
  request: ScheduleSingleRequest
): Promise<ScheduledPost> => {
  const response = await apiClient.post<ScheduledPost>(
    API_ENDPOINTS.SCHEDULER.POSTS.CREATE,
    request
  )
  return response.data
}

export const useScheduleSingle = (): UseMutationResult<
  ScheduledPost,
  Error,
  ScheduleSingleRequest
> => {
  const queryClient = useQueryClient()
  const addScheduledPost = useSchedulerStore((s) => s.addScheduledPost)

  return useMutation({
    mutationFn: scheduleSingle,
    onSuccess: (data) => {
      addScheduledPost(data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.POSTS.ALL() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success('Post scheduled')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to schedule post')
    },
  })
}

const scheduleMulti = async (
  request: ScheduleMultiRequest
): Promise<ScheduleBatchResponse> => {
  const response = await apiClient.post<ScheduleBatchResponse>(
    API_ENDPOINTS.SCHEDULER.POSTS.MULTI,
    request
  )
  return response.data
}

export const useScheduleMulti = (): UseMutationResult<
  ScheduleBatchResponse,
  Error,
  ScheduleMultiRequest
> => {
  const queryClient = useQueryClient()
  const addScheduledPosts = useSchedulerStore((s) => s.addScheduledPosts)

  return useMutation({
    mutationFn: scheduleMulti,
    onSuccess: (data) => {
      addScheduledPosts(data.posts)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.POSTS.ALL() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success(`Scheduled to ${data.posts.length} platform(s)`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to schedule posts')
    },
  })
}

const reschedulePost = async (
  postId: string,
  request: RescheduleRequest
): Promise<ScheduledPost> => {
  const response = await apiClient.put<ScheduledPost>(
    API_ENDPOINTS.SCHEDULER.POSTS.UPDATE(postId),
    request
  )
  return response.data
}

export const useReschedulePost = (): UseMutationResult<
  ScheduledPost,
  Error,
  { postId: string; request: RescheduleRequest }
> => {
  const queryClient = useQueryClient()
  const updateScheduledPost = useSchedulerStore((s) => s.updateScheduledPost)

  return useMutation({
    mutationFn: ({ postId, request }) => reschedulePost(postId, request),
    onSuccess: (data) => {
      updateScheduledPost(data.id, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.POSTS.ALL() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success('Post rescheduled')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reschedule post')
    },
  })
}

const cancelPost = async (postId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SCHEDULER.POSTS.CANCEL(postId))
}

export const useCancelPost = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const removeScheduledPost = useSchedulerStore((s) => s.removeScheduledPost)

  return useMutation({
    mutationFn: cancelPost,
    onSuccess: (_, postId) => {
      removeScheduledPost(postId)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.POSTS.ALL() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success('Post cancelled')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel post')
    },
  })
}

const publishNow = async (postId: string): Promise<ScheduledPost> => {
  const response = await apiClient.post<ScheduledPost>(
    API_ENDPOINTS.SCHEDULER.POSTS.PUBLISH(postId)
  )
  return response.data
}

export const usePublishNow = (): UseMutationResult<ScheduledPost, Error, string> => {
  const queryClient = useQueryClient()
  const updateScheduledPost = useSchedulerStore((s) => s.updateScheduledPost)

  return useMutation({
    mutationFn: publishNow,
    onSuccess: (data) => {
      updateScheduledPost(data.id, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.POSTS.ALL() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success('Publishing post...')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to publish post')
    },
  })
}
