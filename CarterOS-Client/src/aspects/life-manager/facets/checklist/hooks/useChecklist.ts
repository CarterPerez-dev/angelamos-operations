// ===================
// © AngelaMos | 2026
// useChecklist.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { API_ENDPOINTS, QUERY_KEYS } from '@/config'
import { apiClient } from '@/core/api'
import type {
  ChecklistDayResponse,
  ChecklistItem,
  ChecklistItemCreateRequest,
  ChecklistItemListResponse,
  ChecklistItemUpdateRequest,
  ChecklistLogEntry,
  ChecklistLogUpdateRequest,
  ChecklistStatsResponse,
} from '../types'

export const useChecklistItems = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CHECKLIST.ITEMS(),
    queryFn: async () => {
      const { data } = await apiClient.get<ChecklistItemListResponse>(
        API_ENDPOINTS.CHECKLIST.ITEMS
      )
      return data
    },
  })
}

export const useChecklistDay = (date: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.CHECKLIST.DAY(date),
    queryFn: async () => {
      const { data } = await apiClient.get<ChecklistDayResponse>(
        API_ENDPOINTS.CHECKLIST.LOG,
        { params: { log_date: date } }
      )
      return data
    },
  })
}

export const useChecklistStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CHECKLIST.STATS(),
    queryFn: async () => {
      const { data } = await apiClient.get<ChecklistStatsResponse>(
        API_ENDPOINTS.CHECKLIST.STATS
      )
      return data
    },
  })
}

export const useCreateChecklistItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ChecklistItemCreateRequest) => {
      const { data } = await apiClient.post<ChecklistItem>(
        API_ENDPOINTS.CHECKLIST.ITEMS,
        payload
      )
      return data
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<ChecklistItemListResponse>(
        QUERY_KEYS.CHECKLIST.ITEMS(),
        (old) => {
          if (!old) return { items: [newItem] }
          return { items: [...old.items, newItem] }
        }
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKLIST.ALL })
      toast.success('Checklist item created')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create checklist item')
    },
  })
}

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: ChecklistItemUpdateRequest
    }) => {
      const { data: result } = await apiClient.put<ChecklistItem>(
        API_ENDPOINTS.CHECKLIST.ITEM(id),
        data
      )
      return result
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<ChecklistItemListResponse>(
        QUERY_KEYS.CHECKLIST.ITEMS(),
        (old) => {
          if (!old) return old
          return {
            items: old.items.map((i) =>
              i.id === updatedItem.id ? updatedItem : i
            ),
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKLIST.ALL })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update checklist item')
    },
  })
}

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.CHECKLIST.ITEM(id))
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<ChecklistItemListResponse>(
        QUERY_KEYS.CHECKLIST.ITEMS(),
        (old) => {
          if (!old) return old
          return { items: old.items.filter((i) => i.id !== deletedId) }
        }
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKLIST.ALL })
      toast.success('Checklist item removed')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete checklist item')
    },
  })
}

export const useUpdateChecklistLog = (date: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: ChecklistLogUpdateRequest
    }) => {
      const { data: result } = await apiClient.patch<ChecklistLogEntry>(
        API_ENDPOINTS.CHECKLIST.LOG_ENTRY(id),
        data
      )
      return result
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData<ChecklistDayResponse>(
        QUERY_KEYS.CHECKLIST.DAY(date),
        (old) => {
          if (!old) return old
          const entries = old.entries.map((e) =>
            e.id === updatedEntry.id ? updatedEntry : e
          )
          return {
            ...old,
            entries,
            completed_count: entries.filter((e) => e.completed).length,
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKLIST.STATS() })
    },
  })
}
