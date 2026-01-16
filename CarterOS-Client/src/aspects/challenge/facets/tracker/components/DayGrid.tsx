// ===================
// © AngelaMos | 2025
// DayGrid.tsx
// ===================

import { useMemo } from 'react'
import { DayCell } from './DayCell'
import { useTrackerStore } from '../stores/tracker.store'
import type { ChallengeWithStats } from '../types/tracker.types'
import styles from './DayGrid.module.scss'

interface DayGridProps {
  challenge: ChallengeWithStats
}

export function DayGrid({ challenge }: DayGridProps) {
  const selectedDate = useTrackerStore((s) => s.selectedDate)
  const setSelectedDate = useTrackerStore((s) => s.setSelectedDate)

  const days = useMemo(() => {
    const result: {
      dayNumber: number
      date: string
      hasLog: boolean
      isFuture: boolean
      isToday: boolean
    }[] = []

    const startDate = new Date(challenge.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const hasLog = challenge.logs.some((log) => log.log_date === dateStr)
      const isFuture = date > today
      const isToday = date.toDateString() === today.toDateString()

      result.push({
        dayNumber: i + 1,
        date: dateStr,
        hasLog,
        isFuture,
        isToday,
      })
    }

    return result
  }, [challenge.start_date, challenge.logs])

  const handleDayClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>30-Day Grid</span>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} />
            Logged
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendEmpty} />
            Empty
          </span>
        </div>
      </div>
      <div className={styles.grid}>
        {days.map((day) => (
          <DayCell
            key={day.dayNumber}
            dayNumber={day.dayNumber}
            hasLog={day.hasLog}
            isSelected={selectedDate === day.date}
            isFuture={day.isFuture}
            isToday={day.isToday}
            onClick={() => handleDayClick(day.date)}
          />
        ))}
      </div>
    </div>
  )
}
