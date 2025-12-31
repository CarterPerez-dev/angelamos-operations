// ===================
// © AngelaMos | 2025
// useConnectedAccounts.ts
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
  ConnectedAccount,
  ConnectAccountResponse,
} from '../types'
import type { PlatformType } from '../types/scheduler.enums'

interface ConnectAccountResult {
  auth_url: string
  platform: PlatformType
}

const fetchConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
  const response = await apiClient.get<ConnectedAccount[]>(
    API_ENDPOINTS.SCHEDULER.ACCOUNTS.LIST
  )
  return response.data
}

export const useConnectedAccounts = (): UseQueryResult<ConnectedAccount[], Error> => {
  const setConnectedAccounts = useSchedulerStore((s) => s.setConnectedAccounts)
  const setLoadingAccounts = useSchedulerStore((s) => s.setLoadingAccounts)

  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.ACCOUNTS(),
    queryFn: async () => {
      setLoadingAccounts(true)
      try {
        const accounts = await fetchConnectedAccounts()
        setConnectedAccounts(accounts)
        return accounts
      } finally {
        setLoadingAccounts(false)
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}

const connectAccount = async (
  platform: PlatformType,
  redirectUrl?: string
): Promise<ConnectAccountResult> => {
  const params = redirectUrl ? { redirect_url: redirectUrl } : undefined
  const response = await apiClient.post<ConnectAccountResponse>(
    API_ENDPOINTS.SCHEDULER.ACCOUNTS.CONNECT(platform),
    undefined,
    { params }
  )
  return response.data
}

export const useConnectAccount = (): UseMutationResult<
  ConnectAccountResult,
  Error,
  { platform: PlatformType; redirectUrl?: string }
> => {
  return useMutation({
    mutationFn: ({ platform, redirectUrl }) => connectAccount(platform, redirectUrl),
    onSuccess: (data) => {
      window.location.href = data.auth_url
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to initiate account connection')
    },
  })
}

const disconnectAccount = async (accountId: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SCHEDULER.ACCOUNTS.DISCONNECT(accountId))
}

export const useDisconnectAccount = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient()
  const removeConnectedAccount = useSchedulerStore((s) => s.removeConnectedAccount)

  return useMutation({
    mutationFn: disconnectAccount,
    onSuccess: (_, accountId) => {
      removeConnectedAccount(accountId)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ACCOUNTS() })
      toast.success('Account disconnected')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disconnect account')
    },
  })
}

interface SyncResult {
  synced: number
  failed: number
}

const syncAccounts = async (): Promise<SyncResult> => {
  const response = await apiClient.post<SyncResult>(
    API_ENDPOINTS.SCHEDULER.ACCOUNTS.SYNC
  )
  return response.data
}

export const useSyncAccounts = (): UseMutationResult<SyncResult, Error, void> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncAccounts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ACCOUNTS() })
      if (data.synced > 0) {
        toast.success(`Synced ${data.synced} account(s)`)
      }
      if (data.failed > 0) {
        toast.warning(`Failed to sync ${data.failed} account(s)`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync accounts')
    },
  })
}
