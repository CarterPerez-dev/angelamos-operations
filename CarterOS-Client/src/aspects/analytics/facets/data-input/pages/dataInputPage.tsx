// ===================
// © AngelaMos | 2026
// dataInputPage.tsx
// ===================

import { GiTrophyCup } from 'react-icons/gi'
import { useDebounce } from '@/core/lib/hooks'
import { VideoForm } from '../components/VideoForm'
import { VideoRow } from '../components/VideoRow'
import {
  useCreateVideo,
  useDeleteVideo,
  useFilterByDateRange,
  useFilterByMinViews,
  useSearchVideos,
  useVideos,
} from '../hooks/useAnalytics'
import { useFilterUIStore } from '../stores/filter.ui.store'
import { useInputUIStore } from '../stores/input.ui.store'
import styles from './dataInputPage.module.scss'

export function DataInputPage() {
  const { data, isLoading } = useVideos(1, 500)
  const { mutate: createVideo, isPending: isCreating } = useCreateVideo()
  const { mutate: deleteVideo } = useDeleteVideo()

  const { showForm, setShowForm } = useInputUIStore()

  const { filters, setSearchQuery, setDateRange, setMinViews, clearFilters } =
    useFilterUIStore()

  const debouncedSearchQuery = useDebounce(filters.searchQuery || '', 500)
  const debouncedMinViews = useDebounce(filters.minViews, 500)

  const { data: searchResults, isLoading: isSearching } =
    useSearchVideos(debouncedSearchQuery)
  const { data: dateRangeResults, isLoading: isFilteringByDate } =
    useFilterByDateRange(filters.startDate, filters.endDate)
  const { data: minViewsResults, isLoading: isFilteringByViews } =
    useFilterByMinViews(debouncedMinViews)

  const hasActiveFilters = !!(
    debouncedSearchQuery ||
    (filters.startDate && filters.endDate) ||
    debouncedMinViews !== undefined
  )

  const getDisplayVideos = () => {
    if (debouncedSearchQuery && searchResults) return searchResults
    if (filters.startDate && filters.endDate && dateRangeResults)
      return dateRangeResults
    if (debouncedMinViews !== undefined && minViewsResults) return minViewsResults
    return data?.items || []
  }

  const displayVideos = getDisplayVideos()
  const isLoadingFilters = isSearching || isFilteringByDate || isFilteringByViews
  const sortedVideos = displayVideos.slice().sort((a, b) => a.rank - b.rank)
  const totalCount = hasActiveFilters ? displayVideos.length : data?.total || 0

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
        <VideoForm
          isCreating={isCreating}
          onSubmit={createVideo}
          nextRank={(data?.items.length ?? 0) + 1}
        />
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
                onChange={(e) =>
                  setDateRange(e.target.value, filters.endDate || '')
                }
                className={styles.dateInput}
              />
              <span className={styles.dateSeparator}>to</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setDateRange(filters.startDate || '', e.target.value)
                }
                className={styles.dateInput}
              />
            </div>
            <div className={styles.minViewsField}>
              <input
                type="number"
                value={filters.minViews !== undefined ? filters.minViews : ''}
                onChange={(e) => {
                  const val = e.target.value
                  setMinViews(val === '' ? undefined : parseInt(val, 10))
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
            <div className={styles.empty}>
              No videos tracked yet. Add one above to get started.
            </div>
          ) : (
            sortedVideos.map((video) => (
              <VideoRow key={video.id} video={video} onDelete={deleteVideo} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
