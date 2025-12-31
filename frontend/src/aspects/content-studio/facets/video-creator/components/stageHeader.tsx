// ===================
// © AngelaMos | 2025
// stageHeader.tsx
// ===================

import styles from './stageHeader.module.scss'

interface StageHeaderProps {
  title: string
  description: string
}

export function StageHeader({ title, description }: StageHeaderProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
