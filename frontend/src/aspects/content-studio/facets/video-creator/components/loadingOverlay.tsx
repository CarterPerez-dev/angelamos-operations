// ===================
// © AngelaMos | 2025
// loadingOverlay.tsx
// ===================

import styles from './loadingOverlay.module.scss'

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  )
}
