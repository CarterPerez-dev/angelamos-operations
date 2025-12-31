// ===================
// © AngelaMos | 2025
// useContentLibrary.ts
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
  ContentLibraryItem,
  ContentLibraryItemCreate,
  ContentLibraryItemUpdate,
  ContentLibraryListResponse,
  ContentLibraryQueryParams,
  MediaAttachment,
} from '../types'

const fetchContentLibrary = async (
  params?: ContentLibraryQueryParams
): Promise<ContentLibraryListResponse> => {
  const queryParams = new URLSearchParams()

  if (params?.content_type) queryParams.append('content_type', params.content_type)
  if (params?.target_platform) queryParams.append('target_platform', params.target_platform)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.tags) params.tags.forEach((tag) => queryParams.append('tags', tag))
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())

  const url = queryParams.toString()
    ? `${API_ENDPOINTS.SCHEDULER.LIBRARY.LIST}?${queryParams}`
    : API_ENDPOINTS.SCHEDULER.LIBRARY.LIST

  const response = await apiClient.get<ContentLibraryListResponse>(url)
  return response.data
}

export const useContentLibrary = (
  params?: ContentLibraryQueryParams
): UseQueryResult<ContentLibraryListResponse, Error> => {
  const setContentLibrary = useSchedulerStore((s) => s.setContentLibrary)
  const setLoadingLibrary = useSchedulerStore((s) => s.setLoadingLibrary)

  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.LIST({
      content_type: params?.content_type,
      platform: params?.target_platform,
      search: params?.search,
    }),
    queryFn: async () => {
      setLoadingLibrary(true)
      try {
        const result = await fetchContentLibrary(params)
        setContentLibrary(result.items, result.total)
        return result
      } finally {
        setLoadingLibrary(false)
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

const fetchContentItem = async (id: string): Promise<ContentLibraryItem> => {
  const response = await apiClient.get<ContentLibraryItem>(
    API_ENDPOINTS.SCHEDULER.LIBRARY.BY_ID(id)
  )
  return response.data
}

export const useContentItem = (
  id: string | null
): UseQueryResult<ContentLibraryItem, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.BY_ID(id ?? ''),
    queryFn: () => fetchContentItem(id!),
    enabled: !!id,
  })
}

const createContentItem = async (
  data: ContentLibraryItemCreate
): Promise<ContentLibraryItem> => {
  const response = await apiClient.post<ContentLibraryItem>(
    API_ENDPOINTS.SCHEDULER.LIBRARY.CREATE,
    data
  )
  return response.data
}

export const useCreateContent = (): UseMutationResult<
  ContentLibraryItem,
  Error,
  ContentLibraryItemCreate
> => {
  const queryClient = useQueryClient()
  const addContentLibraryItem = useSchedulerStore((s) => s.addContentLibraryItem)

  return useMutation({
    mutationFn: createContentItem,
    onSuccess: (data) => {
      addContentLibraryItem(data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.ALL() })
      toast.success('Content created')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create content')
    },
  })
}

const updateContentItem = async (
  id: string,
  data: ContentLibraryItemUpdate
): Promise<ContentLibraryItem> => {
  const response = await apiClient.put<ContentLibraryItem>(
    API_ENDPOINTS.SCHEDULER.LIBRARY.UPDATE(id),
    data
  )
  return response.data
}

export const useUpdateContent = (): UseMutationResult<
  ContentLibraryItem,
  Error,
  { id: string; data: ContentLibraryItemUpdate }
> => {
  const queryClient = useQueryClient()
  const updateContentLibraryItem = useSchedulerStore((s) => s.updateContentLibraryItem)

  return useMutation({
    mutationFn: ({ id, data }) => updateContentItem(id, data),
    onSuccess: (data) => {
      updateContentLibraryItem(data.id, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.ALL() })
      toast.success('Content updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update content')
    },
  })
}

const deleteContentItem = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SCHEDULER.LIBRARY.DELETE(id))
}

export const useDeleteContent = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const removeContentLibraryItem = useSchedulerStore((s) => s.removeContentLibraryItem)

  return useMutation({
    mutationFn: deleteContentItem,
    onSuccess: (_, id) => {
      removeContentLibraryItem(id)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.ALL() })
      toast.success('Content deleted')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete content')
    },
  })
}

const uploadMedia = async (
  contentId: string,
  file: File
): Promise<MediaAttachment> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<MediaAttachment>(
    API_ENDPOINTS.SCHEDULER.LIBRARY.MEDIA(contentId),
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  )
  return response.data
}

export const useUploadMedia = (): UseMutationResult<
  MediaAttachment,
  Error,
  { contentId: string; file: File }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contentId, file }) => uploadMedia(contentId, file),
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.BY_ID(contentId),
      })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.ALL() })
      toast.success('Media uploaded')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload media')
    },
  })
}

const deleteMedia = async (mediaId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SCHEDULER.LIBRARY.DELETE_MEDIA(mediaId))
}

export const useDeleteMedia = (): UseMutationResult<
  void,
  Error,
  { mediaId: string; contentId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mediaId }) => deleteMedia(mediaId),
    onSuccess: (_, { contentId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.BY_ID(contentId),
      })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.LIBRARY.ALL() })
      toast.success('Media deleted')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete media')
    },
  })
}
