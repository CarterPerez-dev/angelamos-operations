// ===================
// © AngelaMos | 2025
// LibraryPage.tsx
// ===================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useContentLibrary,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
} from '../hooks'
import {
  useSchedulerStore,
  useContentLibrary as useContentLibraryStore,
  useContentLibraryTotal,
  useIsLoadingLibrary,
  useSchedulerError,
  useSelectedContentId,
  useEditingContentId,
} from '../stores'
import {
  ContentLibraryType,
  CONTENT_TYPE_DISPLAY_NAMES,
  PLATFORM_DISPLAY_NAMES,
  PlatformType,
} from '../types/scheduler.enums'
import type {
  ContentLibraryItem,
  ContentLibraryItemCreate,
  ContentLibraryItemUpdate,
  ContentLibraryQueryParams,
} from '../types'
import styles from './LibraryPage.module.scss'

export function LibraryPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ContentLibraryQueryParams>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, refetch } = useContentLibrary(filters)
  const createContent = useCreateContent()
  const updateContent = useUpdateContent()
  const deleteContent = useDeleteContent()

  const contentLibrary = useContentLibraryStore()
  const total = useContentLibraryTotal()
  const isLoading = useIsLoadingLibrary()
  const error = useSchedulerError()
  const selectedContentId = useSelectedContentId()
  const editingContentId = useEditingContentId()

  const {
    setSelectedContentId,
    setEditingContentId,
    clearError,
  } = useSchedulerStore()

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }))
  }

  const handleFilterChange = (key: keyof ContentLibraryQueryParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const handleCreate = (data: ContentLibraryItemCreate) => {
    createContent.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false)
      },
    })
  }

  const handleUpdate = (id: string, data: ContentLibraryItemUpdate) => {
    updateContent.mutate({ id, data }, {
      onSuccess: () => {
        setEditingContentId(null)
      },
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContent.mutate(id)
    }
  }

  const getContentPreview = (item: ContentLibraryItem): string => {
    if (item.title) return item.title
    if (item.body) return item.body.slice(0, 100) + (item.body.length > 100 ? '...' : '')
    return 'Untitled'
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Content Library</h1>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            Create Content
          </button>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
            <button
              className={styles.searchButton}
              onClick={handleSearch}
              type="button"
            >
              Search
            </button>
          </div>

          <select
            className={styles.filterSelect}
            value={filters.content_type || ''}
            onChange={(e) => handleFilterChange('content_type', e.target.value)}
          >
            <option value="">All Types</option>
            {Object.entries(CONTENT_TYPE_DISPLAY_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={filters.target_platform || ''}
            onChange={(e) => handleFilterChange('target_platform', e.target.value)}
          >
            <option value="">All Platforms</option>
            {Object.entries(PLATFORM_DISPLAY_NAMES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} type="button">
            Dismiss
          </button>
        </div>
      )}

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading content...</div>
        ) : contentLibrary.length === 0 ? (
          <div className={styles.empty}>
            <p>No content found</p>
            <button
              className={styles.createButton}
              onClick={() => setShowCreateModal(true)}
              type="button"
            >
              Create your first content
            </button>
          </div>
        ) : (
          <>
            <div className={styles.resultCount}>
              {total} item{total !== 1 ? 's' : ''}
            </div>
            <div className={styles.contentGrid}>
              {contentLibrary.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.contentCard} ${selectedContentId === item.id ? styles.selected : ''}`}
                  onClick={() => setSelectedContentId(item.id)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.contentType}>
                      {CONTENT_TYPE_DISPLAY_NAMES[item.content_type]}
                    </span>
                    {item.target_platform && (
                      <span className={styles.platform}>
                        {PLATFORM_DISPLAY_NAMES[item.target_platform]}
                      </span>
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>{getContentPreview(item)}</h3>

                  {item.body && item.title && (
                    <p className={styles.cardBody}>
                      {item.body.slice(0, 150)}
                      {item.body.length > 150 ? '...' : ''}
                    </p>
                  )}

                  {item.hashtags.length > 0 && (
                    <div className={styles.tags}>
                      {item.hashtags.slice(0, 3).map((tag, i) => (
                        <span key={i} className={styles.tag}>
                          #{tag}
                        </span>
                      ))}
                      {item.hashtags.length > 3 && (
                        <span className={styles.moreTag}>
                          +{item.hashtags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <span className={styles.date}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionButton} ${styles.scheduleButton}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/content-studio/scheduler/schedule', {
                            state: { selectedContentId: item.id },
                          })
                        }}
                        type="button"
                      >
                        Schedule
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingContentId(item.id)
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      </div>

      {showCreateModal && (
        <ContentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createContent.isPending}
        />
      )}

      {editingContentId && (
        <ContentModal
          item={contentLibrary.find((c) => c.id === editingContentId)}
          onClose={() => setEditingContentId(null)}
          onSubmit={(data) => handleUpdate(editingContentId, data)}
          isLoading={updateContent.isPending}
        />
      )}
    </div>
  )
}

interface ContentModalProps {
  item?: ContentLibraryItem
  onClose: () => void
  onSubmit: (data: ContentLibraryItemCreate | ContentLibraryItemUpdate) => void
  isLoading: boolean
}

function ContentModal({ item, onClose, onSubmit, isLoading }: ContentModalProps) {
  const [formData, setFormData] = useState<ContentLibraryItemCreate>({
    content_type: item?.content_type || ContentLibraryType.TEXT_POST,
    title: item?.title || '',
    body: item?.body || '',
    target_platform: item?.target_platform,
    hashtags: item?.hashtags || [],
    mentions: item?.mentions || [],
    tags: item?.tags || [],
    notes: item?.notes || '',
  })

  const [hashtagInput, setHashtagInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addHashtag = () => {
    if (hashtagInput.trim() && !formData.hashtags?.includes(hashtagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        hashtags: [...(prev.hashtags || []), hashtagInput.trim().replace(/^#/, '')],
      }))
      setHashtagInput('')
    }
  }

  const removeHashtag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      hashtags: prev.hashtags?.filter((t) => t !== tag) || [],
    }))
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{item ? 'Edit Content' : 'Create Content'}</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Content Type
              <select
                value={formData.content_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    content_type: e.target.value as ContentLibraryType,
                  }))
                }
                className={styles.select}
                disabled={!!item}
              >
                {Object.entries(CONTENT_TYPE_DISPLAY_NAMES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Target Platform
              <select
                value={formData.target_platform || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_platform: (e.target.value as PlatformType) || undefined,
                  }))
                }
                className={styles.select}
              >
                <option value="">Any Platform</option>
                {Object.entries(PLATFORM_DISPLAY_NAMES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.label}>
            Title
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className={styles.input}
              placeholder="Content title (optional)"
            />
          </label>

          <label className={styles.label}>
            Body
            <textarea
              value={formData.body || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, body: e.target.value }))
              }
              className={styles.textarea}
              placeholder="Write your content here..."
              rows={6}
            />
          </label>

          <div className={styles.hashtagSection}>
            <label className={styles.label}>Hashtags</label>
            <div className={styles.hashtagInput}>
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                className={styles.input}
                placeholder="Add hashtag..."
              />
              <button
                type="button"
                onClick={addHashtag}
                className={styles.addButton}
              >
                Add
              </button>
            </div>
            {formData.hashtags && formData.hashtags.length > 0 && (
              <div className={styles.hashtagList}>
                {formData.hashtags.map((tag) => (
                  <span key={tag} className={styles.hashtagItem}>
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className={styles.removeTag}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className={styles.label}>
            Notes
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className={styles.textarea}
              placeholder="Internal notes..."
              rows={3}
            />
          </label>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
