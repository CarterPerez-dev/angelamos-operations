// ===================
// © AngelaMos | 2026
// HeatmapGrid.tsx
// ===================

import type { HeatmapDay } from '../types'
import styles from './HeatmapGrid.module.scss'

interface HeatmapGridProps {
  heatmap: HeatmapDay[]
}

function buildYearGrid(): string[] {
  const today = new Date()
  const year = today.getFullYear()
  const days: string[] = []
  const d = new Date(year, 0, 1)
  while (d.getFullYear() === year) {
    days.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return days
}

export function HeatmapGrid({ heatmap }: HeatmapGridProps) {
  const dayMap = new Map(heatmap.map((h) => [h.date, h]))
  const yearDays = buildYearGrid()

  return (
    <div className={styles.grid}>
      {yearDays.map((dateStr) => {
        const day = dayMap.get(dateStr)
        const ratio = day && day.total_count > 0
          ? day.completed_count / day.total_count
          : 0

        return (
          <div
            key={dateStr}
            className={styles.cell}
            title={day ? `${dateStr}: ${day.completed_count}/${day.total_count}` : dateStr}
            style={{ opacity: ratio > 0 ? 0.15 + ratio * 0.85 : 0.08 }}
          />
        )
      })}
    </div>
  )
}
