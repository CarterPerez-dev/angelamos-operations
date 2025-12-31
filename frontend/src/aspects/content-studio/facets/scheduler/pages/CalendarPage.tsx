// ===================
// © AngelaMos | 2025
// CalendarPage.tsx
// ===================

import { useEffect } from 'react'
import {
  useCalendarData,
  useCalendarNavigation,
  useCalendarReschedule,
} from '../hooks'
import {
  useSchedulerStore,
  useCalendarData as useCalendarDataStore,
  useIsLoadingCalendar,
  useSchedulerError,
  useSelectedAccountIds,
} from '../stores'
import { useConnectedAccounts } from '../hooks'
import { CalendarView } from '../types/scheduler.enums'
import { PLATFORM_COLORS } from '../types/scheduler.enums'
import type { CalendarPostItem, CalendarRescheduleRequest } from '../types'
import styles from './CalendarPage.module.scss'

export function CalendarPage() {
  const { data: accounts } = useConnectedAccounts()
  const { data: calendarPosts, isLoading: isLoadingQuery, refetch } = useCalendarData()

  const calendarData = useCalendarDataStore()
  const isLoading = useIsLoadingCalendar()
  const error = useSchedulerError()
  const selectedAccountIds = useSelectedAccountIds()

  const {
    view,
    date,
    title,
    setView,
    goToPrevious,
    goToNext,
    goToToday,
  } = useCalendarNavigation()

  const { toggleAccountSelection, selectAllAccounts, clearAccountSelection, clearError } =
    useSchedulerStore()

  const reschedule = useCalendarReschedule()

  useEffect(() => {
    refetch()
  }, [view, date, selectedAccountIds, refetch])

  const handleReschedule = (postId: string, newDate: Date) => {
    const request: CalendarRescheduleRequest = {
      post_id: postId,
      scheduled_for: newDate.toISOString(),
    }
    reschedule.mutate(request)
  }

  const getDaysInMonth = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    const startPadding = firstDay.getDay()
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push(d)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    const endPadding = 42 - days.length
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const getPostsForDate = (targetDate: Date): CalendarPostItem[] => {
    return calendarData.filter((post) => {
      const postDate = new Date(post.scheduled_for)
      return (
        postDate.getFullYear() === targetDate.getFullYear() &&
        postDate.getMonth() === targetDate.getMonth() &&
        postDate.getDate() === targetDate.getDate()
      )
    })
  }

  const isToday = (checkDate: Date): boolean => {
    const today = new Date()
    return (
      checkDate.getFullYear() === today.getFullYear() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getDate() === today.getDate()
    )
  }

  const isCurrentMonth = (checkDate: Date): boolean => {
    return checkDate.getMonth() === date.getMonth()
  }

  const days = getDaysInMonth(date.getFullYear(), date.getMonth())
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Content Calendar</h1>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${view === CalendarView.MONTH ? styles.active : ''}`}
              onClick={() => setView(CalendarView.MONTH)}
              type="button"
            >
              Month
            </button>
            <button
              className={`${styles.viewButton} ${view === CalendarView.WEEK ? styles.active : ''}`}
              onClick={() => setView(CalendarView.WEEK)}
              type="button"
            >
              Week
            </button>
            <button
              className={`${styles.viewButton} ${view === CalendarView.DAY ? styles.active : ''}`}
              onClick={() => setView(CalendarView.DAY)}
              type="button"
            >
              Day
            </button>
          </div>
        </div>

        <div className={styles.navigation}>
          <button className={styles.navButton} onClick={goToPrevious} type="button">
            Previous
          </button>
          <button className={styles.todayButton} onClick={goToToday} type="button">
            Today
          </button>
          <button className={styles.navButton} onClick={goToNext} type="button">
            Next
          </button>
          <h2 className={styles.currentPeriod}>{title}</h2>
        </div>

        {accounts && accounts.length > 0 && (
          <div className={styles.accountFilter}>
            <span className={styles.filterLabel}>Filter by account:</span>
            <div className={styles.accountButtons}>
              <button
                className={`${styles.filterButton} ${selectedAccountIds.length === 0 ? styles.active : ''}`}
                onClick={clearAccountSelection}
                type="button"
              >
                All
              </button>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  className={`${styles.filterButton} ${selectedAccountIds.includes(account.id) ? styles.active : ''}`}
                  onClick={() => toggleAccountSelection(account.id)}
                  style={{
                    borderColor: selectedAccountIds.includes(account.id)
                      ? PLATFORM_COLORS[account.platform]
                      : undefined,
                  }}
                  type="button"
                >
                  {account.platform_username}
                </button>
              ))}
            </div>
          </div>
        )}
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
        {isLoading || isLoadingQuery ? (
          <div className={styles.loading}>Loading calendar...</div>
        ) : (
          <div className={styles.calendar}>
            <div className={styles.weekHeader}>
              {weekDays.map((day) => (
                <div key={day} className={styles.weekDay}>
                  {day}
                </div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {days.map((day, index) => {
                const dayPosts = getPostsForDate(day)
                const isCurrentMonthDay = isCurrentMonth(day)
                const isTodayDay = isToday(day)

                return (
                  <div
                    key={index}
                    className={`${styles.dayCell} ${!isCurrentMonthDay ? styles.otherMonth : ''} ${isTodayDay ? styles.today : ''}`}
                  >
                    <span className={styles.dayNumber}>{day.getDate()}</span>
                    <div className={styles.postsContainer}>
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className={styles.postItem}
                          style={{
                            backgroundColor: post.color || PLATFORM_COLORS[post.platform],
                          }}
                          title={post.content?.title || post.content?.body?.slice(0, 50)}
                        >
                          <span className={styles.postTime}>
                            {new Date(post.scheduled_for).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className={styles.postPlatform}>{post.platform}</span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className={styles.moreIndicator}>
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
