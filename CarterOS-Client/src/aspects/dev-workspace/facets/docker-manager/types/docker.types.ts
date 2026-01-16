// ===================
// © AngelaMos | 2025
// docker.types.ts
// ===================

import { z } from 'zod'

export const Environment = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  UNKNOWN: 'unknown',
} as const
export type Environment = (typeof Environment)[keyof typeof Environment]

export const ProjectStatus = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  PARTIAL: 'partial',
  UNKNOWN: 'unknown',
} as const
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

export const ProtectionReason = {
  CLOUDFLARE_TUNNEL: 'cloudflare_tunnel',
  USER_MARKED: 'user_marked',
  AUTO_DETECTED: 'auto_detected',
} as const
export type ProtectionReason = (typeof ProtectionReason)[keyof typeof ProtectionReason]

export const portMappingSchema = z.object({
  host_ip: z.string().optional(),
  host_port: z.number(),
  container_port: z.number(),
  protocol: z.string(),
})

export const containerStatsSchema = z.object({
  cpu_percent: z.number(),
  memory_usage: z.number(),
  memory_limit: z.number(),
  memory_percent: z.number(),
  network_rx: z.number(),
  network_tx: z.number(),
  block_read: z.number(),
  block_write: z.number(),
  pids: z.number(),
  timestamp: z.string(),
})

export const containerSchema = z.object({
  id: z.string(),
  name: z.string(),
  service_name: z.string(),
  image: z.string(),
  status: z.string(),
  state: z.string(),
  health: z.string().optional(),
  ports: z.array(portMappingSchema),
  labels: z.record(z.string()),
  stats: containerStatsSchema.optional(),
  created_at: z.string(),
  started_at: z.string().optional(),
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string().optional(),
  path: z.string(),
  compose_file: z.string(),
  compose_file_path: z.string(),
  environment: z.string(),
  status: z.string(),
  protected: z.boolean(),
  protection_reason: z.string().optional(),
  hidden: z.boolean(),
  containers: z.array(containerSchema),
  services: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
})

export const systemInfoSchema = z.object({
  docker_version: z.string(),
  api_version: z.string(),
  os: z.string(),
  arch: z.string(),
  containers: z.number(),
  containers_running: z.number(),
  containers_paused: z.number(),
  containers_stopped: z.number(),
  images: z.number(),
})

export const imageInfoSchema = z.object({
  id: z.string(),
  repository: z.string(),
  tag: z.string(),
  size: z.number(),
  created: z.string(),
  in_use: z.boolean(),
})

export const volumeInfoSchema = z.object({
  name: z.string(),
  driver: z.string(),
  size: z.number(),
  in_use: z.boolean(),
  created_at: z.string(),
})

export const cacheInfoSchema = z.object({
  id: z.string(),
  type: z.string(),
  size: z.number(),
  in_use: z.boolean(),
  created_at: z.string(),
  last_used_at: z.string(),
})

export const storageDetailsSchema = z.object({
  images: z.array(imageInfoSchema),
  volumes: z.array(volumeInfoSchema),
  build_cache: z.array(cacheInfoSchema),
})

export const storageInfoSchema = z.object({
  images_size: z.number(),
  containers_size: z.number(),
  volumes_size: z.number(),
  build_cache_size: z.number(),
  total_size: z.number(),
  reclaimable: z.number(),
  details: storageDetailsSchema,
})

export const portCheckSchema = z.object({
  port: z.number(),
  available: z.boolean(),
  process: z.string().optional(),
  pid: z.number().optional(),
})

export const pruneResponseSchema = z.object({
  reclaimed_bytes: z.number(),
  reclaimed_mb: z.number(),
})

export const projectListResponseSchema = z.array(projectSchema)

export const containerStatsMapSchema = z.record(containerStatsSchema)

