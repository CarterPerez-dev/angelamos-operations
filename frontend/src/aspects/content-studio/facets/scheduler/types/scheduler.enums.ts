// ===================
// © AngelaMos | 2025
// scheduler.enums.ts
// ===================

export enum PlatformType {
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  REDDIT = 'reddit',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  PINTEREST = 'pinterest',
  BLUESKY = 'bluesky',
  THREADS = 'threads',
  GOOGLE_BUSINESS = 'google_business',
}

export enum ScheduleStatus {
  DRAFT = 'draft',
  PENDING_SYNC = 'pending_sync',
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum LatePostStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  GIF = 'gif',
  DOCUMENT = 'document',
  THUMBNAIL = 'thumbnail',
}

export enum ScheduleMode {
  SINGLE_PLATFORM = 'single_platform',
  MULTI_PLATFORM = 'multi_platform',
}

export enum ContentLibraryType {
  VIDEO_SCRIPT = 'video_script',
  TEXT_POST = 'text_post',
  THREAD = 'thread',
  CAROUSEL = 'carousel',
  STORY = 'story',
  REEL = 'reel',
}

export enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
}

export const SCHEDULER_API = {
  ACCOUNTS: '/v1/content-studio/scheduler/accounts',
  ACCOUNTS_CONNECT: '/v1/content-studio/scheduler/accounts/connect',
  ACCOUNTS_SYNC: '/v1/content-studio/scheduler/accounts/sync',
  LIBRARY: '/v1/content-studio/scheduler/library',
  POSTS: '/v1/content-studio/scheduler/posts',
  POSTS_MULTI: '/v1/content-studio/scheduler/posts/multi',
  POSTS_UPCOMING: '/v1/content-studio/scheduler/posts/upcoming',
  POSTS_SYNC: '/v1/content-studio/scheduler/posts/sync',
  CALENDAR: '/v1/content-studio/scheduler/calendar',
  CALENDAR_RESCHEDULE: '/v1/content-studio/scheduler/calendar/reschedule',
  ANALYTICS_OVERVIEW: '/v1/content-studio/scheduler/analytics/overview',
  ANALYTICS_POSTS: '/v1/content-studio/scheduler/analytics/posts',
  ANALYTICS_TOP: '/v1/content-studio/scheduler/analytics/posts/top',
  ANALYTICS_BEST_TIMES: '/v1/content-studio/scheduler/analytics/best-times',
  ANALYTICS_FOLLOWERS: '/v1/content-studio/scheduler/analytics/followers',
  ANALYTICS_SYNC: '/v1/content-studio/scheduler/analytics/sync',
  ANALYTICS_SYNC_FOLLOWERS: '/v1/content-studio/scheduler/analytics/sync/followers',
} as const

export const PLATFORM_DISPLAY_NAMES: Record<PlatformType, string> = {
  [PlatformType.TIKTOK]: 'TikTok',
  [PlatformType.YOUTUBE]: 'YouTube',
  [PlatformType.INSTAGRAM]: 'Instagram',
  [PlatformType.REDDIT]: 'Reddit',
  [PlatformType.LINKEDIN]: 'LinkedIn',
  [PlatformType.TWITTER]: 'X (Twitter)',
  [PlatformType.FACEBOOK]: 'Facebook',
  [PlatformType.PINTEREST]: 'Pinterest',
  [PlatformType.BLUESKY]: 'Bluesky',
  [PlatformType.THREADS]: 'Threads',
  [PlatformType.GOOGLE_BUSINESS]: 'Google Business',
}

export const PLATFORM_COLORS: Record<PlatformType, string> = {
  [PlatformType.TIKTOK]: '#000000',
  [PlatformType.YOUTUBE]: '#FF0000',
  [PlatformType.INSTAGRAM]: '#E4405F',
  [PlatformType.REDDIT]: '#FF4500',
  [PlatformType.LINKEDIN]: '#0A66C2',
  [PlatformType.TWITTER]: '#1DA1F2',
  [PlatformType.FACEBOOK]: '#1877F2',
  [PlatformType.PINTEREST]: '#BD081C',
  [PlatformType.BLUESKY]: '#0085FF',
  [PlatformType.THREADS]: '#000000',
  [PlatformType.GOOGLE_BUSINESS]: '#4285F4',
}

export const STATUS_DISPLAY_NAMES: Record<ScheduleStatus, string> = {
  [ScheduleStatus.DRAFT]: 'Draft',
  [ScheduleStatus.PENDING_SYNC]: 'Pending',
  [ScheduleStatus.SCHEDULED]: 'Scheduled',
  [ScheduleStatus.PUBLISHING]: 'Publishing',
  [ScheduleStatus.PUBLISHED]: 'Published',
  [ScheduleStatus.FAILED]: 'Failed',
  [ScheduleStatus.CANCELLED]: 'Cancelled',
}

export const STATUS_COLORS: Record<ScheduleStatus, string> = {
  [ScheduleStatus.DRAFT]: '#6B7280',
  [ScheduleStatus.PENDING_SYNC]: '#F59E0B',
  [ScheduleStatus.SCHEDULED]: '#3B82F6',
  [ScheduleStatus.PUBLISHING]: '#8B5CF6',
  [ScheduleStatus.PUBLISHED]: '#10B981',
  [ScheduleStatus.FAILED]: '#EF4444',
  [ScheduleStatus.CANCELLED]: '#9CA3AF',
}

export const CONTENT_TYPE_DISPLAY_NAMES: Record<ContentLibraryType, string> = {
  [ContentLibraryType.VIDEO_SCRIPT]: 'Video Script',
  [ContentLibraryType.TEXT_POST]: 'Text Post',
  [ContentLibraryType.THREAD]: 'Thread',
  [ContentLibraryType.CAROUSEL]: 'Carousel',
  [ContentLibraryType.STORY]: 'Story',
  [ContentLibraryType.REEL]: 'Reel',
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
