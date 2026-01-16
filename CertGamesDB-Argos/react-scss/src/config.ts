// ===================
// AngelaMos | 2026
// config.ts
// ===================

export const API_ENDPOINTS = {
  HEALTH: {
    LIVE: '/healthz',
    READY: '/readyz',
  },
  METRICS: {
    DASHBOARD: '/api/metrics',
    SLOW_QUERIES: '/api/metrics/slow-queries',
    ANALYZE: '/api/metrics/slow-queries/analyze',
    PROFILING: '/api/metrics/profiling',
  },
  BACKUPS: {
    LIST: '/api/backups',
    CREATE: '/api/backups',
    BY_ID: (id: string) => `/api/backups/${id}`,
    RESTORE: (id: string) => `/api/backups/${id}/restore`,
  },
  COLLECTIONS: {
    LIST: '/api/collections',
    BY_NAME: (name: string) => `/api/collections/${name}`,
    SCHEMA: (name: string) => `/api/collections/${name}/schema`,
    INDEXES: (name: string) => `/api/collections/${name}/indexes`,
    DOCUMENTS: (name: string) => `/api/collections/${name}/documents`,
    FIELD_STATS: (name: string, field: string) =>
      `/api/collections/${name}/fields/${field}`,
    COUNT: (name: string) => `/api/collections/${name}/count`,
  },
  WEBSOCKET: '/ws',
} as const

export const QUERY_KEYS = {
  METRICS: {
    ALL: ['metrics'] as const,
    DASHBOARD: () => [...QUERY_KEYS.METRICS.ALL, 'dashboard'] as const,
    SLOW_QUERIES: (minMillis?: number) =>
      [...QUERY_KEYS.METRICS.ALL, 'slow-queries', { minMillis }] as const,
    ANALYSIS: () => [...QUERY_KEYS.METRICS.ALL, 'analysis'] as const,
    PROFILING: () => [...QUERY_KEYS.METRICS.ALL, 'profiling'] as const,
  },
  BACKUPS: {
    ALL: ['backups'] as const,
    LIST: () => [...QUERY_KEYS.BACKUPS.ALL, 'list'] as const,
    BY_ID: (id: string) => [...QUERY_KEYS.BACKUPS.ALL, 'detail', id] as const,
  },
  COLLECTIONS: {
    ALL: ['collections'] as const,
    LIST: () => [...QUERY_KEYS.COLLECTIONS.ALL, 'list'] as const,
    BY_NAME: (name: string) =>
      [...QUERY_KEYS.COLLECTIONS.ALL, 'detail', name] as const,
    SCHEMA: (name: string) =>
      [...QUERY_KEYS.COLLECTIONS.ALL, 'schema', name] as const,
    INDEXES: (name: string) =>
      [...QUERY_KEYS.COLLECTIONS.ALL, 'indexes', name] as const,
  },
  HEALTH: {
    ALL: ['health'] as const,
  },
} as const

export const ROUTES = {
  DASHBOARD: '/',
  BACKUPS: '/backups',
  COLLECTIONS: '/collections',
  COLLECTION_DETAIL: (name: string) => `/collections/${name}`,
  SLOW_QUERIES: '/slow-queries',
  SETTINGS: '/settings',
} as const

export const STORAGE_KEYS = {
  UI: 'mongodb-dashboard-ui',
} as const

export const QUERY_CONFIG = {
  STALE_TIME: {
    METRICS: 1000 * 2,
    COLLECTIONS: 1000 * 30,
    BACKUPS: 1000 * 10,
  },
  GC_TIME: {
    DEFAULT: 1000 * 60 * 5,
  },
  RETRY: {
    DEFAULT: 2,
    NONE: 0,
  },
  REFETCH_INTERVAL: {
    METRICS: 1000 * 5,
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
} as const

export type ApiEndpoint = typeof API_ENDPOINTS
export type QueryKey = typeof QUERY_KEYS
export type Route = typeof ROUTES
