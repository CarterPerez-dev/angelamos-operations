// ===================
// © AngelaMos | 2025
// useDockerProjects.ts
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
  DOCKER_ERROR_MESSAGES,
  DOCKER_SUCCESS_MESSAGES,
  DockerManagerResponseError,
  isValidProject,
  isValidProjectList,
  type Project,
  type SetDisplayNameRequest,
  type SetHiddenRequest,
  type SetProtectionRequest,
} from '../types/docker.types'

export const dockerQueries = {
  all: () => ['docker'] as const,
  projects: () => [...dockerQueries.all(), 'projects'] as const,
  project: (id: string) => [...dockerQueries.projects(), id] as const,
  projectStats: (id: string) => [...dockerQueries.project(id), 'stats'] as const,
} as const

const fetchProjects = async (): Promise<Project[]> => {
  const response = await dockerApiClient.get<unknown>(DOCKER_API.PROJECTS_LIST)
  const data: unknown = response.data

  if (!isValidProjectList(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_LIST_RESPONSE,
      DOCKER_API.PROJECTS_LIST
    )
  }

  return data
}

export const useDockerProjects = (): UseQueryResult<Project[], Error> => {
  return useQuery({
    queryKey: dockerQueries.projects(),
    queryFn: fetchProjects,
    refetchInterval: REFRESH_INTERVALS.PROJECTS_LIST,
    staleTime: REFRESH_INTERVALS.PROJECTS_LIST - 1000,
  })
}

const fetchProject = async (id: string): Promise<Project> => {
  const response = await dockerApiClient.get<unknown>(DOCKER_API.PROJECT_GET(id))
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_GET(id)
    )
  }

  return data
}

export const useDockerProject = (id: string): UseQueryResult<Project, Error> => {
  return useQuery({
    queryKey: dockerQueries.project(id),
    queryFn: () => fetchProject(id),
    enabled: Boolean(id),
    staleTime: REFRESH_INTERVALS.PROJECTS_LIST - 1000,
  })
}

const startProject = async (id: string): Promise<Project> => {
  const response = await dockerApiClient.post<unknown>(
    DOCKER_API.PROJECT_START(id)
  )
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_START(id)
    )
  }

  return data
}

export const useStartProject = (): UseMutationResult<Project, Error, string> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })
      toast.success(DOCKER_SUCCESS_MESSAGES.PROJECT_STARTED(data.name))
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to start project'
      toast.error(message)
    },
  })
}

const stopProject = async (params: {
  id: string
  force?: boolean
}): Promise<Project> => {
  const url = params.force
    ? `${DOCKER_API.PROJECT_STOP(params.id)}?force=true`
    : DOCKER_API.PROJECT_STOP(params.id)

  const response = await dockerApiClient.post<unknown>(url)
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_STOP(params.id)
    )
  }

  return data
}

export const useStopProject = (): UseMutationResult<
  Project,
  Error,
  { id: string; force?: boolean }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })
      toast.success(DOCKER_SUCCESS_MESSAGES.PROJECT_STOPPED(data.name))
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to stop project'
      toast.error(message)
    },
  })
}

const restartProject = async (id: string): Promise<Project> => {
  const response = await dockerApiClient.post<unknown>(
    DOCKER_API.PROJECT_RESTART(id)
  )
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_RESTART(id)
    )
  }

  return data
}

export const useRestartProject = (): UseMutationResult<
  Project,
  Error,
  string
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restartProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })
      toast.success(DOCKER_SUCCESS_MESSAGES.PROJECT_RESTARTED(data.name))
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to restart project'
      toast.error(message)
    },
  })
}

const setProtection = async (params: {
  id: string
  request: SetProtectionRequest
}): Promise<Project> => {
  const response = await dockerApiClient.post<unknown>(
    DOCKER_API.PROJECT_PROTECT(params.id),
    params.request
  )
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_PROTECT(params.id)
    )
  }

  return data
}

export const useSetProjectProtection = (): UseMutationResult<
  Project,
  Error,
  { id: string; request: SetProtectionRequest }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setProtection,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })

      const message = variables.request.protected
        ? DOCKER_SUCCESS_MESSAGES.PROTECTION_ENABLED(data.name)
        : DOCKER_SUCCESS_MESSAGES.PROTECTION_DISABLED(data.name)

      toast.success(message)
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to update protection'
      toast.error(message)
    },
  })
}

const setDisplayName = async (params: {
  id: string
  request: SetDisplayNameRequest
}): Promise<Project> => {
  const response = await dockerApiClient.put<unknown>(
    DOCKER_API.PROJECT_NAME(params.id),
    params.request
  )
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_NAME(params.id)
    )
  }

  return data
}

export const useSetProjectDisplayName = (): UseMutationResult<
  Project,
  Error,
  { id: string; oldName: string; request: SetDisplayNameRequest }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      id: string
      oldName: string
      request: SetDisplayNameRequest
    }) => setDisplayName({ id: params.id, request: params.request }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })

      const newName = variables.request.display_name ?? data.name
      toast.success(
        DOCKER_SUCCESS_MESSAGES.PROJECT_RENAMED(variables.oldName, newName)
      )
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to rename project'
      toast.error(message)
    },
  })
}

const setHidden = async (params: {
  id: string
  request: SetHiddenRequest
}): Promise<Project> => {
  const response = await dockerApiClient.put<unknown>(
    DOCKER_API.PROJECT_HIDDEN(params.id),
    params.request
  )
  const data: unknown = response.data

  if (!isValidProject(data)) {
    throw new DockerManagerResponseError(
      DOCKER_ERROR_MESSAGES.INVALID_PROJECT_RESPONSE,
      DOCKER_API.PROJECT_HIDDEN(params.id)
    )
  }

  return data
}

export const useSetProjectHidden = (): UseMutationResult<
  Project,
  Error,
  { id: string; request: SetHiddenRequest }
> => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setHidden,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dockerQueries.projects() })
      queryClient.invalidateQueries({ queryKey: dockerQueries.project(data.id) })

      const displayName = data.display_name ?? data.name
      const message = variables.request.hidden
        ? DOCKER_SUCCESS_MESSAGES.PROJECT_HIDDEN(displayName)
        : DOCKER_SUCCESS_MESSAGES.PROJECT_UNHIDDEN(displayName)

      toast.success(message)
    },
    onError: (error) => {
      const message =
        error instanceof DockerManagerResponseError
          ? error.message
          : 'Failed to update visibility'
      toast.error(message)
    },
  })
}
