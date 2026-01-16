// ===================
// © AngelaMos | 2025
// JobTrackerPage.tsx
// ===================

import { useMemo } from 'react'
import { useJobApplications, useJobApplicationStats } from '../hooks'
import {
  useJobTrackerStore,
  useIsFormOpen,
  useJobTrackerFilters,
  useJobTrackerSort,
} from '../stores'
import type { JobApplication } from '../types'
import {
  StatsCards,
  FilterBar,
  ApplicationTable,
  ApplicationForm,
  DeleteModal,
  EmptyState,
} from '../components'
import styles from './jobTrackerPage.module.scss'

export function JobTrackerPage() {
  const { data: applicationsData, isLoading, error, refetch } = useJobApplications()
  const { data: statsData } = useJobApplicationStats()

  const isFormOpen = useIsFormOpen()
  const filters = useJobTrackerFilters()
  const sort = useJobTrackerSort()
  const openCreateForm = useJobTrackerStore((s) => s.openCreateForm)

  const filteredAndSortedApplications = useMemo(() => {
    if (!applicationsData?.items) return []

    let result = [...applicationsData.items]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (app) =>
          app.identity_name.toLowerCase().includes(searchLower) ||
          app.position_title.toLowerCase().includes(searchLower) ||
          (app.location && app.location.toLowerCase().includes(searchLower))
      )
    }

    if (filters.status) {
      result = result.filter((app) => app.application_status === filters.status)
    }

    if (filters.outcome) {
      result = result.filter((app) => app.outcome === filters.outcome)
    }

    if (filters.priority) {
      result = result.filter((app) => app.priority === filters.priority)
    }

    if (filters.remoteType) {
      result = result.filter((app) => app.remote_type === filters.remoteType)
    }

    const priorityOrder = { high: 0, medium: 1, low: 2, unknown: 3 }
    const outcomeOrder = { offer: 0, pending: 1, rejected: 2, ghosted: 3, withdrawn: 4, unknown: 5 }

    result.sort((a: JobApplication, b: JobApplication) => {
      let comparison = 0

      switch (sort.field) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'date_applied':
          const dateA = a.date_applied ? new Date(a.date_applied).getTime() : 0
          const dateB = b.date_applied ? new Date(b.date_applied).getTime() : 0
          comparison = dateA - dateB
          break
        case 'identity_name':
          comparison = a.identity_name.localeCompare(b.identity_name)
          break
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'outcome':
          comparison = outcomeOrder[a.outcome] - outcomeOrder[b.outcome]
          break
      }

      return sort.order === 'asc' ? comparison : -comparison
    })

    return result
  }, [applicationsData?.items, filters, sort])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading applications...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <span>Failed to load applications</span>
          <button type="button" onClick={() => refetch()} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const hasApplications = applicationsData?.items && applicationsData.items.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Job Application Tracker</h1>
          <p className={styles.subtitle}>
            Track your job applications and manage your job hunt
          </p>
        </div>
        <button type="button" onClick={openCreateForm} className={styles.addButton}>
          Add Application
        </button>
      </header>

      {hasApplications ? (
        <div className={styles.content}>
          {statsData && <StatsCards stats={statsData} />}
          <FilterBar />
          <ApplicationTable applications={filteredAndSortedApplications} />
        </div>
      ) : (
        <EmptyState />
      )}

      {isFormOpen && <ApplicationForm />}
      <DeleteModal />
    </div>
  )
}
