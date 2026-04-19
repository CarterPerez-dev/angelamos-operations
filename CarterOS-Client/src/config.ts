// ===================
// © AngelaMos | 2026
// config.ts
// ===================

const API_VERSION = 'v1'

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `/${API_VERSION}/auth/login`,
    REFRESH: `/${API_VERSION}/auth/refresh`,
    LOGOUT: `/${API_VERSION}/auth/logout`,
    LOGOUT_ALL: `/${API_VERSION}/auth/logout-all`,
    ME: `/${API_VERSION}/auth/me`,
    CHANGE_PASSWORD: `/${API_VERSION}/auth/change-password`,
  },
  USERS: {
    BASE: `/${API_VERSION}/users`,
    BY_ID: (id: string) => `/${API_VERSION}/users/${id}`,
    ME: `/${API_VERSION}/users/me`,
    REGISTER: `/${API_VERSION}/users`,
  },
  ADMIN: {
    USERS: {
      LIST: `/${API_VERSION}/admin/users`,
      CREATE: `/${API_VERSION}/admin/users`,
      BY_ID: (id: string) => `/${API_VERSION}/admin/users/${id}`,
      UPDATE: (id: string) => `/${API_VERSION}/admin/users/${id}`,
      DELETE: (id: string) => `/${API_VERSION}/admin/users/${id}`,
    },
  },
  CHALLENGE: {
    ACTIVE: `/${API_VERSION}/challenge/active`,
    START: `/${API_VERSION}/challenge/start`,
    HISTORY: `/${API_VERSION}/challenge/history`,
    LOGS: {
      CREATE: `/${API_VERSION}/challenge/logs`,
      BY_DATE: (date: string) => `/${API_VERSION}/challenge/logs/${date}`,
      UPDATE: (date: string) => `/${API_VERSION}/challenge/logs/${date}`,
    },
  },
  JOB_TRACKER: {
    LIST: `/${API_VERSION}/career/jobs`,
    STATS: `/${API_VERSION}/career/jobs/stats`,
    FOLLOWUPS: `/${API_VERSION}/career/jobs/followups`,
    BY_STATUS: (status: string) =>
      `/${API_VERSION}/career/jobs/by-status/${status}`,
    BY_OUTCOME: (outcome: string) =>
      `/${API_VERSION}/career/jobs/by-outcome/${outcome}`,
    BY_ID: (id: string) => `/${API_VERSION}/career/jobs/${id}`,
    CREATE: `/${API_VERSION}/career/jobs`,
    UPDATE: (id: string) => `/${API_VERSION}/career/jobs/${id}`,
    DELETE: (id: string) => `/${API_VERSION}/career/jobs/${id}`,
  },
  ANALYTICS: {
    VIDEOS: `/${API_VERSION}/analytics/videos`,
    VIDEO: (id: string) => `/${API_VERSION}/analytics/videos/${id}`,
    SEARCH: `/${API_VERSION}/analytics/videos/search/query`,
    FILTER_DATE_RANGE: `/${API_VERSION}/analytics/videos/filter/date-range`,
    FILTER_MIN_VIEWS: `/${API_VERSION}/analytics/videos/filter/min-views`,
    INSIGHTS: {
      OVERVIEW: `/${API_VERSION}/analytics/insights/overview`,
      RANKINGS: `/${API_VERSION}/analytics/insights/rankings`,
      HOOKS: `/${API_VERSION}/analytics/insights/hooks`,
      CTAS: `/${API_VERSION}/analytics/insights/ctas`,
      TRAFFIC_SOURCES: `/${API_VERSION}/analytics/insights/traffic-sources`,
      SEARCH_QUERIES: `/${API_VERSION}/analytics/insights/search-queries`,
      COMMENT_WORDS: `/${API_VERSION}/analytics/insights/comment-words`,
      VIDEO_LENGTH: `/${API_VERSION}/analytics/insights/video-length`,
      HASHTAGS: `/${API_VERSION}/analytics/insights/hashtags`,
      POSTING_TIME: `/${API_VERSION}/analytics/insights/posting-time`,
      TIME_SERIES: `/${API_VERSION}/analytics/insights/time-series`,
      EXPORT: `/${API_VERSION}/analytics/insights/export`,
      EXPORT_DOWNLOAD: `/${API_VERSION}/analytics/insights/export/download`,
    },
  },
  PLANNER: {
    BLOCKS: `/${API_VERSION}/planner/blocks`,
    BLOCK: (id: string) => `/${API_VERSION}/planner/blocks/${id}`,
  },
  CHECKLIST: {
    ITEMS: `/${API_VERSION}/checklist/items`,
    ITEM: (id: string) => `/${API_VERSION}/checklist/items/${id}`,
    LOG: `/${API_VERSION}/checklist/log`,
    LOG_ENTRY: (id: string) => `/${API_VERSION}/checklist/log/${id}`,
    STATS: `/${API_VERSION}/checklist/stats`,
  },
  NOTES: {
    NOTES: `/${API_VERSION}/notes`,
    NOTE: (id: string) => `/${API_VERSION}/notes/${id}`,
    FOLDERS: `/${API_VERSION}/notes/folders`,
    FOLDER: (id: string) => `/${API_VERSION}/notes/folders/${id}`,
    RESTORE_FOLDER: (id: string) => `/${API_VERSION}/notes/folders/${id}/restore`,
    PERMANENT_DELETE_FOLDER: (id: string) =>
      `/${API_VERSION}/notes/folders/${id}/permanent`,
    DELETED: `/${API_VERSION}/notes/deleted`,
    RESTORE: (id: string) => `/${API_VERSION}/notes/${id}/restore`,
    PERMANENT_DELETE: (id: string) => `/${API_VERSION}/notes/${id}/permanent`,
    BULK_DELETE: `/${API_VERSION}/notes/bulk-delete`,
    BULK_DELETE_FOLDERS: `/${API_VERSION}/notes/folders/bulk-delete`,
  },
} as const

