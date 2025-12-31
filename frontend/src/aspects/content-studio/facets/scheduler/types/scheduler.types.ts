// ===================
// © AngelaMos | 2025
// scheduler.types.ts
// ===================

import type {
  PlatformType,
  ScheduleStatus,
  LatePostStatus,
  MediaType,
  ScheduleMode,
  ContentLibraryType,
  CalendarView,
} from './scheduler.enums'

export interface ConnectedAccount {
  id: string
  late_account_id: string
  platform: PlatformType
  platform_username: string
  platform_display_name?: string
  profile_image_url?: string
  followers_count?: number
  is_active: boolean
  connected_at: string
  last_sync_at?: string
}

export interface ConnectAccountRequest {
  platform: PlatformType
  redirect_url?: string
}

export interface ConnectAccountResponse {
  auth_url: string
  platform: PlatformType
}

export interface MediaAttachment {
  id: string
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  media_type: MediaType
  width?: number
  height?: number
  duration_seconds?: number
  thumbnail_path?: string
  alt_text?: string
  late_media_id?: string
  late_media_url?: string
  display_order: number
  created_at: string
}

export interface ContentLibraryItem {
  id: string
  title?: string
  body?: string
  content_type: ContentLibraryType
  target_platform?: PlatformType
  hashtags: string[]
  mentions: string[]
  tags: string[]
  workflow_session_id?: string
  platform_specific_data?: Record<string, unknown>
  notes?: string
  media_attachments?: MediaAttachment[]
  created_at: string
  updated_at?: string
}

export interface ContentLibraryItemCreate {
  content_type: ContentLibraryType
  title?: string
  body?: string
  target_platform?: PlatformType
  hashtags?: string[]
  mentions?: string[]
  tags?: string[]
  platform_specific_data?: Record<string, unknown>
  notes?: string
}

export interface ContentLibraryItemUpdate {
  title?: string
  body?: string
  target_platform?: PlatformType
  hashtags?: string[]
  mentions?: string[]
  tags?: string[]
  platform_specific_data?: Record<string, unknown>
  notes?: string
}

export interface ContentLibraryListResponse {
  items: ContentLibraryItem[]
  total: number
  skip: number
  limit: number
}

export interface ScheduledPostContent {
  id: string
  title?: string
  body?: string
}

export interface ScheduledPostAccount {
  id: string
  platform: PlatformType
  username: string
  display_name?: string
  profile_image_url?: string
}

export interface ScheduledPost {
  id: string
  content_library_item_id: string
  connected_account_id: string
  platform: PlatformType
  scheduled_for: string
  timezone: string
  status: ScheduleStatus
  late_status?: LatePostStatus
  schedule_mode: ScheduleMode
  batch_id?: string
  late_post_id?: string
  platform_post_id?: string
  platform_post_url?: string
  published_at?: string
  failed_at?: string
  error_message?: string
  retry_count: number
  created_at: string
  content?: ScheduledPostContent
  account?: ScheduledPostAccount
}

export interface ScheduleAccountConfig {
  connected_account_id: string
  scheduled_for: string
  platform_specific_config?: Record<string, unknown>
}

export interface ScheduleSingleRequest {
  content_library_item_id: string
  connected_account_id: string
  scheduled_for: string
  timezone?: string
  platform_specific_config?: Record<string, unknown>
}

export interface ScheduleMultiRequest {
  content_library_item_id: string
  account_schedules: ScheduleAccountConfig[]
  timezone?: string
}

export interface RescheduleRequest {
  scheduled_for: string
  timezone?: string
}

export interface ScheduleBatchResponse {
  batch_id: string
  posts: ScheduledPost[]
}

export interface CalendarRescheduleRequest {
  post_id: string
  scheduled_for: string
  timezone?: string
}

export interface PostAnalytics {
  id: string
  scheduled_post_id: string
  platform: PlatformType
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  impressions: number
  reach: number
  engagement_rate: number
  watch_time_seconds?: number
  avg_watch_percentage?: number
  synced_at: string
}

export interface FollowerStats {
  id: string
  connected_account_id: string
  platform: PlatformType
  recorded_date: string
  follower_count: number
  following_count?: number
  posts_count?: number
  daily_change?: number
  weekly_change?: number
  monthly_change?: number
}

export interface FollowerGrowth {
  current_followers: number
  growth_count: number
  growth_percentage: number
}

export interface FollowerGrowthResponse {
  account_id: string
  period_days: number
  growth: FollowerGrowth
  history: FollowerStats[]
}

export interface PostMetrics {
  total_posts: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  avg_engagement_rate: number
  max_views: number
}

export interface AnalyticsOverview {
  period_days: number
  post_metrics: PostMetrics
  total_followers_by_platform: Record<string, number>
  posts_by_platform: Record<string, number>
  posts_by_status: Record<string, number>
}

export interface BestTimeSlot {
  day_name: string
  hour: number
  avg_engagement: number
  post_count: number
}

export interface HeatmapData {
  avg_engagement: number
  post_count: number
}

export interface BestTimesResponse {
  heatmap: Record<number, Record<number, HeatmapData>>
  top_times: BestTimeSlot[]
}

export interface SyncResponse {
  synced: number
  failed: number
}

export interface CalendarPostItem extends ScheduledPost {
  color?: string
}

export interface SchedulerState {
  connectedAccounts: ConnectedAccount[]
  contentLibrary: ContentLibraryItem[]
  scheduledPosts: ScheduledPost[]
  calendarData: CalendarPostItem[]
  analytics: AnalyticsOverview | null

  selectedAccountIds: string[]
  calendarView: CalendarView
  calendarDate: Date

  isLoading: boolean
  error: string | null
}

export interface SchedulerActions {
  fetchAccounts: () => Promise<void>
  fetchContentLibrary: (params?: ContentLibraryQueryParams) => Promise<void>
  fetchScheduledPosts: (params?: ScheduledPostQueryParams) => Promise<void>
  fetchCalendarData: (from: Date, to: Date) => Promise<void>
  fetchAnalytics: (days?: number) => Promise<void>

  scheduleSingle: (request: ScheduleSingleRequest) => Promise<ScheduledPost>
  scheduleMulti: (request: ScheduleMultiRequest) => Promise<ScheduleBatchResponse>
  reschedulePost: (postId: string, request: RescheduleRequest) => Promise<ScheduledPost>
  cancelPost: (postId: string) => Promise<void>
  publishNow: (postId: string) => Promise<ScheduledPost>

  setCalendarView: (view: CalendarView) => void
  setCalendarDate: (date: Date) => void
  setSelectedAccountIds: (ids: string[]) => void

  clearError: () => void
}

export interface ContentLibraryQueryParams {
  content_type?: ContentLibraryType
  target_platform?: PlatformType
  tags?: string[]
  search?: string
  skip?: number
  limit?: number
}

export interface ScheduledPostQueryParams {
  status?: ScheduleStatus
  platform?: PlatformType
  account_id?: string
  skip?: number
  limit?: number
}
