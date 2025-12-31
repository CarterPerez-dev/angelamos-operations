// ===================
// © AngelaMos | 2025
// navigationButtons.tsx
// ===================

import styles from './navigationButtons.module.scss'

interface NavigationButtonsProps {
  onBack?: () => void
  onNext?: () => void
  backDisabled?: boolean
  nextDisabled?: boolean
  backLabel?: string
  nextLabel?: string
  showBack?: boolean
  showNext?: boolean
}

export function NavigationButtons({
  onBack,
  onNext,
  backDisabled = false,
  nextDisabled = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  showBack = true,
  showNext = true,
}: NavigationButtonsProps) {
  return (
    <div className={styles.container}>
      {showBack && (
        <button
          className={styles.backButton}
          onClick={onBack}
          disabled={backDisabled}
          type="button"
        >
          <span className={styles.chevron}>‹</span>
          {backLabel}
        </button>
      )}

      {showNext && (
        <button
          className={styles.nextButton}
          onClick={onNext}
          disabled={nextDisabled}
          type="button"
        >
          {nextLabel}
          <span className={styles.chevron}>›</span>
        </button>
      )}
    </div>
  )
}
