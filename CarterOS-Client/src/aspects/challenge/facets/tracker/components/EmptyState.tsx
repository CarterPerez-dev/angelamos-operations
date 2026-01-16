// ===================
// © AngelaMos | 2025
// EmptyState.tsx
// ===================

import { useStartChallenge } from '../hooks/useTracker'
import { useTrackerStore } from '../stores/tracker.store'
import { CHALLENGE_DEFAULTS } from '../types/tracker.enums'
import styles from './EmptyState.module.scss'

export function EmptyState() {
  const { mutate: startChallenge, isPending } = useStartChallenge()
  const isStarting = useTrackerStore((s) => s.isStarting)

  const handleStart = () => {
    startChallenge({})
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>1,500/1,000 Challenge</h2>
        <p className={styles.description}>
          No active challenge. Ready to begin?
        </p>
        <button
          type="button"
          className={styles.startButton}
          onClick={handleStart}
          disabled={isPending || isStarting}
        >
          {isPending || isStarting ? 'Starting...' : 'Start Challenge'}
        </button>
        <p className={styles.info}>
          {CHALLENGE_DEFAULTS.DURATION_DAYS} days to create{' '}
          {CHALLENGE_DEFAULTS.CONTENT_GOAL.toLocaleString()} content pieces and
          apply to {CHALLENGE_DEFAULTS.JOBS_GOAL.toLocaleString()} jobs
        </p>
      </div>
    </div>
  )
}
