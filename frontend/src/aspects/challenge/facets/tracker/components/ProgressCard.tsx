// ===================
// © AngelaMos | 2025
// ProgressCard.tsx
// ===================

import styles from './ProgressCard.module.scss'

interface ProgressCardProps {
  title: string
  current: number
  goal: number
  percentage: number
}

export function ProgressCard({
  title,
  current,
  goal,
  percentage,
}: ProgressCardProps) {
  const clampedPercentage = Math.min(percentage, 100)

  return (
    <div className={styles.card}>
      <span className={styles.title}>{title}</span>
      <div className={styles.stats}>
        <span className={styles.current}>{current.toLocaleString()}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.goal}>{goal.toLocaleString()}</span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
    </div>
  )
}
