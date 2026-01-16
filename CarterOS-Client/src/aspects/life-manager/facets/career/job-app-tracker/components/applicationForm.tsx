// ===================
// © AngelaMos | 2025
// applicationForm.tsx
// ===================

import {
  useJobTrackerStore,
  useDraftFormData,
  useFormMode,
  useEditingApplicationId,
  useIsSaving,
} from '../stores'
import {
  useCreateJobApplication,
  useUpdateJobApplication,
} from '../hooks'
import {
  REMOTE_TYPE_OPTIONS,
  APPLICATION_STATUS_OPTIONS,
  JOB_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PRIORITY_OPTIONS,
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
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                <label className={styles.label}>Company / Identity *</label>
                <input
                  type="text"
                  value={draft.identity_name}
                  onChange={(e) => updateField('identity_name', e.target.value)}
                  placeholder="Company name"
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Position *</label>
                <input
                  type="text"
                  value={draft.position_title}
                  onChange={(e) => updateField('position_title', e.target.value)}
                  placeholder="Job title"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Job URL</label>
                <input
                  type="url"
                  value={draft.job_url}
                  onChange={(e) => updateField('job_url', e.target.value)}
                  placeholder="https://..."
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Source</label>
                <input
                  type="text"
                  value={draft.source}
                  onChange={(e) => updateField('source', e.target.value)}
                  placeholder="LinkedIn, Twitter, etc."
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Location & Type</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Location</label>
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, State"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Remote Type</label>
                <select
                  value={draft.remote_type}
                  onChange={(e) => updateField('remote_type', e.target.value as any)}
                  className={styles.select}
                >
                  {REMOTE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Job Type</label>
                <select
                  value={draft.job_type}
                  onChange={(e) => updateField('job_type', e.target.value as any)}
                  className={styles.select}
                >
                  {JOB_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Experience Level</label>
                <select
                  value={draft.experience_level}
                  onChange={(e) => updateField('experience_level', e.target.value as any)}
                  className={styles.select}
                >
                  {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Salary</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Min Salary</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.salary_min}
                  onChange={(e) => updateField('salary_min', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="50000"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Max Salary</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draft.salary_max}
                  onChange={(e) => updateField('salary_max', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="80000"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Status</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Application Status</label>
                <select
                  value={draft.application_status}
                  onChange={(e) => updateField('application_status', e.target.value as any)}
                  className={styles.select}
                >
                  {APPLICATION_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Priority</label>
                <select
                  value={draft.priority}
                  onChange={(e) => updateField('priority', e.target.value as any)}
                  className={styles.select}
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dates</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Date Saved</label>
                <input
                  type="date"
                  value={draft.date_saved}
                  onChange={(e) => updateField('date_saved', e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Date Applied</label>
                <input
                  type="date"
                  value={draft.date_applied}
                  onChange={(e) => updateField('date_applied', e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Follow-up Date</label>
                <input
                  type="date"
                  value={draft.followup_date}
                  onChange={(e) => updateField('followup_date', e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Contact Name</label>
                <input
                  type="text"
                  value={draft.contact_name}
                  onChange={(e) => updateField('contact_name', e.target.value)}
                  placeholder="Recruiter name"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact Email</label>
                <input
                  type="email"
                  value={draft.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="email@company.com"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <textarea
              value={draft.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional notes..."
              className={styles.textarea}
              rows={4}
            />
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
              disabled={isSaving || !draft.identity_name.trim() || !draft.position_title.trim()}
              className={styles.submitButton}
            >
              {isSaving ? 'Saving...' : isCreate ? 'Add Application' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
