// ===================
// © AngelaMos | 2025
// applicationTable.tsx
// ===================

import { useJobTrackerStore } from '../stores'
import type { JobApplication } from '../types'
import { OUTCOME_COLORS, PRIORITY_COLORS } from '../types'
import styles from './applicationTable.module.scss'

interface ApplicationTableProps {
  applications: JobApplication[]
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
  const openEditForm = useJobTrackerStore((s) => s.openEditForm)
  const openDeleteModal = useJobTrackerStore((s) => s.openDeleteModal)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return '—'
    const fmt = (n: number) => `$${Math.round(n / 1000)}k`
    if (min && max) return `${fmt(min)} - ${fmt(max)}`
    if (min) return `${fmt(min)}+`
    if (max) return `Up to ${fmt(max)}`
    return '—'
  }

  if (!applications || applications.length === 0) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            <th>Status</th>
            <th>Outcome</th>
            <th>Priority</th>
            <th>Interviews</th>
            <th>Salary</th>
            <th>Applied</th>
            <th>Source</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td className={styles.company}>
                <span className={styles.companyName}>{app.identity_name}</span>
                {app.location && (
                  <span className={styles.location}>{app.location}</span>
                )}
              </td>
              <td>
                <span className={styles.position}>{app.position_title}</span>
                {app.remote_type !== 'unknown' && (
                  <span className={styles.remote}>{app.remote_type}</span>
                )}
              </td>
              <td>
                <span className={styles.badge}>{app.application_status}</span>
              </td>
              <td>
                <span
                  className={styles.badge}
                  style={{ color: OUTCOME_COLORS[app.outcome] }}
                >
                  {app.outcome}
                </span>
              </td>
              <td>
                <span
                  className={styles.badge}
                  style={{ color: PRIORITY_COLORS[app.priority] }}
                >
                  {app.priority}
                </span>
              </td>
              <td className={styles.center}>{app.interview_rounds}</td>
              <td>{formatSalary(app.salary_min, app.salary_max)}</td>
              <td>{formatDate(app.date_applied)}</td>
              <td className={styles.source}>{app.source || '—'}</td>
              <td className={styles.actions}>
                <button
                  type="button"
                  onClick={() => openEditForm(app)}
                  className={styles.actionButton}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openDeleteModal(app.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
