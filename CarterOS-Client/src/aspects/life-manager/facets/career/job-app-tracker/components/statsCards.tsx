// ===================
// © AngelaMos | 2025
// statsCards.tsx
// ===================

import type { JobApplicationStats } from '../types'
import styles from './statsCards.module.scss'

interface StatsCardsProps {
  stats: JobApplicationStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const responseRate =
    stats.applied > 0
      ? Math.round(((stats.interviews + stats.offers + stats.rejected) / stats.applied) * 100)
      : 0

  const interviewRate =
    stats.applied > 0 ? Math.round((stats.interviews / stats.applied) * 100) : 0

  const offerRate =
    stats.interviews > 0 ? Math.round((stats.offers / stats.interviews) * 100) : 0

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.value}>{stats.total}</span>
        <span className={styles.label}>Total</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{stats.applied}</span>
        <span className={styles.label}>Applied</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{stats.interviews}</span>
        <span className={styles.label}>Interviews</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{stats.offers}</span>
        <span className={styles.label}>Offers</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{stats.rejected}</span>
        <span className={styles.label}>Rejected</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{stats.ghosted}</span>
        <span className={styles.label}>Ghosted</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{responseRate}%</span>
        <span className={styles.label}>Response Rate</span>
      </div>
      <div className={styles.card}>
        <span className={styles.value}>{interviewRate}%</span>
        <span className={styles.label}>Interview Rate</span>
      </div>
    </div>
  )
}
