// ===================
// © AngelaMos | 2026
// ConfirmDeleteModal.tsx
// ===================

import styles from '../pages/NotesPage.module.scss'

interface ConfirmDeleteModalProps {
  deleteType: 'note' | 'folder'
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDeleteModal({
  deleteType,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.confirmOverlay}
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <div
        role="dialog"
        className={styles.confirmModal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h3 className={styles.confirmTitle}>Delete Forever?</h3>
        <p className={styles.confirmText}>
          {deleteType === 'folder'
            ? 'This folder and all its notes will be permanently deleted. This cannot be undone.'
            : 'This note will be permanently deleted. This cannot be undone.'}
        </p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.confirmCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={styles.confirmDelete}
          >
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  )
}
