// ===================
// © AngelaMos | 2026
// VideoForm.tsx
// ===================

import styles from '../pages/dataInputPage.module.scss'
import { useInputUIStore } from '../stores/input.ui.store'
import type { TikTokVideoCreate } from '../types/analytics.types'

interface VideoFormProps {
  isCreating: boolean
  onSubmit: (data: TikTokVideoCreate) => void
  nextRank: number
}

export function VideoForm({ isCreating, onSubmit, nextRank }: VideoFormProps) {
  const { formData, updateFormField, resetFormData, setShowForm } =
    useInputUIStore()

  const isValidForm = (): boolean => {
    return !!(
      formData.rank &&
      formData.date_posted &&
      formData.views !== undefined &&
      formData.comments !== undefined &&
      formData.likes !== undefined &&
      formData.bookmarks !== undefined &&
      formData.shares !== undefined &&
      formData.avg_watch_time !== undefined &&
      formData.new_followers !== undefined &&
      formData.watched_full_video_percentage !== undefined &&
      formData.hook &&
      formData.length &&
      formData.description
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidForm()) return

    onSubmit(formData as TikTokVideoCreate)
    resetFormData(nextRank)
    setShowForm(false)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <h2 className={styles.formTitle}>Add New Video</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic Info</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Rank
              <input
                type="number"
                value={formData.rank || ''}
                onChange={(e) =>
                  updateFormField('rank', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Date Posted
              <input
                type="date"
                value={formData.date_posted || ''}
                onChange={(e) => updateFormField('date_posted', e.target.value)}
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label}>
              Video URL (optional)
              <input
                type="url"
                value={formData.video_url || ''}
                onChange={(e) => updateFormField('video_url', e.target.value)}
                className={styles.input}
                placeholder="https://tiktok.com/@user/video/..."
              />
            </label>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Metrics</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Views
              <input
                type="number"
                value={formData.views || ''}
                onChange={(e) =>
                  updateFormField('views', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Comments
              <input
                type="number"
                value={formData.comments || ''}
                onChange={(e) =>
                  updateFormField('comments', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Likes
              <input
                type="number"
                value={formData.likes || ''}
                onChange={(e) =>
                  updateFormField('likes', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Bookmarks
              <input
                type="number"
                value={formData.bookmarks || ''}
                onChange={(e) =>
                  updateFormField('bookmarks', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Shares
              <input
                type="number"
                value={formData.shares || ''}
                onChange={(e) =>
                  updateFormField('shares', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Avg Watch Time (seconds)
              <input
                type="number"
                step="0.1"
                value={formData.avg_watch_time || ''}
                onChange={(e) =>
                  updateFormField('avg_watch_time', parseFloat(e.target.value))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              New Followers
              <input
                type="number"
                value={formData.new_followers || ''}
                onChange={(e) =>
                  updateFormField('new_followers', parseInt(e.target.value, 10))
                }
                className={styles.input}
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Watched Full Video %
              <input
                type="number"
                step="0.1"
                value={formData.watched_full_video_percentage || ''}
                onChange={(e) =>
                  updateFormField(
                    'watched_full_video_percentage',
                    parseFloat(e.target.value)
                  )
                }
                className={styles.input}
                required
              />
            </label>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Content</h3>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            Hook
            <textarea
              value={formData.hook || ''}
              onChange={(e) => updateFormField('hook', e.target.value)}
              className={styles.textarea}
              rows={2}
              required
            />
          </label>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>
              Length (TikTok format, e.g., 1.32 = 1:32)
              <input
                type="number"
                step="0.01"
                value={formData.length || ''}
                onChange={(e) =>
                  updateFormField('length', parseFloat(e.target.value))
                }
                className={styles.input}
                placeholder="1.32"
                required
              />
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Hashtags (comma-separated)
              <input
                type="text"
                value={formData.hashtags?.join(', ') || ''}
                onChange={(e) =>
                  updateFormField(
                    'hashtags',
                    e.target.value.split(',').map((h) => h.trim())
                  )
                }
                className={styles.input}
                placeholder="cybersecurity, comptia, securityplus"
              />
            </label>
          </div>
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            Text on Screen Hook (optional)
            <textarea
              value={formData.text_on_screen_hook || ''}
              onChange={(e) =>
                updateFormField('text_on_screen_hook', e.target.value)
              }
              className={styles.textarea}
              rows={2}
            />
          </label>
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            Description
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormField('description', e.target.value)}
              className={styles.textarea}
              rows={3}
              required
            />
          </label>
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            CTA (optional)
            <input
              type="text"
              value={formData.cta || ''}
              onChange={(e) => updateFormField('cta', e.target.value)}
              className={styles.input}
              placeholder="I post everyday, so follow me for more CompTIA tips."
            />
          </label>
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            Full Transcription (optional)
            <textarea
              value={formData.full_transcription || ''}
              onChange={(e) =>
                updateFormField('full_transcription', e.target.value)
              }
              className={styles.textarea}
              rows={6}
            />
          </label>
        </div>
        <div className={styles.fieldFull}>
          <label className={styles.label}>
            Notes (optional)
            <textarea
              value={formData.notes || ''}
              onChange={(e) => updateFormField('notes', e.target.value)}
              className={styles.textarea}
              rows={3}
            />
          </label>
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => {
            resetFormData()
            setShowForm(false)
          }}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreating || !isValidForm()}
          className={styles.submitBtn}
        >
          {isCreating ? 'Saving...' : 'Save Video'}
        </button>
      </div>
    </form>
  )
}
