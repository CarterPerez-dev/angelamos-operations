// ===================
// © AngelaMos | 2025
// emptyState.tsx
// ===================

import { useJobTrackerStore } from '../stores'
import styles from './emptyState.module.scss'

export function EmptyState() {
  const openCreateForm = useJobTrackerStore((s) => s.openCreateForm)

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>No applications yet</h2>
      <p className={styles.message}>
        Start tracking your job applications to see stats and manage your job
        hunt.
      </p>
      <button type="button" onClick={openCreateForm} className={styles.button}>
        Add First Application
      </button>
    </div>
  )
}
