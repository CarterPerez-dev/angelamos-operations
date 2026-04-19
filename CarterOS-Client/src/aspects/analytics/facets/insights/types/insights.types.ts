// ===================
// © AngelaMos | 2026
// insights.types.ts
// ===================

export interface VideoPerformance {
  id: string
  rank: number
  hook: string
  views: number
  engagement_rate: number
  follower_conversion_rate: number
  avg_watch_time: number
  watched_full_video_percentage: number
  date_posted: string
}

export interface PerformanceRankings {
  by_views: VideoPerformance[]
  by_engagement_rate: VideoPerformance[]
  by_follower_conversion: VideoPerformance[]
  by_watch_time: VideoPerformance[]
}

export interface HookAnalysis {
  hook: string
  video_count: number
  avg_views: number
  avg_watch_time: number
  avg_engagement_rate: number
  total_views: number
}

export interface HookInsights {
  top_hooks: HookAnalysis[]
  total_unique_hooks: number
}

export interface CTAAnalysis {
  cta: string
  video_count: number
  avg_shares: number
  avg_new_followers: number
  avg_engagement_rate: number
  total_shares: number
  total_followers: number
}

export interface CTAInsights {
  top_ctas: CTAAnalysis[]
  total_unique_ctas: number
}

export interface TrafficSourceData {
  source: string
  percentage: number
  video_count: number
}

export interface TrafficSourceInsights {
  sources: TrafficSourceData[]
}

export interface SearchQueryData {
  query: string
  percentage: number
  video_count: number
}

export interface SearchQueryInsights {
  queries: SearchQueryData[]
}

export interface CommentWordData {
  word: string
  count: number
  video_count: number
}

export interface CommentWordInsights {
  words: CommentWordData[]
}

export interface VideoLengthRangeData {
  range_label: string
  min_seconds: number
  max_seconds: number
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  avg_watch_percentage: number
}

export interface VideoLengthInsights {
  ranges: VideoLengthRangeData[]
}

export interface HashtagPerformance {
  hashtag: string
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  total_views: number
}

export interface HashtagInsights {
  top_hashtags: HashtagPerformance[]
  total_unique_hashtags: number
}

export interface PostingTimeData {
  day_of_week: string
  hour_of_day: number | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
}

export interface PostingTimeInsights {
  by_day: PostingTimeData[]
  by_hour: PostingTimeData[]
}

export interface TimeSeriesDataPoint {
  date: string
  views: number
  engagement_rate: number
  new_followers: number
  video_count: number
}

export interface TimeSeriesInsights {
  data_points: TimeSeriesDataPoint[]
  date_range: [string, string]
}

export interface OverviewMetrics {
  total_videos: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_bookmarks: number
  total_new_followers: number
  avg_engagement_rate: number
  avg_watch_time: number
  avg_watch_percentage: number
  date_range: [string, string]
}

export interface OverviewInsights {
  metrics: OverviewMetrics
  top_video: VideoPerformance | null
  recent_trend: 'improving' | 'declining' | 'stable'
}

export interface ExportData {
  videos: Record<string, unknown>[]
  total_count: number
  export_date: string
}
