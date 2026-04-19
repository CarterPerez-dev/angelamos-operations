// ===================
// © AngelaMos | 2025
// useDockerSystem.ts
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { dockerApiClient } from '../api/docker.client'
import { DOCKER_API, REFRESH_INTERVALS } from '../types/docker.enums'
import {
  type ContainerStatsMap,
  DOCKER_ERROR_MESSAGES,
  DOCKER_SUCCESS_MESSAGES,
  DockerManagerResponseError,
  isValidContainerStatsMap,
  isValidPortCheck,
  isValidPruneResponse,
  isValidStorageInfo,
  isValidSystemInfo,
  type PortCheck,
  type PruneRequest,
  type PruneResponse,
  type StorageInfo,
  type SystemInfo,
} from '../types/docker.types'

export const dockerSystemQueries = {
  all: () => ['docker', 'system'] as const,
  info: () => [...dockerSystemQueries.all(), 'info'] as const,
  storage: () => [...dockerSystemQueries.all(), 'storage'] as const,
  portCheck: (port: number) =>
    [...dockerSystemQueries.all(), 'port', port] as const,
} as const

const fetchSystemInfo = async (): Promise<SystemInfo> => {
  const response = await dockerApiClient.get<unknown>(DOCKER_API.SYSTEM_INFO)
  const data: unknown = response.data

  if (!isValidSystemInfo(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_SYSTEM_INFO_RESPONSE,
      DOCKER_API.SYSTEM_INFO
    )
  }

  return data
}

export const useDockerSystemInfo = (): UseQueryResult<SystemInfo, Error> => {
  return useQuery({
    queryKey: dockerSystemQueries.info(),
    queryFn: fetchSystemInfo,
    refetchInterval: REFRESH_INTERVALS.SYSTEM_INFO,
    staleTime: REFRESH_INTERVALS.SYSTEM_INFO - 1000,
  })
}

const fetchStorageInfo = async (): Promise<StorageInfo> => {
  const response = await dockerApiClient.get<unknown>(DOCKER_API.STORAGE_INFO)
  const data: unknown = response.data

  if (!isValidStorageInfo(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_STORAGE_INFO_RESPONSE,
      DOCKER_API.STORAGE_INFO
    )
  }

  return data
}

export const useDockerStorageInfo = (): UseQueryResult<StorageInfo, Error> => {
  return useQuery({
    queryKey: dockerSystemQueries.storage(),
    queryFn: fetchStorageInfo,
    refetchInterval: REFRESH_INTERVALS.STORAGE_INFO,
    staleTime: REFRESH_INTERVALS.STORAGE_INFO - 1000,
  })
}

const checkPort = async (port: number): Promise<PortCheck> => {
  const response = await dockerApiClient.get<unknown>(DOCKER_API.PORT_CHECK(port))
  const data: unknown = response.data

  if (!isValidPortCheck(data)) {
    throw new DockerManagerResponseError(
      'Invalid port check response',
      DOCKER_API.PORT_CHECK(port)
    )
  }

  return data
}

export const useCheckPort = (
  port: number | null
): UseQueryResult<PortCheck, Error> => {
  return useQuery({
    queryKey: dockerSystemQueries.portCheck(port ?? 0),
    queryFn: () => checkPort(port ?? 0),
    enabled: port !== null && port > 0,
    staleTime: 0,
  })
}

const pruneSystem = async (request: PruneRequest): Promise<PruneResponse> => {
  const response = await dockerApiClient.post<unknown>(DOCKER_API.PRUNE, request)
  const data: unknown = response.data

  if (!isValidPruneResponse(data)) {
    throw new DockerManagerResponseError(
      'Invalid prune response',
      DOCKER_API.PRUNE
    )
  }

  return data
}

export const usePruneSystem = (): UseMutationResult<
  PruneResponse,
  Error,
  PruneRequest
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pruneSystem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dockerSystemQueries.storage() })
      toast.success(DOCKER_SUCCESS_MESSAGES.PRUNE_COMPLETED(data.reclaimed_mb))
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to prune system'
      toast.error(message)
    },
  })
}

const fetchProjectStats = async (id: string): Promise<ContainerStatsMap> => {
  const response = await dockerApiClient.get<unknown>(
    DOCKER_API.PROJECT_STATS(id)
  )
  const data: unknown = response.data

  if (!isValidContainerStatsMap(data)) {
    throw new DockerManagerResponseError(
      'Invalid stats response',
      DOCKER_API.PROJECT_STATS(id)
    )
  }

  return data
}

export const useProjectStats = (
  id: string | null
): UseQueryResult<ContainerStatsMap, Error> => {
  return useQuery({
    queryKey: ['docker', 'project-stats', id] as const,
    queryFn: () => fetchProjectStats(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: REFRESH_INTERVALS.PROJECT_STATS,
    staleTime: REFRESH_INTERVALS.PROJECT_STATS - 500,
  })
}

const fetchContainerLogs = async (params: {
  id: string
  tail?: string
}): Promise<string[]> => {
  const url = params.tail
    ? `${DOCKER_API.CONTAINER_LOGS(params.id)}?tail=${params.tail}`
    : DOCKER_API.CONTAINER_LOGS(params.id)

  const response = await dockerApiClient.get<{ logs: string[] }>(url)
  return response.data.logs || []
}

export const useContainerLogs = (
  containerId: string | null,
  tail = '100'
): UseQueryResult<string[], Error> => {
  return useQuery({
    queryKey: ['docker', 'container-logs', containerId, tail] as const,
    queryFn: () => fetchContainerLogs({ id: containerId ?? '', tail }),
    enabled: Boolean(containerId),
    staleTime: 0,
  })
}
