// ===================
// © AngelaMos | 2025
// TrackerPage.tsx
// ===================

import { useActiveChallenge, useStartChallenge } from '../hooks/useTracker'
import { useTrackerStore, useSelectedLog } from '../stores/tracker.store'
import { TrackerTab } from '../types/tracker.enums'
import {
  ProgressCard,
  DayGrid,
  DailyLogForm,
  EmptyState,
  TabNav,
  AllDaysTable,
} from '../components'
import styles from './TrackerPage.module.scss'

export function TrackerPage() {
  const { data: challenge, isLoading, error } = useActiveChallenge()
  const { mutate: startChallenge, isPending: isStarting } = useStartChallenge()
  const activeTab = useTrackerStore((s) => s.activeTab)
  const selectedDate = useTrackerStore((s) => s.selectedDate)
  const selectedLog = useSelectedLog()

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className={styles.page}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>30 Day Focus Challenge</h1>
          <span className={styles.dayBadge}>Day {challenge.current_day} of 30</span>
        </div>
        <button
          type="button"
          className={styles.restartButton}
          onClick={() => startChallenge({})}
          disabled={isStarting}
        >
          {isStarting ? 'Restarting...' : 'Restart Challenge'}
        </button>
      </header>

      <TabNav />

      {activeTab === TrackerTab.DASHBOARD && (
        <div className={styles.dashboard}>
          <div className={styles.progressCards}>
            <ProgressCard
              title="Content"
              current={challenge.total_content}
              goal={challenge.content_goal}
              percentage={challenge.content_percentage}
            />
            <ProgressCard
              title="Jobs"
              current={challenge.total_jobs}
              goal={challenge.jobs_goal}
              percentage={challenge.jobs_percentage}
            />
          </div>

          <DayGrid challenge={challenge} />

          {selectedDate && (
            <DailyLogForm
              selectedDate={selectedDate}
              existingLog={selectedLog}
            />
          )}
        </div>
      )}

      {activeTab === TrackerTab.ALL_DAYS && (
        <div className={styles.allDays}>
          <AllDaysTable challenge={challenge} />
        </div>
      )}
    </div>
  )
}
