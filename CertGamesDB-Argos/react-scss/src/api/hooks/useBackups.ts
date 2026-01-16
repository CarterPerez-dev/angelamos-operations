// ===================
// AngelaMos | 2026
// useBackups.ts
// ===================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/core/api'
import { API_ENDPOINTS, QUERY_CONFIG, QUERY_KEYS } from '@/config'
import {
  parseApiResponse,
  BackupListResponseSchema,
  BackupSchema,
  type Backup,
  type BackupListResponse,
  type CreateBackupRequest,
} from '../types'

export function useBackups() {
  return useQuery({
    queryKey: QUERY_KEYS.BACKUPS.LIST(),
    queryFn: async (): Promise<BackupListResponse> => {
      const { data } = await apiClient.get(API_ENDPOINTS.BACKUPS.LIST)
      return parseApiResponse(BackupListResponseSchema, data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME.BACKUPS,
  })
}

export function useBackup(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BACKUPS.BY_ID(id),
    queryFn: async (): Promise<Backup> => {
      const { data } = await apiClient.get(API_ENDPOINTS.BACKUPS.BY_ID(id))
      return parseApiResponse(BackupSchema, data)
    },
    enabled: !!id,
  })
}

export function useCreateBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreateBackupRequest) => {
      const { data } = await apiClient.post(API_ENDPOINTS.BACKUPS.CREATE, request)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKUPS.ALL })
    },
  })
}

export function useRestoreBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(API_ENDPOINTS.BACKUPS.RESTORE(id))
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKUPS.ALL })
    },
  })
}

export function useDeleteBackup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(API_ENDPOINTS.BACKUPS.BY_ID(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BACKUPS.ALL })
    },
  })
}
