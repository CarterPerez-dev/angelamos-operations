// ===================
// © AngelaMos | 2025
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
  SCHEDULER: {
    ACCOUNTS: {
      LIST: `/${API_VERSION}/content-studio/scheduler/accounts`,
      CONNECT: (platform: string) => `/${API_VERSION}/content-studio/scheduler/accounts/connect/${platform}`,
      DISCONNECT: (id: string) => `/${API_VERSION}/content-studio/scheduler/accounts/${id}`,
      SYNC: `/${API_VERSION}/content-studio/scheduler/accounts/sync`,
    },
    LIBRARY: {
      LIST: `/${API_VERSION}/content-studio/scheduler/library`,
      CREATE: `/${API_VERSION}/content-studio/scheduler/library`,
      BY_ID: (id: string) => `/${API_VERSION}/content-studio/scheduler/library/${id}`,
      UPDATE: (id: string) => `/${API_VERSION}/content-studio/scheduler/library/${id}`,
      DELETE: (id: string) => `/${API_VERSION}/content-studio/scheduler/library/${id}`,
      MEDIA: (id: string) => `/${API_VERSION}/content-studio/scheduler/library/${id}/media`,
      DELETE_MEDIA: (id: string) => `/${API_VERSION}/content-studio/scheduler/library/media/${id}`,
    },
    POSTS: {
      CREATE: `/${API_VERSION}/content-studio/scheduler/posts`,
      MULTI: `/${API_VERSION}/content-studio/scheduler/posts/multi`,
      UPCOMING: `/${API_VERSION}/content-studio/scheduler/posts/upcoming`,
      BATCH: (id: string) => `/${API_VERSION}/content-studio/scheduler/posts/batch/${id}`,
      BY_ID: (id: string) => `/${API_VERSION}/content-studio/scheduler/posts/${id}`,
      UPDATE: (id: string) => `/${API_VERSION}/content-studio/scheduler/posts/${id}`,
      CANCEL: (id: string) => `/${API_VERSION}/content-studio/scheduler/posts/${id}`,
      PUBLISH: (id: string) => `/${API_VERSION}/content-studio/scheduler/posts/${id}/publish`,
    },
    CALENDAR: {
      DATA: `/${API_VERSION}/content-studio/scheduler/calendar`,
      RESCHEDULE: `/${API_VERSION}/content-studio/scheduler/calendar/reschedule`,
    },
    ANALYTICS: {
      OVERVIEW: `/${API_VERSION}/content-studio/scheduler/analytics/overview`,
      POSTS: `/${API_VERSION}/content-studio/scheduler/analytics/posts`,
      TOP: `/${API_VERSION}/content-studio/scheduler/analytics/posts/top`,
      BEST_TIMES: `/${API_VERSION}/content-studio/scheduler/analytics/best-times`,
      FOLLOWERS: (id: string) => `/${API_VERSION}/content-studio/scheduler/analytics/followers/${id}`,
      FOLLOWERS_HISTORY: `/${API_VERSION}/content-studio/scheduler/analytics/followers/history`,
      RECORD_FOLLOWERS: `/${API_VERSION}/content-studio/scheduler/analytics/followers/record`,
      RECORD_FOLLOWERS_BULK: `/${API_VERSION}/content-studio/scheduler/analytics/followers/record/bulk`,
      SYNC: `/${API_VERSION}/content-studio/scheduler/analytics/sync`,
      SYNC_FOLLOWERS: `/${API_VERSION}/content-studio/scheduler/analytics/sync/followers`,
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
  CONTENT_STUDIO: {
    TIKTOK_NEW: '/content-studio/tiktok/new',
    TIKTOK_SESSION: (id: string) => `/content-studio/tiktok/session/${id}`,
    SCHEDULER: {
      CALENDAR: '/content-studio/scheduler/calendar',
      LIBRARY: '/content-studio/scheduler/library',
      SCHEDULE: '/content-studio/scheduler/schedule',
      ACCOUNTS: '/content-studio/scheduler/accounts',
      ANALYTICS: '/content-studio/scheduler/analytics',
    },
  },
  CHALLENGE: {
    TRACKER: '/challenge/tracker',
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
  TIKTOK: {
    ALL: ['tiktok'] as const,
    SESSION: (id: string) => [...QUERY_KEYS.TIKTOK.ALL, 'session', id] as const,
    IDEAS: () => [...QUERY_KEYS.TIKTOK.ALL, 'ideas'] as const,
    HOOKS: () => [...QUERY_KEYS.TIKTOK.ALL, 'hooks'] as const,
  },
  SCHEDULER: {
    ALL: ['scheduler'] as const,
    ACCOUNTS: () => [...QUERY_KEYS.SCHEDULER.ALL, 'accounts'] as const,
    LIBRARY: {
      ALL: () => [...QUERY_KEYS.SCHEDULER.ALL, 'library'] as const,
      LIST: (params?: { content_type?: string; platform?: string; search?: string }) =>
        [...QUERY_KEYS.SCHEDULER.LIBRARY.ALL(), 'list', params ?? {}] as const,
      BY_ID: (id: string) => [...QUERY_KEYS.SCHEDULER.LIBRARY.ALL(), 'detail', id] as const,
    },
    POSTS: {
      ALL: () => [...QUERY_KEYS.SCHEDULER.ALL, 'posts'] as const,
      UPCOMING: (limit?: number) =>
        [...QUERY_KEYS.SCHEDULER.POSTS.ALL(), 'upcoming', { limit }] as const,
      BY_ID: (id: string) => [...QUERY_KEYS.SCHEDULER.POSTS.ALL(), 'detail', id] as const,
      BATCH: (id: string) => [...QUERY_KEYS.SCHEDULER.POSTS.ALL(), 'batch', id] as const,
    },
    CALENDAR: (from: string, to: string, accountIds?: string[]) =>
      [...QUERY_KEYS.SCHEDULER.ALL, 'calendar', { from, to, accountIds }] as const,
    ANALYTICS: {
      ALL: () => [...QUERY_KEYS.SCHEDULER.ALL, 'analytics'] as const,
      OVERVIEW: (days?: number) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'overview', { days }] as const,
      POSTS: (params?: { platform?: string; days?: number }) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'posts', params ?? {}] as const,
      TOP: (params?: { platform?: string; days?: number; limit?: number }) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'top', params ?? {}] as const,
      BEST_TIMES: (params?: { platform?: string; days?: number }) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'best-times', params ?? {}] as const,
      FOLLOWERS: (accountId: string, days?: number) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'followers', accountId, { days }] as const,
      FOLLOWERS_HISTORY: (days?: number) =>
        [...QUERY_KEYS.SCHEDULER.ANALYTICS.ALL(), 'followers-history', { days }] as const,
    },
  },
  CHALLENGE: {
    ALL: ['challenge'] as const,
    ACTIVE: () => [...QUERY_KEYS.CHALLENGE.ALL, 'active'] as const,
    HISTORY: (page?: number, size?: number) =>
      [...QUERY_KEYS.CHALLENGE.ALL, 'history', { page, size }] as const,
    LOG: (date: string) => [...QUERY_KEYS.CHALLENGE.ALL, 'log', date] as const,
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
