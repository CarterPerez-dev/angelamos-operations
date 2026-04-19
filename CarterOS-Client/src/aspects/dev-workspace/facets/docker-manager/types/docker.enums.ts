// ===================
// © AngelaMos | 2025
// docker.enums.ts
// ===================

export const DOCKER_API = {
  PROJECTS_LIST: '/api/projects',
  PROJECT_GET: (id: string) => `/api/projects/${id}`,
  PROJECT_START: (id: string) => `/api/projects/${id}/start`,
  PROJECT_STOP: (id: string) => `/api/projects/${id}/stop`,
  PROJECT_RESTART: (id: string) => `/api/projects/${id}/restart`,
  PROJECT_PROTECT: (id: string) => `/api/projects/${id}/protect`,
  PROJECT_NAME: (id: string) => `/api/projects/${id}/name`,
  PROJECT_HIDDEN: (id: string) => `/api/projects/${id}/hidden`,
  PROJECT_STATS: (id: string) => `/api/projects/${id}/stats`,
  CONTAINER_LOGS: (id: string) => `/api/containers/${id}/logs`,
  SYSTEM_INFO: '/api/system/info',
  STORAGE_INFO: '/api/system/storage',
  PRUNE: '/api/system/prune',
  PORT_CHECK: (port: number) => `/api/system/port/${port}`,
  HEALTH: '/api/health',
  READY: '/api/ready',
} as const

export const getDockerWSUrl = (): string => {
  const envURL = import.meta.env.VITE_DOCKER_API_URL

  if (envURL) {
    return `${envURL.replace('http', 'ws')}/ws/stats`
  }

  return 'ws://localhost:7771/ws/stats'
}

export const REFRESH_INTERVALS = {
  PROJECTS_LIST: 5000,
  SYSTEM_INFO: 10000,
  STORAGE_INFO: 30000,
  PROJECT_STATS: 2000,
} as const

export const STATUS_COLORS = {
  running: '#36d7b7',
  stopped: '#898989',
  partial: '#f39c12',
  unknown: '#4d4d4d',
} as const

export const ENVIRONMENT_LABELS = {
  development: 'Dev',
  production: 'Prod',
  unknown: 'Unknown',
} as const

export const PROTECTION_ICONS = {
  cloudflare_tunnel: '🔒',
  user_marked: '🛡️',
  auto_detected: '🔐',
} as const

export const BYTES_PER_MB = 1024 * 1024
export const BYTES_PER_GB = 1024 * 1024 * 1024

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}
