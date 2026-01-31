// ===================
// © AngelaMos | 2026
// usePlanner.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient as api } from '@/core/api'
import { API_ENDPOINTS } from '@/config'
import type {
  TimeBlock,
  TimeBlockCreate,
  TimeBlockUpdate,
  TimeBlockListResponse,
} from '../types/planner.types'

const PLANNER_API = API_ENDPOINTS.PLANNER

const QUERY_KEYS = {
  blocks: (date: string) => ['planner', 'blocks', date] as const,
}

export function useTimeBlocks(date: string) {
  return useQuery({
    queryKey: QUERY_KEYS.blocks(date),
    queryFn: async () => {
      const { data } = await api.get<TimeBlockListResponse>(PLANNER_API.BLOCKS, {
        params: { block_date: date },
      })
      return data
    },
  })
}

export function useCreateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TimeBlockCreate) => {
      const { data: result } = await api.post<TimeBlock>(PLANNER_API.BLOCKS, data)
      return result
    },
    onSuccess: (newBlock) => {
      const blockDate = newBlock.block_date
      queryClient.setQueryData<TimeBlockListResponse>(QUERY_KEYS.blocks(blockDate), (old) => {
        if (!old) return { items: [newBlock], date: blockDate }
        return { ...old, items: [...old.items, newBlock] }
      })
    },
  })
}

export function useUpdateBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimeBlockUpdate }) => {
      const { data: result } = await api.put<TimeBlock>(PLANNER_API.BLOCK(id), data)
      return result
    },
    onSuccess: (updatedBlock) => {
      const blockDate = updatedBlock.block_date
      queryClient.setQueryData<TimeBlockListResponse>(QUERY_KEYS.blocks(blockDate), (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)),
        }
      })
    },
  })
}

export function useDeleteBlock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(PLANNER_API.BLOCK(id))
      return id
    },
    onSuccess: (deletedId, variables) => {
      const queries = queryClient.getQueriesData<TimeBlockListResponse>({ queryKey: ['planner', 'blocks'] })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<TimeBlockListResponse>(key, {
            ...data,
            items: data.items.filter((b) => b.id !== deletedId),
          })
        }
      }
    },
  })
}
