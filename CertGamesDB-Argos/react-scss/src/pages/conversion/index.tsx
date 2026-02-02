// ===================
// AngelaMos | 2026
// conversion/index.tsx
// ===================

import { useConversionRolling, useConversionWeekly, useTimeToConversion } from '@/api'
import { LuDownload } from 'react-icons/lu'
import styles from './conversion.module.scss'

function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function MetricCard({
  label,
  value,
  subValue,
  highlight = false,
}: {
  label: string
  value: string | number
  subValue?: string
  highlight?: boolean
}): React.ReactElement {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={`${styles.metricValue} ${highlight ? styles.highlight : ''}`}>
        {value}
      </span>
      {subValue && (
        <span className={`${styles.metricSub} ${highlight ? styles.highlight : ''}`}>
          {subValue}
        </span>
      )}
    </div>
  )
}

export function Component(): React.ReactElement {
  const { data: rollingData, isLoading: rollingLoading } = useConversionRolling(30)
  const { data: weeklyData, isLoading: weeklyLoading } = useConversionWeekly(12)
  const { data: timeData, isLoading: timeLoading } = useTimeToConversion()

  const isLoading = rollingLoading || weeklyLoading || timeLoading

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading conversion metrics...</div>
      </div>
    )
  }

  const currentConversion = rollingData?.current_conversion
  const rollingPoints = rollingData?.data_points ?? []
  const weeklyCohorts = weeklyData?.cohorts ?? []

  const handleExportAll = () => {
    const allData = {
      exported_at: new Date().toISOString(),
      current_conversion: currentConversion,
      rolling_trend: rollingPoints,
      weekly_cohorts: weeklyCohorts,
      time_to_conversion: timeData,
    }
    downloadJSON(allData, `conversion-data-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleExportRolling = () => {
    downloadJSON(
      { data_points: rollingPoints, current: currentConversion },
      `rolling-conversion-${new Date().toISOString().split('T')[0]}.json`
    )
  }

  const handleExportWeekly = () => {
    downloadJSON(weeklyCohorts, `weekly-cohorts-${new Date().toISOString().split('T')[0]}.json`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Conversion Analytics</h2>
          <p className={styles.subtitle}>
            Track user conversion rates and trends since January 8, 2026
          </p>
        </div>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={handleExportAll}
          disabled={isLoading}
        >
          <LuDownload />
          Export All JSON
        </button>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Current Snapshot</h3>
        </div>
        <div className={styles.grid}>
          <MetricCard
            label="Current Conversion Rate"
            value={currentConversion ? `${currentConversion.conversion_rate.toFixed(2)}%` : 'N/A'}
            subValue={
              currentConversion
                ? `${currentConversion.subscribed_users} / ${currentConversion.total_users}`
                : undefined
            }
            highlight
          />
          <MetricCard
            label="Avg Time to Subscribe"
            value={timeData ? `${timeData.avg_hours.toFixed(1)}h` : 'N/A'}
            subValue={timeData ? `Median: ${timeData.median_hours.toFixed(1)}h` : undefined}
          />
          <MetricCard
            label="Total Converted Users"
            value={currentConversion?.subscribed_users ?? 0}
            highlight
          />
          <MetricCard
            label="Total Users (Since Jan 8)"
            value={currentConversion?.total_users ?? 0}
          />
        </div>
      </section>

      {rollingPoints.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Rolling 100 Trend (Last {rollingPoints.length} Data Points)
            </h3>
            <button
              type="button"
              className={styles.exportBtnSmall}
              onClick={handleExportRolling}
              title="Export rolling trend data as JSON"
            >
              <LuDownload />
            </button>
          </div>
          <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
              <span className={styles.chartLabel}>Conversion Rate %</span>
            </div>
            <div className={styles.chart}>
              {rollingPoints.slice().reverse().map((point) => {
                const maxRate = Math.max(...rollingPoints.map(p => p.conversion_rate), 1)
                const barHeightPercent = (point.conversion_rate / maxRate) * 90
                return (
                  <div key={point.user_count} className={styles.barWrapper}>
                    <div className={styles.bar}>
                      <div
                        className={styles.barFill}
                        style={{ height: `${Math.max(barHeightPercent, 5)}%` }}
                        title={`Users ${point.user_count}: ${point.conversion_rate.toFixed(2)}%`}
                      />
                    </div>
                    <span className={styles.barLabel}>{point.user_count}</span>
                  </div>
                )
              })}
            </div>
            <div className={styles.chartFooter}>
              <span className={styles.axisLabel}>User Count</span>
            </div>
          </div>
        </section>
      )}

      {weeklyCohorts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Weekly Cohorts (Last {weeklyCohorts.length} Weeks)
            </h3>
            <button
              type="button"
              className={styles.exportBtnSmall}
              onClick={handleExportWeekly}
              title="Export weekly cohorts as JSON"
            >
              <LuDownload />
            </button>
          </div>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Total Users</th>
                  <th>Subscribed</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {weeklyCohorts.map((cohort) => (
                  <tr key={cohort.week_label}>
                    <td className={styles.weekLabel}>{cohort.week_label}</td>
                    <td>{cohort.total_users}</td>
                    <td className={styles.subscribed}>{cohort.subscribed_users}</td>
                    <td className={styles.conversionRate}>
                      {cohort.conversion_rate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {timeData && timeData.total_users > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Time to Conversion Stats</h3>
          </div>
          <div className={styles.grid}>
            <MetricCard
              label="Minimum"
              value={`${timeData.min_hours.toFixed(1)}h`}
            />
            <MetricCard
              label="Average"
              value={`${timeData.avg_hours.toFixed(1)}h`}
              highlight
            />
            <MetricCard
              label="Median"
              value={`${timeData.median_hours.toFixed(1)}h`}
              highlight
            />
            <MetricCard
              label="Maximum"
              value={`${timeData.max_hours.toFixed(1)}h`}
            />
          </div>
        </section>
      )}
    </div>
  )
}

Component.displayName = 'Conversion'