export const ROUTES = {
  ROOT: '/root',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    USER_DETAIL: (id: string) => `/admin/users/${id}`,
  },
  CHALLENGE: {
    TRACKER: '/challenge/tracker',
  },
  DEV_WORKSPACE: {
    DOCKER_MANAGER: '/dev-workspace/docker-manager',
  },
  ANALYTICS: {
    DATA_INPUT: '/analytics/data-input',
    INSIGHTS: '/analytics/insights',
  },
} as const

export const QUERY_KEYS = {
  AUTH: {
    ALL: ['auth'] as const,
    ME: () => [...QUERY_KEYS.AUTH.ALL, 'me'] as const,
  },
  USERS: {
    ALL: ['users'] as const,
    BY_ID: (id: string) => [...QUERY_KEYS.USERS.ALL, 'detail', id] as const,
    ME: () => [...QUERY_KEYS.USERS.ALL, 'me'] as const,
  },
  ADMIN: {
    ALL: ['admin'] as const,
    USERS: {
      ALL: () => [...QUERY_KEYS.ADMIN.ALL, 'users'] as const,
      LIST: (page: number, size: number) =>
        [...QUERY_KEYS.ADMIN.USERS.ALL(), 'list', { page, size }] as const,
      BY_ID: (id: string) =>
        [...QUERY_KEYS.ADMIN.USERS.ALL(), 'detail', id] as const,
    },
  },
  CHALLENGE: {
    ALL: ['challenge'] as const,
    ACTIVE: () => [...QUERY_KEYS.CHALLENGE.ALL, 'active'] as const,
    HISTORY: (page?: number, size?: number) =>
      [...QUERY_KEYS.CHALLENGE.ALL, 'history', { page, size }] as const,
    LOG: (date: string) => [...QUERY_KEYS.CHALLENGE.ALL, 'log', date] as const,
  },
  JOB_TRACKER: {
    ALL: ['job-tracker'] as const,
    LIST: (skip?: number, limit?: number) =>
      [...QUERY_KEYS.JOB_TRACKER.ALL, 'list', { skip, limit }] as const,
    STATS: () => [...QUERY_KEYS.JOB_TRACKER.ALL, 'stats'] as const,
    FOLLOWUPS: () => [...QUERY_KEYS.JOB_TRACKER.ALL, 'followups'] as const,
    BY_STATUS: (status: string) =>
      [...QUERY_KEYS.JOB_TRACKER.ALL, 'by-status', status] as const,
    BY_OUTCOME: (outcome: string) =>
      [...QUERY_KEYS.JOB_TRACKER.ALL, 'by-outcome', outcome] as const,
    BY_ID: (id: string) => [...QUERY_KEYS.JOB_TRACKER.ALL, 'detail', id] as const,
  },
  PLANNER: {
    ALL: ['planner'] as const,
    BLOCKS: (date: string) =>
      [...QUERY_KEYS.PLANNER.ALL, 'blocks', date] as const,
  },
  CHECKLIST: {
    ALL: ['checklist'] as const,
    ITEMS: () => [...QUERY_KEYS.CHECKLIST.ALL, 'items'] as const,
    DAY: (date: string) => [...QUERY_KEYS.CHECKLIST.ALL, 'log', date] as const,
    STATS: () => [...QUERY_KEYS.CHECKLIST.ALL, 'stats'] as const,
  },
  NOTES: {
    ALL: ['notes'] as const,
    LIST: () => [...QUERY_KEYS.NOTES.ALL, 'list'] as const,
    BY_ID: (id: string) => [...QUERY_KEYS.NOTES.ALL, 'detail', id] as const,
    FOLDERS: () => [...QUERY_KEYS.NOTES.ALL, 'folders'] as const,
    DELETED: () => [...QUERY_KEYS.NOTES.ALL, 'deleted'] as const,
  },
} as const

export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  AUTH_UI: 'auth-ui-storage',
} as const

export const QUERY_CONFIG = {
  STALE_TIME: {
    USER: 1000 * 60 * 5,
    STATIC: Infinity,
    FREQUENT: 1000 * 30,
  },
  GC_TIME: {
    DEFAULT: 1000 * 60 * 30,
    LONG: 1000 * 60 * 60,
  },
  RETRY: {
    DEFAULT: 3,
    NONE: 0,
  },
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500,
} as const

export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 100,
} as const

export const APP = {
  NAME: 'CarterOS',
  LOGO: '/assets/logo.webp',
} as const

export const USER = {
  NAME: 'CarterPerez-dev',
  AVATAR: '/assets/user.webp',
} as const

export type ApiEndpoint = typeof API_ENDPOINTS
export type QueryKey = typeof QUERY_KEYS
export type Route = typeof ROUTES
