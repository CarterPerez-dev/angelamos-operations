// ===================
// © AngelaMos | 2026
// insightsPage.tsx
// ===================

import {
  GiChart,
  GiSparkles,
  GiCloudDownload,
  GiTrophy,
} from 'react-icons/gi'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'
import {
  useOverviewInsights,
  useHookInsights,
  useCTAInsights,
  useHashtagInsights,
  usePostingTimeInsights,
  useTimeSeriesInsights,
  downloadExport,
} from '../hooks/useInsights'
import styles from './insightsPage.module.scss'

export function InsightsPage() {
  const { data: overview, isLoading: overviewLoading } = useOverviewInsights()
  const { data: hooks, isLoading: hooksLoading } = useHookInsights()
  const { data: ctas, isLoading: ctasLoading } = useCTAInsights()
  const { data: hashtags, isLoading: hashtagsLoading } = useHashtagInsights()
  const { data: postingTime, isLoading: postingTimeLoading } = usePostingTimeInsights()
  const { data: timeSeries, isLoading: timeSeriesLoading } = useTimeSeriesInsights()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const handleExport = async () => {
    try {
      await downloadExport()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <GiChart />
            TikTok Analytics Insights
          </h1>
          <button
            type="button"
            onClick={handleExport}
            className={styles.exportBtn}
          >
            <GiCloudDownload />
            Export Data
          </button>
        </div>
        <p className={styles.subtitle}>
          Discover patterns and insights from your tracked videos
        </p>
      </header>

      {overviewLoading ? (
        <div className={styles.loading}>Loading insights...</div>
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <GiSparkles />
              Overview
            </h2>
            {overview && (
              <div className={styles.overviewGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Videos</div>
                  <div className={styles.metricValue}>{overview.metrics.total_videos}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Views</div>
                  <div className={styles.metricValue}>{formatNumber(overview.metrics.total_views)}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Avg Engagement Rate</div>
                  <div className={styles.metricValue}>{overview.metrics.avg_engagement_rate.toFixed(1)}%</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Avg Watch Time</div>
                  <div className={styles.metricValue}>{overview.metrics.avg_watch_time.toFixed(1)}s</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Total Followers Gained</div>
                  <div className={styles.metricValue}>{formatNumber(overview.metrics.total_new_followers)}</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>Performance Trend</div>
                  <div className={`${styles.metricValue} ${styles.trend}`}>
                    {overview.recent_trend === 'improving' && <LuTrendingUp className={styles.trendUp} />}
                    {overview.recent_trend === 'declining' && <LuTrendingDown className={styles.trendDown} />}
                    {overview.recent_trend}
                  </div>
                </div>
              </div>
            )}
          </section>

          {!timeSeriesLoading && timeSeries && timeSeries.data_points.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Performance Over Time</h2>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div>Date</div>
                  <div>Views</div>
                  <div>Engagement Rate</div>
                  <div>New Followers</div>
                  <div>Videos Posted</div>
                </div>
                {timeSeries.data_points.map((point) => (
                  <div key={point.date} className={styles.tableRow}>
                    <div className={styles.dateCol}>
                      {new Date(point.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className={styles.numberCol}>{formatNumber(point.views)}</div>
                    <div className={styles.numberCol}>{point.engagement_rate.toFixed(1)}%</div>
                    <div className={styles.numberCol}>{formatNumber(point.new_followers)}</div>
                    <div className={styles.numberCol}>{point.video_count}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!hooksLoading && hooks && hooks.top_hooks.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <GiTrophy />
                Top Performing Hooks
              </h2>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankCol}>Rank</div>
                  <div className={styles.hookCol}>Hook</div>
                  <div>Videos</div>
                  <div>Avg Views</div>
                  <div>Avg Engagement</div>
                  <div>Total Views</div>
                </div>
                {hooks.top_hooks.slice(0, 15).map((hook, index) => (
                  <div key={hook.hook} className={styles.tableRow}>
                    <div className={styles.rankCol}>#{index + 1}</div>
                    <div className={styles.hookCol}>{hook.hook}</div>
                    <div className={styles.numberCol}>{hook.video_count}</div>
                    <div className={styles.numberCol}>{formatNumber(hook.avg_views)}</div>
                    <div className={styles.numberCol}>{hook.avg_engagement_rate.toFixed(1)}%</div>
                    <div className={styles.numberCol}>{formatNumber(hook.total_views)}</div>
                  </div>
                ))}
              </div>
              <div className={styles.insightText}>
                Found {hooks.total_unique_hooks} unique hooks across all videos
              </div>
            </section>
          )}

          {!hashtagsLoading && hashtags && hashtags.top_hashtags.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Top Hashtags</h2>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankCol}>Rank</div>
                  <div className={styles.hashtagCol}>Hashtag</div>
                  <div>Videos</div>
                  <div>Avg Views</div>
                  <div>Avg Engagement</div>
                  <div>Total Views</div>
                </div>
                {hashtags.top_hashtags.slice(0, 15).map((tag, index) => (
                  <div key={tag.hashtag} className={styles.tableRow}>
                    <div className={styles.rankCol}>#{index + 1}</div>
                    <div className={styles.hashtagCol}>#{tag.hashtag}</div>
                    <div className={styles.numberCol}>{tag.video_count}</div>
                    <div className={styles.numberCol}>{formatNumber(tag.avg_views)}</div>
                    <div className={styles.numberCol}>{tag.avg_engagement_rate.toFixed(1)}%</div>
                    <div className={styles.numberCol}>{formatNumber(tag.total_views)}</div>
                  </div>
                ))}
              </div>
              <div className={styles.insightText}>
                Found {hashtags.total_unique_hashtags} unique hashtags
              </div>
            </section>
          )}

          {!ctasLoading && ctas && ctas.top_ctas.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Call-to-Action Performance</h2>
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div className={styles.rankCol}>Rank</div>
                  <div className={styles.ctaCol}>CTA</div>
                  <div>Videos</div>
                  <div>Avg Shares</div>
                  <div>Avg Followers</div>
                  <div>Avg Engagement</div>
                </div>
                {ctas.top_ctas.slice(0, 15).map((cta, index) => (
                  <div key={cta.cta} className={styles.tableRow}>
                    <div className={styles.rankCol}>#{index + 1}</div>
                    <div className={styles.ctaCol}>{cta.cta}</div>
                    <div className={styles.numberCol}>{cta.video_count}</div>
                    <div className={styles.numberCol}>{formatNumber(cta.avg_shares)}</div>
                    <div className={styles.numberCol}>{formatNumber(cta.avg_new_followers)}</div>
                    <div className={styles.numberCol}>{cta.avg_engagement_rate.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
              <div className={styles.insightText}>
                Found {ctas.total_unique_ctas} unique CTAs
              </div>
            </section>
          )}

          {!postingTimeLoading && postingTime && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Best Time to Post</h2>
              <div className={styles.timeGrid}>
                <div>
                  <h3 className={styles.subheading}>By Day of Week</h3>
                  <div className={styles.table}>
                    <div className={styles.tableHeader}>
                      <div className={styles.rankCol}>Rank</div>
                      <div>Day</div>
                      <div>Avg Views</div>
                      <div>Avg Engagement</div>
                      <div>Videos</div>
                    </div>
                    {postingTime.by_day
                      .slice()
                      .sort((a, b) => b.avg_views - a.avg_views)
                      .map((day, index) => (
                        <div key={day.day_of_week} className={styles.tableRow}>
                          <div className={styles.rankCol}>#{index + 1}</div>
                          <div className={styles.dayCol}>{day.day_of_week}</div>
                          <div className={styles.numberCol}>{formatNumber(day.avg_views)}</div>
                          <div className={styles.numberCol}>{day.avg_engagement_rate.toFixed(1)}%</div>
                          <div className={styles.numberCol}>{day.video_count}</div>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className={styles.subheading}>By Hour of Day</h3>
                  <div className={styles.table}>
                    <div className={styles.tableHeader}>
                      <div className={styles.rankCol}>Rank</div>
                      <div>Hour</div>
                      <div>Avg Views</div>
                      <div>Avg Engagement</div>
                      <div>Videos</div>
                    </div>
                    {postingTime.by_hour
                      .filter((h) => h.hour_of_day !== null)
                      .slice()
                      .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
                      .slice(0, 10)
                      .map((hour, index) => (
                        <div key={hour.hour_of_day} className={styles.tableRow}>
                          <div className={styles.rankCol}>#{index + 1}</div>
                          <div className={styles.hourCol}>
                            {hour.hour_of_day}:00 - {hour.hour_of_day! + 1}:00
                          </div>
                          <div className={styles.numberCol}>{formatNumber(hour.avg_views)}</div>
                          <div className={styles.numberCol}>{hour.avg_engagement_rate.toFixed(1)}%</div>
                          <div className={styles.numberCol}>{hour.video_count}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
