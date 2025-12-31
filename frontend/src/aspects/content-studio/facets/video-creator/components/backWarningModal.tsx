// ===================
// © AngelaMos | 2025
// backWarningModal.tsx
// ===================

import { GiNuclearBomb } from 'react-icons/gi'
import styles from './backWarningModal.module.scss'

interface BackWarningModalProps {
  isOpen: boolean
  currentStage: string
  targetStage: string
  onConfirm: () => void
  onCancel: () => void
}

export function BackWarningModal({
  isOpen,
  currentStage,
  targetStage,
  onConfirm,
  onCancel,
}: BackWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <GiNuclearBomb className={styles.warningIcon} />
        </div>

        <h2 className={styles.title}>Go Back?</h2>

        <p className={styles.message}>
          Going back to <strong>{targetStage}</strong> will discard all progress
          from <strong>{currentStage}</strong> onward.
        </p>

        <p className={styles.subMessage}>
          This action cannot be undone.
        </p>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            type="button"
          >
            Stay Here
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            type="button"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
