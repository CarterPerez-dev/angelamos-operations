// ===================
// © AngelaMos | 2025
// DayCell.tsx
// ===================

import styles from './DayCell.module.scss'

interface DayCellProps {
  dayNumber: number
  hasLog: boolean
  isSelected: boolean
  isFuture: boolean
  isToday: boolean
  onClick: () => void
}

export function DayCell({
  dayNumber,
  hasLog,
  isSelected,
  isFuture,
  isToday,
  onClick,
}: DayCellProps) {
  const cellClasses = [
    styles.cell,
    hasLog ? styles.logged : '',
    isSelected ? styles.selected : '',
    isFuture ? styles.future : '',
    isToday ? styles.today : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={cellClasses}
      onClick={onClick}
      disabled={isFuture}
    >
      <span className={styles.number}>{dayNumber}</span>
      {hasLog && <span className={styles.indicator} />}
    </button>
  )
}
