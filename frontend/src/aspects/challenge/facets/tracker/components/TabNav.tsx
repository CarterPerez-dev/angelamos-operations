// ===================
// © AngelaMos | 2025
// TabNav.tsx
// ===================

import { useTrackerStore } from '../stores/tracker.store'
import { TrackerTab } from '../types/tracker.enums'
import styles from './TabNav.module.scss'

export function TabNav() {
  const activeTab = useTrackerStore((s) => s.activeTab)
  const setActiveTab = useTrackerStore((s) => s.setActiveTab)

  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === TrackerTab.DASHBOARD ? styles.active : ''}`}
        onClick={() => setActiveTab(TrackerTab.DASHBOARD)}
      >
        Dashboard
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === TrackerTab.ALL_DAYS ? styles.active : ''}`}
        onClick={() => setActiveTab(TrackerTab.ALL_DAYS)}
      >
        All Days
      </button>
    </div>
  )
}