export type PortMapping = z.infer<typeof portMappingSchema>
export type ContainerStats = z.infer<typeof containerStatsSchema>
export type Container = z.infer<typeof containerSchema>
export type Project = z.infer<typeof projectSchema>
export type SystemInfo = z.infer<typeof systemInfoSchema>
export type ImageInfo = z.infer<typeof imageInfoSchema>
export type VolumeInfo = z.infer<typeof volumeInfoSchema>
export type CacheInfo = z.infer<typeof cacheInfoSchema>
export type StorageDetails = z.infer<typeof storageDetailsSchema>
export type StorageInfo = z.infer<typeof storageInfoSchema>
export type PortCheck = z.infer<typeof portCheckSchema>
export type PruneResponse = z.infer<typeof pruneResponseSchema>
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>
export type ContainerStatsMap = z.infer<typeof containerStatsMapSchema>

export interface SetProtectionRequest {
  protected: boolean
  reason?: string
}

export interface SetDisplayNameRequest {
  display_name: string
}

export interface SetHiddenRequest {
  hidden: boolean
}

export interface PruneRequest {
  images?: boolean
  volumes?: boolean
  build_cache?: boolean
}

export const isValidProject = (data: unknown): data is Project => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  return projectSchema.safeParse(data).success
}

export const isValidProjectList = (data: unknown): data is Project[] => {
  if (data === null || data === undefined) {
    console.error('Data is null or undefined')
    return false
  }
  if (!Array.isArray(data)) {
    console.error('Data is not an array')
    return false
  }
  return true
}

export const isValidSystemInfo = (data: unknown): data is SystemInfo => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  const result = systemInfoSchema.safeParse(data)
  return result.success
}

export const isValidStorageInfo = (data: unknown): data is StorageInfo => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  const result = storageInfoSchema.safeParse(data)
  return result.success
}

export const isValidPortCheck = (data: unknown): data is PortCheck => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  const result = portCheckSchema.safeParse(data)
  return result.success
}

export const isValidPruneResponse = (data: unknown): data is PruneResponse => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  const result = pruneResponseSchema.safeParse(data)
  return result.success
}

export const isValidContainerStatsMap = (data: unknown): data is ContainerStatsMap => {
  if (data === null || data === undefined) return false
  if (typeof data !== 'object') return false
  const result = containerStatsMapSchema.safeParse(data)
  return result.success
}

export class DockerManagerResponseError extends Error {
  constructor(
    message: string,
    public readonly endpoint?: string
  ) {
    super(message)
    this.name = 'DockerManagerResponseError'
    Object.setPrototypeOf(this, DockerManagerResponseError.prototype)
  }
}

export const DOCKER_ERROR_MESSAGES = {
  INVALID_PROJECT_RESPONSE: 'Invalid project data from server',
  INVALID_PROJECT_LIST_RESPONSE: 'Invalid project list from server',
  INVALID_SYSTEM_INFO_RESPONSE: 'Invalid system info from server',
  INVALID_STORAGE_INFO_RESPONSE: 'Invalid storage info from server',
  PROJECT_NOT_FOUND: 'Project not found',
  DOCKER_UNAVAILABLE: 'Docker daemon not available',
  PERMISSION_DENIED: 'Permission denied',
  PROTECTED_PROJECT: 'Cannot stop protected project',
} as const

export const DOCKER_SUCCESS_MESSAGES = {
  PROJECT_STARTED: (name: string) => `${name} started successfully`,
  PROJECT_STOPPED: (name: string) => `${name} stopped successfully`,
  PROJECT_RESTARTED: (name: string) => `${name} restarted successfully`,
  PROTECTION_ENABLED: (name: string) => `${name} is now protected`,
  PROTECTION_DISABLED: (name: string) => `${name} protection removed`,
  PRUNE_COMPLETED: (mb: number) => `Freed ${mb.toFixed(2)} MB of disk space`,
  PROJECT_RENAMED: (oldName: string, newName: string) => `Renamed ${oldName} to ${newName}`,
  PROJECT_HIDDEN: (name: string) => `${name} is now hidden`,
  PROJECT_UNHIDDEN: (name: string) => `${name} is now visible`,
} as const
