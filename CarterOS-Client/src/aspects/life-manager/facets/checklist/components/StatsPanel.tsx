// ===================
// © AngelaMos | 2026
// StatsPanel.tsx
// ===================

import type { ChecklistStatsResponse } from '../types'
import styles from './StatsPanel.module.scss'

interface StatsPanelProps {
  stats: ChecklistStatsResponse
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.streak}>
        <span className={styles.streakCount}>{stats.streak}</span>
        <span className={styles.streakLabel}>day streak</span>
      </div>

      <div className={styles.itemStats}>
        {stats.item_stats.map((stat) => (
          <div key={stat.item_id} className={styles.statRow}>
            <span className={styles.statTitle}>{stat.title}</span>
            <div className={styles.statBar}>
              <div
                className={styles.statFill}
                style={{ width: `${Math.round(stat.completion_rate * 100)}%` }}
              />
            </div>
            <span className={styles.statPct}>
              {Math.round(stat.completion_rate * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
