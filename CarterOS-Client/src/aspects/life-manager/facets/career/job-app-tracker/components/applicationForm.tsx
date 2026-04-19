// ===================
// © AngelaMos | 2025
// applicationForm.tsx
// ===================

import { useCreateJobApplication, useUpdateJobApplication } from '../hooks'
import {
  useDraftFormData,
  useEditingApplicationId,
  useFormMode,
  useIsSaving,
  useJobTrackerStore,
} from '../stores'
import type {
  ApplicationStatus,
  ExperienceLevel,
  JobType,
  Priority,
  RemoteType,
} from '../types'
import {
  APPLICATION_STATUS_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  REMOTE_TYPE_OPTIONS,
} from '../types'
import styles from './applicationForm.module.scss'

export function ApplicationForm() {
  const formMode = useFormMode()
  const draft = useDraftFormData()
  const editingId = useEditingApplicationId()
  const isSaving = useIsSaving()

  const updateField = useJobTrackerStore((s) => s.updateDraftField)
  const getDraftAsRequest = useJobTrackerStore((s) => s.getDraftAsCreateRequest)
  const closeForm = useJobTrackerStore((s) => s.closeForm)
  const resetDraft = useJobTrackerStore((s) => s.resetDraftForm)
  const setSaving = useJobTrackerStore((s) => s.setSaving)

  const createMutation = useCreateJobApplication()
  const updateMutation = useUpdateJobApplication()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!draft.identity_name.trim() || !draft.position_title.trim()) {
      return
    }

    setSaving(true)

    try {
      const data = getDraftAsRequest()

      if (formMode === 'create') {
        await createMutation.mutateAsync(data)
      } else if (formMode === 'edit' && editingId) {
        await updateMutation.mutateAsync({ id: editingId, data })
      }

      resetDraft()
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    closeForm()
  }

  const isCreate = formMode === 'create'

  return (
    <div
      className={styles.overlay}
      role="button"
      tabIndex={0}
      onClick={handleCancel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleCancel()
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isCreate ? 'Add Application' : 'Edit Application'}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Info</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Company / Identity *
                  <input
                    type="text"
                    value={draft.identity_name}
                    onChange={(e) => updateField('identity_name', e.target.value)}
                    placeholder="Company name"
                    className={styles.input}
                    required
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Position *
                  <input
                    type="text"
                    value={draft.position_title}
                    onChange={(e) =>
                      updateField('position_title', e.target.value)
                    }
                    placeholder="Job title"
                    className={styles.input}
                    required
                  />
                </label>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Job URL
                  <input
                    type="url"
                    value={draft.job_url}
                    onChange={(e) => updateField('job_url', e.target.value)}
                    placeholder="https://..."
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Source
                  <input
                    type="text"
                    value={draft.source}
                    onChange={(e) => updateField('source', e.target.value)}
                    placeholder="LinkedIn, Twitter, etc."
                    className={styles.input}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Location & Type</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Location
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="City, State"
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Remote Type
                  <select
                    value={draft.remote_type}
                    onChange={(e) =>
                      updateField('remote_type', e.target.value as RemoteType)
                    }
                    className={styles.select}
                  >
                    {REMOTE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Job Type
                  <select
                    value={draft.job_type}
                    onChange={(e) =>
                      updateField('job_type', e.target.value as JobType)
                    }
                    className={styles.select}
                  >
                    {JOB_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Experience Level
                  <select
                    value={draft.experience_level}
                    onChange={(e) =>
                      updateField(
                        'experience_level',
                        e.target.value as ExperienceLevel
                      )
                    }
                    className={styles.select}
                  >
                    {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Salary</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Min Salary
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.salary_min}
                    onChange={(e) =>
                      updateField(
                        'salary_min',
                        e.target.value.replace(/[^0-9]/g, '')
                      )
                    }
                    placeholder="50000"
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Max Salary
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.salary_max}
                    onChange={(e) =>
                      updateField(
                        'salary_max',
                        e.target.value.replace(/[^0-9]/g, '')
                      )
                    }
                    placeholder="80000"
                    className={styles.input}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Status</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Application Status
                  <select
                    value={draft.application_status}
                    onChange={(e) =>
                      updateField(
                        'application_status',
                        e.target.value as ApplicationStatus
                      )
                    }
                    className={styles.select}
                  >
                    {APPLICATION_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(e) =>
                      updateField('priority', e.target.value as Priority)
                    }
                    className={styles.select}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dates</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Date Saved
                  <input
                    type="date"
                    value={draft.date_saved}
                    onChange={(e) => updateField('date_saved', e.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Date Applied
                  <input
                    type="date"
                    value={draft.date_applied}
                    onChange={(e) => updateField('date_applied', e.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Follow-up Date
                  <input
                    type="date"
                    value={draft.followup_date}
                    onChange={(e) => updateField('followup_date', e.target.value)}
                    className={styles.input}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Contact Name
                  <input
                    type="text"
                    value={draft.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    placeholder="Recruiter name"
                    className={styles.input}
                  />
                </label>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Contact Email
                  <input
                    type="email"
                    value={draft.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    placeholder="email@company.com"
                    className={styles.input}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <label className={styles.label}>
              Notes
              <textarea
                value={draft.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any additional notes..."
                className={styles.textarea}
                rows={4}
              />
            </label>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSaving ||
                !draft.identity_name.trim() ||
                !draft.position_title.trim()
              }
              className={styles.submitButton}
            >
              {isSaving
                ? 'Saving...'
                : isCreate
                  ? 'Add Application'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
