// ===================
// © AngelaMos | 2025
// deleteModal.tsx
// ===================

import {
  useJobTrackerStore,
  useIsDeleteModalOpen,
  useDeletingApplicationId,
  useIsDeleting,
} from '../stores'
import { useDeleteJobApplication } from '../hooks'
import styles from './deleteModal.module.scss'

export function DeleteModal() {
  const isOpen = useIsDeleteModalOpen()
  const deletingId = useDeletingApplicationId()
  const isDeleting = useIsDeleting()

  const closeModal = useJobTrackerStore((s) => s.closeDeleteModal)
  const setDeleting = useJobTrackerStore((s) => s.setDeleting)

  const deleteMutation = useDeleteJobApplication()

  if (!isOpen || !deletingId) {
    return null
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMutation.mutateAsync(deletingId)
      closeModal()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Delete Application</h2>
        <p className={styles.message}>
          Are you sure you want to delete this application? This action cannot be undone.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={closeModal}
            className={styles.cancelButton}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
