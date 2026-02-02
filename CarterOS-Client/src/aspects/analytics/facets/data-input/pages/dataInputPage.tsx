// ===================
// © AngelaMos | 2026
// dataInputPage.tsx
// ===================

import {
  GiTrophyCup,
  GiTrashCan,
  GiPencil,
  GiHearts,
  GiSpeaker,
  GiBookmark,
  GiShare,
} from 'react-icons/gi'
import {
  useVideos,
  useCreateVideo,
  useDeleteVideo,
  useUpdateVideo,
  useSearchVideos,
  useFilterByDateRange,
  useFilterByMinViews,
} from '../hooks/useAnalytics'
import { useInputUIStore } from '../stores/input.ui.store'
import { useFilterUIStore } from '../stores/filter.ui.store'
import { useDebounce } from '@/core/lib/hooks'
import type { TikTokVideoCreate } from '../types/analytics.types'
import styles from './dataInputPage.module.scss'

export function DataInputPage() {
  const { data, isLoading } = useVideos(1, 100)
  const { mutate: createVideo, isPending: isCreating } = useCreateVideo()
  const { mutate: deleteVideo } = useDeleteVideo()
  const { mutate: updateVideo } = useUpdateVideo()

  const {
    showForm,
    setShowForm,
    formData,
    setFormData,
    updateFormField,
    resetFormData,
  } = useInputUIStore()

  const {
    filters,
    setSearchQuery,
    setDateRange,
    setMinViews,
    clearFilters,
  } = useFilterUIStore()

  const debouncedSearchQuery = useDebounce(filters.searchQuery || '', 500)
  const debouncedMinViews = useDebounce(filters.minViews, 500)

  const { data: searchResults, isLoading: isSearching } = useSearchVideos(debouncedSearchQuery)
  const { data: dateRangeResults, isLoading: isFilteringByDate } = useFilterByDateRange(
    filters.startDate,
    filters.endDate
  )
  const { data: minViewsResults, isLoading: isFilteringByViews } = useFilterByMinViews(debouncedMinViews)

  const hasActiveFilters = !!(
    debouncedSearchQuery ||
    (filters.startDate && filters.endDate) ||
    debouncedMinViews !== undefined
  )

  const getDisplayVideos = () => {
    if (debouncedSearchQuery && searchResults) {
      return searchResults
    }
    if (filters.startDate && filters.endDate && dateRangeResults) {
      return dateRangeResults
    }
    if (debouncedMinViews !== undefined && minViewsResults) {
      return minViewsResults
    }
    return data?.items || []
  }

  const displayVideos = getDisplayVideos()
  const isLoadingFilters = isSearching || isFilteringByDate || isFilteringByViews

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidForm()) return

    createVideo(formData as TikTokVideoCreate)
    resetFormData((data?.items.length ?? 0) + 1)
    setShowForm(false)
  }

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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const sortedVideos = displayVideos.slice().sort((a, b) => a.rank - b.rank)

  const totalCount = hasActiveFilters ? displayVideos.length : (data?.total || 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <GiTrophyCup />
            TikTok Analytics Data Input
          </h1>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className={styles.addBtn}
          >
            {showForm ? 'Cancel' : '+ Add Video'}
          </button>
        </div>
        <p className={styles.subtitle}>
          Track high-performing TikTok videos to analyze what works
        </p>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h2 className={styles.formTitle}>Add New Video</h2>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Info</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Rank</label>
                <input
                  type="number"
                  value={formData.rank || ''}
                  onChange={(e) => updateFormField('rank', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Date Posted</label>
                <input
                  type="date"
                  value={formData.date_posted || ''}
                  onChange={(e) => updateFormField('date_posted', e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.fieldFull}>
                <label className={styles.label}>Video URL (optional)</label>
                <input
                  type="url"
                  value={formData.video_url || ''}
                  onChange={(e) => updateFormField('video_url', e.target.value)}
                  className={styles.input}
                  placeholder="https://tiktok.com/@user/video/..."
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Metrics</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Views</label>
                <input
                  type="number"
                  value={formData.views || ''}
                  onChange={(e) => updateFormField('views', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Comments</label>
                <input
                  type="number"
                  value={formData.comments || ''}
                  onChange={(e) => updateFormField('comments', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Likes</label>
                <input
                  type="number"
                  value={formData.likes || ''}
                  onChange={(e) => updateFormField('likes', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Bookmarks</label>
                <input
                  type="number"
                  value={formData.bookmarks || ''}
                  onChange={(e) => updateFormField('bookmarks', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Shares</label>
                <input
                  type="number"
                  value={formData.shares || ''}
                  onChange={(e) => updateFormField('shares', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Avg Watch Time (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.avg_watch_time || ''}
                  onChange={(e) => updateFormField('avg_watch_time', parseFloat(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>New Followers</label>
                <input
                  type="number"
                  value={formData.new_followers || ''}
                  onChange={(e) => updateFormField('new_followers', parseInt(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Watched Full Video %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.watched_full_video_percentage || ''}
                  onChange={(e) => updateFormField('watched_full_video_percentage', parseFloat(e.target.value))}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Content</h3>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Hook</label>
              <textarea
                value={formData.hook || ''}
                onChange={(e) => updateFormField('hook', e.target.value)}
                className={styles.textarea}
                rows={2}
                required
              />
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Length (TikTok format, e.g., 1.32 = 1:32)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.length || ''}
                  onChange={(e) => updateFormField('length', parseFloat(e.target.value))}
                  className={styles.input}
                  placeholder="1.32"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hashtags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.hashtags?.join(', ') || ''}
                  onChange={(e) => updateFormField('hashtags', e.target.value.split(',').map(h => h.trim()))}
                  className={styles.input}
                  placeholder="cybersecurity, comptia, securityplus"
                />
              </div>
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Text on Screen Hook (optional)</label>
              <textarea
                value={formData.text_on_screen_hook || ''}
                onChange={(e) => updateFormField('text_on_screen_hook', e.target.value)}
                className={styles.textarea}
                rows={2}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateFormField('description', e.target.value)}
                className={styles.textarea}
                rows={3}
                required
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>CTA (optional)</label>
              <input
                type="text"
                value={formData.cta || ''}
                onChange={(e) => updateFormField('cta', e.target.value)}
                className={styles.input}
                placeholder="I post everyday, so follow me for more CompTIA tips."
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Full Transcription (optional)</label>
              <textarea
                value={formData.full_transcription || ''}
                onChange={(e) => updateFormField('full_transcription', e.target.value)}
                className={styles.textarea}
                rows={6}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Notes (optional)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormField('notes', e.target.value)}
                className={styles.textarea}
                rows={3}
              />
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
      )}

      <div className={styles.videosSection}>
        <h2 className={styles.sectionTitle}>Tracked Videos ({totalCount})</h2>

        <div className={styles.filterToolbar}>
          <div className={styles.filterRow}>
            <div className={styles.searchField}>
              <input
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hook, description, hashtags, CTA, or transcription..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.dateRangeField}>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setDateRange(e.target.value, filters.endDate || '')}
                className={styles.dateInput}
              />
              <span className={styles.dateSeparator}>to</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setDateRange(filters.startDate || '', e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.minViewsField}>
              <input
                type="number"
                value={filters.minViews !== undefined ? filters.minViews : ''}
                onChange={(e) => {
                  const val = e.target.value
                  setMinViews(val === '' ? undefined : parseInt(val))
                }}
                placeholder="Min views"
                className={styles.minViewsInput}
                min="0"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className={styles.clearFiltersBtn}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.colRank}>Rank</div>
            <div className={styles.colDate}>Date</div>
            <div className={styles.colHook}>Hook</div>
            <div className={styles.colViews}>Views</div>
            <div className={styles.colMetrics}>Engagement</div>
            <div className={styles.colActions}>Actions</div>
          </div>

          {isLoading || isLoadingFilters ? (
            <div className={styles.empty}>Loading...</div>
          ) : sortedVideos.length === 0 ? (
            <div className={styles.empty}>No videos tracked yet. Add one above to get started.</div>
          ) : (
            sortedVideos.map((video) => (
              <div key={video.id} className={styles.tableRow}>
                <div className={styles.colRank}>#{video.rank}</div>
                <div className={styles.colDate}>
                  {new Date(video.date_posted).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className={styles.colHook}>
                  <div className={styles.hookText}>{video.hook}</div>
                  {video.hashtags && video.hashtags.length > 0 && (
                    <div className={styles.hashtags}>
                      {video.hashtags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.hashtag}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.colViews}>{formatNumber(video.views)}</div>
                <div className={styles.colMetrics}>
                  <span className={styles.metric}>
                    <GiHearts /> {formatNumber(video.likes)}
                  </span>
                  <span className={styles.metric}>
                    <GiSpeaker /> {formatNumber(video.comments)}
                  </span>
                  <span className={styles.metric}>
                    <GiBookmark /> {formatNumber(video.bookmarks)}
                  </span>
                </div>
                <div className={styles.colActions}>
                  {video.video_url && (
                    <a href={video.video_url} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
                      View
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteVideo(video.id)}
                    className={styles.deleteBtn}
                  >
                    <GiTrashCan />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
