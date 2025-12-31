// ===================
// © AngelaMos | 2025
// AnalyticsPage.tsx
// ===================

import { useState } from 'react'
import {
  useConnectedAccounts,
  useAnalyticsOverview,
  useTopPerformers,
  useBestTimes,
  useFollowerGrowth,
  useFollowerHistory,
  useSyncAnalytics,
  useSyncFollowerStats,
} from '../hooks'
import {
  useSchedulerStore,
  useAnalytics as useAnalyticsStore,
  useIsLoadingAnalytics,
  useSchedulerError,
} from '../stores'
import {
  PlatformType,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_COLORS,
  DAY_NAMES,
} from '../types/scheduler.enums'
import styles from './AnalyticsPage.module.scss'

export function AnalyticsPage() {
  const [selectedDays, setSelectedDays] = useState(30)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const { data: accounts } = useConnectedAccounts()
  const { data: overview, refetch: refetchOverview } = useAnalyticsOverview(selectedDays)
  const { data: topPosts } = useTopPerformers({ days: selectedDays, limit: 5 })
  const { data: bestTimes } = useBestTimes({ days: 90 })
  const { data: followerGrowth } = useFollowerGrowth(selectedAccountId, selectedDays)
  const { data: followerHistory } = useFollowerHistory(selectedDays)

  const syncAnalytics = useSyncAnalytics()
  const syncFollowers = useSyncFollowerStats()

  const analytics = useAnalyticsStore()
  const isLoading = useIsLoadingAnalytics()
  const error = useSchedulerError()
  const { clearError } = useSchedulerStore()

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatPercent = (num: number): string => {
    return `${num.toFixed(2)}%`
  }

  const handleSync = () => {
    syncAnalytics.mutate(7, {
      onSuccess: () => refetchOverview(),
    })
  }

  const handleSyncFollowers = () => {
    syncFollowers.mutate(undefined, {
      onSuccess: () => refetchOverview(),
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Analytics</h1>
          <div className={styles.headerActions}>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className={styles.periodSelect}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              className={styles.syncButton}
              onClick={handleSync}
              disabled={syncAnalytics.isPending}
              type="button"
            >
              {syncAnalytics.isPending ? 'Syncing...' : 'Sync Analytics'}
            </button>
            <button
              className={styles.syncButton}
              onClick={handleSyncFollowers}
              disabled={syncFollowers.isPending}
              type="button"
            >
              {syncFollowers.isPending ? 'Syncing...' : 'Sync Followers'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} type="button">
            Dismiss
          </button>
        </div>
      )}

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading analytics...</div>
        ) : (
          <>
            {overview && (
              <section className={styles.overviewSection}>
                <div className={styles.metricsGrid}>
                  <MetricCard
                    label="Total Posts"
                    value={formatNumber(overview.post_metrics.total_posts)}
                  />
                  <MetricCard
                    label="Total Views"
                    value={formatNumber(overview.post_metrics.total_views)}
                  />
                  <MetricCard
                    label="Total Likes"
                    value={formatNumber(overview.post_metrics.total_likes)}
                  />
                  <MetricCard
                    label="Total Comments"
                    value={formatNumber(overview.post_metrics.total_comments)}
                  />
                  <MetricCard
                    label="Total Shares"
                    value={formatNumber(overview.post_metrics.total_shares)}
                  />
                  <MetricCard
                    label="Avg Engagement"
                    value={formatPercent(overview.post_metrics.avg_engagement_rate)}
                  />
                </div>
              </section>
            )}

            <div className={styles.columnsGrid}>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Top Performing Posts</h2>
                {topPosts && topPosts.length > 0 ? (
                  <div className={styles.topPostsList}>
                    {topPosts.map((post, index) => (
                      <div key={post.id} className={styles.topPostCard}>
                        <span className={styles.rank}>#{index + 1}</span>
                        <div className={styles.postInfo}>
                          <span
                            className={styles.postPlatform}
                            style={{ background: PLATFORM_COLORS[post.platform] }}
                          >
                            {PLATFORM_DISPLAY_NAMES[post.platform]}
                          </span>
                          <div className={styles.postStats}>
                            <span>{formatNumber(post.views)} views</span>
                            <span>{formatNumber(post.likes)} likes</span>
                            <span>{formatPercent(post.engagement_rate)} eng</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>No analytics data yet</div>
                )}
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Best Posting Times</h2>
                {bestTimes && bestTimes.top_times.length > 0 ? (
                  <div className={styles.bestTimesList}>
                    {bestTimes.top_times.slice(0, 5).map((slot, index) => (
                      <div key={index} className={styles.timeSlot}>
                        <span className={styles.timeDay}>{slot.day_name}</span>
                        <span className={styles.timeHour}>
                          {slot.hour}:00 - {slot.hour + 1}:00
                        </span>
                        <span className={styles.timeEngagement}>
                          {formatPercent(slot.avg_engagement)} avg
                        </span>
                        <span className={styles.timePosts}>
                          {slot.post_count} posts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>Not enough data</div>
                )}
              </section>
            </div>

            {accounts && accounts.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Follower Growth</h2>
                  <select
                    value={selectedAccountId || ''}
                    onChange={(e) => setSelectedAccountId(e.target.value || null)}
                    className={styles.accountSelect}
                  >
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {PLATFORM_DISPLAY_NAMES[account.platform]} - @{account.platform_username}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAccountId && followerGrowth ? (
                  <div className={styles.followerGrowthCard}>
                    <div className={styles.growthMetrics}>
                      <div className={styles.growthMetric}>
                        <span className={styles.growthValue}>
                          {formatNumber(followerGrowth.growth.current_followers)}
                        </span>
                        <span className={styles.growthLabel}>Current Followers</span>
                      </div>
                      <div className={styles.growthMetric}>
                        <span
                          className={`${styles.growthValue} ${followerGrowth.growth.growth_count >= 0 ? styles.positive : styles.negative}`}
                        >
                          {followerGrowth.growth.growth_count >= 0 ? '+' : ''}
                          {formatNumber(followerGrowth.growth.growth_count)}
                        </span>
                        <span className={styles.growthLabel}>
                          Growth ({selectedDays} days)
                        </span>
                      </div>
                      <div className={styles.growthMetric}>
                        <span
                          className={`${styles.growthValue} ${followerGrowth.growth.growth_percentage >= 0 ? styles.positive : styles.negative}`}
                        >
                          {followerGrowth.growth.growth_percentage >= 0 ? '+' : ''}
                          {formatPercent(followerGrowth.growth.growth_percentage)}
                        </span>
                        <span className={styles.growthLabel}>Growth Rate</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.empty}>
                    {selectedAccountId
                      ? 'Loading follower data...'
                      : 'Select an account to view growth'}
                  </div>
                )}
              </section>
            )}

            {overview && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Posts by Platform</h2>
                <div className={styles.platformBreakdown}>
                  {Object.entries(overview.posts_by_platform).map(([platform, count]) => (
                    <div key={platform} className={styles.platformStat}>
                      <span
                        className={styles.platformDot}
                        style={{ background: PLATFORM_COLORS[platform as PlatformType] }}
                      />
                      <span className={styles.platformName}>
                        {PLATFORM_DISPLAY_NAMES[platform as PlatformType]}
                      </span>
                      <span className={styles.platformCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Follower History</h2>
              {followerHistory && followerHistory.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Platform</th>
                        <th>Account</th>
                        <th>Followers</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followerHistory.map((stat) => {
                        const account = accounts?.find(
                          (a) => a.id === stat.connected_account_id
                        )
                        return (
                          <tr key={stat.id}>
                            <td>
                              {new Date(stat.recorded_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                              })}
                            </td>
                            <td>
                              <span
                                className={styles.tablePlatform}
                                style={{ background: PLATFORM_COLORS[stat.platform] }}
                              >
                                {PLATFORM_DISPLAY_NAMES[stat.platform]}
                              </span>
                            </td>
                            <td className={styles.tableAccount}>
                              @{account?.platform_username || 'Unknown'}
                            </td>
                            <td className={styles.tableFollowers}>
                              {formatNumber(stat.follower_count)}
                            </td>
                            <td>
                              {stat.daily_change !== null && stat.daily_change !== undefined ? (
                                <span
                                  className={
                                    stat.daily_change > 0
                                      ? styles.changePositive
                                      : stat.daily_change < 0
                                        ? styles.changeNegative
                                        : styles.changeNeutral
                                  }
                                >
                                  {stat.daily_change > 0 ? '+' : ''}
                                  {stat.daily_change}
                                </span>
                              ) : (
                                <span className={styles.changeNeutral}>-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.empty}>
                  No follower history yet. Record counts from the Accounts page.
                </div>
              )}
            </section>
          </>
        )}
      </main>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  )
}
