// ===================
// © AngelaMos | 2025
// filterBar.tsx
// ===================

import { useJobTrackerFilters, useJobTrackerStore } from '../stores'
import type { ApplicationStatus, Outcome, Priority } from '../types'
import {
  APPLICATION_STATUS_OPTIONS,
  OUTCOME_OPTIONS,
  PRIORITY_OPTIONS,
} from '../types'
import styles from './filterBar.module.scss'

export function FilterBar() {
  const filters = useJobTrackerFilters()
  const setFilters = useJobTrackerStore((s) => s.setFilters)
  const setSearch = useJobTrackerStore((s) => s.setSearch)
  const clearFilters = useJobTrackerStore((s) => s.clearFilters)
  const openCreateForm = useJobTrackerStore((s) => s.openCreateForm)

  const hasActiveFilters =
    filters.search || filters.status || filters.outcome || filters.priority

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <input
          type="text"
          placeholder="Search applications..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters({
              status: (e.target.value || null) as ApplicationStatus | null,
            })
          }
          className={styles.select}
        >
          <option value="">All Statuses</option>
          {APPLICATION_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.outcome ?? ''}
          onChange={(e) =>
            setFilters({
              outcome: (e.target.value || null) as Outcome | null,
            })
          }
          className={styles.select}
        >
          <option value="">All Outcomes</option>
          {OUTCOME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority ?? ''}
          onChange={(e) =>
            setFilters({
              priority: (e.target.value || null) as Priority | null,
            })
          }
          className={styles.select}
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className={styles.clearButton}
          >
            Clear
          </button>
        )}
      </div>

      <button type="button" onClick={openCreateForm} className={styles.addButton}>
        Add Application
      </button>
    </div>
  )
}
