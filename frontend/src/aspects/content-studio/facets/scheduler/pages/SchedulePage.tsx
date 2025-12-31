// ===================
// © AngelaMos | 2025
// SchedulePage.tsx
// ===================

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  useConnectedAccounts,
  useContentLibrary,
  useUpcomingPosts,
  useScheduleSingle,
  useScheduleMulti,
  useCancelPost,
  usePublishNow,
} from '../hooks'
import {
  useSchedulerStore,
  useScheduledPosts as useScheduledPostsStore,
  useIsLoadingPosts,
  useSchedulerError,
} from '../stores'
import {
  PlatformType,
  ScheduleStatus,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_COLORS,
  STATUS_DISPLAY_NAMES,
  STATUS_COLORS,
} from '../types/scheduler.enums'
import type {
  ScheduleSingleRequest,
  ScheduleMultiRequest,
  ScheduleAccountConfig,
  ContentLibraryItem,
  ScheduledPost,
} from '../types'
import styles from './SchedulePage.module.scss'

interface LocationState {
  selectedContentId?: string
}

export function SchedulePage() {
  const location = useLocation()
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentLibraryItem | null>(null)

  const { data: accounts } = useConnectedAccounts()
  const { data: library } = useContentLibrary({ limit: 50 })

  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.selectedContentId && library?.items) {
      const content = library.items.find((c) => c.id === state.selectedContentId)
      if (content) {
        setSelectedContent(content)
        setShowScheduleModal(true)
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, library?.items])
  const { data: upcomingPosts, refetch } = useUpcomingPosts(20)

  const scheduleSingle = useScheduleSingle()
  const scheduleMulti = useScheduleMulti()
  const cancelPost = useCancelPost()
  const publishNow = usePublishNow()

  const scheduledPosts = useScheduledPostsStore()
  const isLoading = useIsLoadingPosts()
  const error = useSchedulerError()
  const { clearError } = useSchedulerStore()

  const handleSchedule = (contentId: string) => {
    const content = library?.items.find((c) => c.id === contentId)
    if (content) {
      setSelectedContent(content)
      setShowScheduleModal(true)
    }
  }

  const handleScheduleSubmit = (
    request: ScheduleSingleRequest | ScheduleMultiRequest,
    isMulti: boolean
  ) => {
    if (isMulti) {
      scheduleMulti.mutate(request as ScheduleMultiRequest, {
        onSuccess: () => {
          setShowScheduleModal(false)
          setSelectedContent(null)
          refetch()
        },
      })
    } else {
      scheduleSingle.mutate(request as ScheduleSingleRequest, {
        onSuccess: () => {
          setShowScheduleModal(false)
          setSelectedContent(null)
          refetch()
        },
      })
    }
  }

  const handleCancel = (postId: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled post?')) {
      cancelPost.mutate(postId)
    }
  }

  const handlePublishNow = (postId: string) => {
    if (window.confirm('Publish this post now?')) {
      publishNow.mutate(postId)
    }
  }

  const activeAccounts = accounts?.filter((a) => a.is_active) || []

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>Schedule Content</h1>
        <p className={styles.subtitle}>
          Select content from your library and schedule it to your connected accounts
        </p>
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
        <div className={styles.columns}>
          <section className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>Select Content</h2>
            {library?.items && library.items.length > 0 ? (
              <div className={styles.contentList}>
                {library.items.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.contentItem} ${selectedContent?.id === item.id ? styles.selected : ''}`}
                    onClick={() => setSelectedContent(item)}
                  >
                    <div className={styles.contentHeader}>
                      <span className={styles.contentType}>{item.content_type}</span>
                      {item.target_platform && (
                        <span
                          className={styles.platform}
                          style={{ background: PLATFORM_COLORS[item.target_platform] }}
                        >
                          {PLATFORM_DISPLAY_NAMES[item.target_platform]}
                        </span>
                      )}
                    </div>
                    <h3 className={styles.contentTitle}>
                      {item.title || item.body?.slice(0, 50) || 'Untitled'}
                    </h3>
                    <button
                      className={styles.scheduleButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSchedule(item.id)
                      }}
                      disabled={activeAccounts.length === 0}
                      type="button"
                    >
                      Schedule
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                No content in library. Create content first.
              </div>
            )}
          </section>

          <section className={styles.upcomingSection}>
            <h2 className={styles.sectionTitle}>Upcoming Posts</h2>
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : scheduledPosts.length > 0 ? (
              <div className={styles.postsList}>
                {scheduledPosts.map((post) => (
                  <UpcomingPostCard
                    key={post.id}
                    post={post}
                    onCancel={() => handleCancel(post.id)}
                    onPublishNow={() => handlePublishNow(post.id)}
                    isCancelling={cancelPost.isPending}
                    isPublishing={publishNow.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>No upcoming posts</div>
            )}
          </section>
        </div>
      </main>

      </div>

      {showScheduleModal && selectedContent && (
        <ScheduleModal
          content={selectedContent}
          accounts={activeAccounts}
          onClose={() => {
            setShowScheduleModal(false)
            setSelectedContent(null)
          }}
          onSubmit={handleScheduleSubmit}
          isLoading={scheduleSingle.isPending || scheduleMulti.isPending}
        />
      )}
    </div>
  )
}

interface UpcomingPostCardProps {
  post: ScheduledPost
  onCancel: () => void
  onPublishNow: () => void
  isCancelling: boolean
  isPublishing: boolean
}

function UpcomingPostCard({
  post,
  onCancel,
  onPublishNow,
  isCancelling,
  isPublishing,
}: UpcomingPostCardProps) {
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const canPublishNow =
    post.status === ScheduleStatus.SCHEDULED ||
    post.status === ScheduleStatus.DRAFT

  const canCancel =
    post.status !== ScheduleStatus.PUBLISHED &&
    post.status !== ScheduleStatus.PUBLISHING

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <span
          className={styles.postPlatform}
          style={{ background: PLATFORM_COLORS[post.platform] }}
        >
          {PLATFORM_DISPLAY_NAMES[post.platform]}
        </span>
        <span
          className={styles.postStatus}
          style={{ color: STATUS_COLORS[post.status] }}
        >
          {STATUS_DISPLAY_NAMES[post.status]}
        </span>
      </div>

      <div className={styles.postContent}>
        <h4 className={styles.postTitle}>
          {post.content?.title || post.content?.body?.slice(0, 50) || 'Untitled'}
        </h4>
        <span className={styles.postAccount}>
          @{post.account?.username}
        </span>
      </div>

      <div className={styles.postSchedule}>
        <span className={styles.scheduledFor}>
          {formatDateTime(post.scheduled_for)}
        </span>
      </div>

      <div className={styles.postActions}>
        {canPublishNow && (
          <button
            className={styles.publishButton}
            onClick={onPublishNow}
            disabled={isPublishing}
            type="button"
          >
            Publish Now
          </button>
        )}
        {canCancel && (
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isCancelling}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

interface ScheduleModalProps {
  content: ContentLibraryItem
  accounts: Array<{
    id: string
    platform: PlatformType
    platform_username: string
  }>
  onClose: () => void
  onSubmit: (
    request: ScheduleSingleRequest | ScheduleMultiRequest,
    isMulti: boolean
  ) => void
  isLoading: boolean
}

function ScheduleModal({
  content,
  accounts,
  onClose,
  onSubmit,
  isLoading,
}: ScheduleModalProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const handleToggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!scheduledFor || selectedAccounts.length === 0) return

    const scheduledForISO = new Date(scheduledFor).toISOString()

    if (selectedAccounts.length === 1) {
      const request: ScheduleSingleRequest = {
        content_library_item_id: content.id,
        connected_account_id: selectedAccounts[0],
        scheduled_for: scheduledForISO,
        timezone,
      }
      onSubmit(request, false)
    } else {
      const accountSchedules: ScheduleAccountConfig[] = selectedAccounts.map(
        (accountId) => ({
          connected_account_id: accountId,
          scheduled_for: scheduledForISO,
        })
      )
      const request: ScheduleMultiRequest = {
        content_library_item_id: content.id,
        account_schedules: accountSchedules,
        timezone,
      }
      onSubmit(request, true)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Schedule Post</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.contentPreview}>
            <h4>{content.title || 'Untitled'}</h4>
            {content.body && (
              <p>{content.body.slice(0, 200)}{content.body.length > 200 ? '...' : ''}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Select Accounts</label>
            <div className={styles.accountSelection}>
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className={`${styles.accountOption} ${selectedAccounts.includes(account.id) ? styles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => handleToggleAccount(account.id)}
                    className={styles.checkbox}
                  />
                  <span
                    className={styles.accountPlatform}
                    style={{ background: PLATFORM_COLORS[account.platform] }}
                  >
                    {PLATFORM_DISPLAY_NAMES[account.platform]}
                  </span>
                  <span className={styles.accountUsername}>
                    @{account.platform_username}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Schedule For
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                min={getMinDateTime()}
                className={styles.dateInput}
                required
              />
            </label>
            <span className={styles.timezone}>Timezone: {timezone}</span>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelModalButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={
                isLoading ||
                selectedAccounts.length === 0 ||
                !scheduledFor
              }
            >
              {isLoading
                ? 'Scheduling...'
                : selectedAccounts.length > 1
                  ? `Schedule to ${selectedAccounts.length} Accounts`
                  : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
