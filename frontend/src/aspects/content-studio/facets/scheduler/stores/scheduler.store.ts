// ===================
// © AngelaMos | 2025
// scheduler.store.ts
// ===================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { CalendarView } from '../types/scheduler.enums'
import type {
  ConnectedAccount,
  ContentLibraryItem,
  ScheduledPost,
  CalendarPostItem,
  AnalyticsOverview,
} from '../types/scheduler.types'

interface SchedulerState {
  connectedAccounts: ConnectedAccount[]
  contentLibrary: ContentLibraryItem[]
  contentLibraryTotal: number
  scheduledPosts: ScheduledPost[]
  calendarData: CalendarPostItem[]
  analytics: AnalyticsOverview | null

  selectedAccountIds: string[]
  calendarView: CalendarView
  calendarDate: Date
  calendarRange: { from: Date; to: Date } | null

  selectedContentId: string | null
  editingContentId: string | null
  selectedPostId: string | null

  isLoading: boolean
  isLoadingAccounts: boolean
  isLoadingLibrary: boolean
  isLoadingPosts: boolean
  isLoadingCalendar: boolean
  isLoadingAnalytics: boolean
  error: string | null
}

interface SchedulerActions {
  setConnectedAccounts: (accounts: ConnectedAccount[]) => void
  addConnectedAccount: (account: ConnectedAccount) => void
  removeConnectedAccount: (accountId: string) => void
  updateConnectedAccount: (accountId: string, updates: Partial<ConnectedAccount>) => void

  setContentLibrary: (items: ContentLibraryItem[], total: number) => void
  addContentLibraryItem: (item: ContentLibraryItem) => void
  updateContentLibraryItem: (itemId: string, updates: Partial<ContentLibraryItem>) => void
  removeContentLibraryItem: (itemId: string) => void

  setScheduledPosts: (posts: ScheduledPost[]) => void
  addScheduledPost: (post: ScheduledPost) => void
  addScheduledPosts: (posts: ScheduledPost[]) => void
  updateScheduledPost: (postId: string, updates: Partial<ScheduledPost>) => void
  removeScheduledPost: (postId: string) => void

  setCalendarData: (data: CalendarPostItem[]) => void
  updateCalendarPost: (postId: string, scheduledFor: string) => void

  setAnalytics: (analytics: AnalyticsOverview | null) => void

  setSelectedAccountIds: (ids: string[]) => void
  toggleAccountSelection: (accountId: string) => void
  selectAllAccounts: () => void
  clearAccountSelection: () => void

  setCalendarView: (view: CalendarView) => void
  setCalendarDate: (date: Date) => void
  setCalendarRange: (from: Date, to: Date) => void
  navigateCalendarPrevious: () => void
  navigateCalendarNext: () => void
  navigateCalendarToday: () => void

  setSelectedContentId: (id: string | null) => void
  setEditingContentId: (id: string | null) => void
  setSelectedPostId: (id: string | null) => void

  setLoading: (loading: boolean) => void
  setLoadingAccounts: (loading: boolean) => void
  setLoadingLibrary: (loading: boolean) => void
  setLoadingPosts: (loading: boolean) => void
  setLoadingCalendar: (loading: boolean) => void
  setLoadingAnalytics: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  reset: () => void
}

type SchedulerStore = SchedulerState & SchedulerActions

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  d.setHours(23, 59, 59, 999)
  return d
}

const initialState: SchedulerState = {
  connectedAccounts: [],
  contentLibrary: [],
  contentLibraryTotal: 0,
  scheduledPosts: [],
  calendarData: [],
  analytics: null,

  selectedAccountIds: [],
  calendarView: CalendarView.MONTH,
  calendarDate: new Date(),
  calendarRange: null,

  selectedContentId: null,
  editingContentId: null,
  selectedPostId: null,

  isLoading: false,
  isLoadingAccounts: false,
  isLoadingLibrary: false,
  isLoadingPosts: false,
  isLoadingCalendar: false,
  isLoadingAnalytics: false,
  error: null,
}

export const useSchedulerStore = create<SchedulerStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setConnectedAccounts: (accounts) =>
          set({ connectedAccounts: accounts }, false, 'scheduler/setAccounts'),

        addConnectedAccount: (account) =>
          set(
            (state) => ({
              connectedAccounts: [...state.connectedAccounts, account],
            }),
            false,
            'scheduler/addAccount'
          ),

        removeConnectedAccount: (accountId) =>
          set(
            (state) => ({
              connectedAccounts: state.connectedAccounts.filter((a) => a.id !== accountId),
              selectedAccountIds: state.selectedAccountIds.filter((id) => id !== accountId),
            }),
            false,
            'scheduler/removeAccount'
          ),

        updateConnectedAccount: (accountId, updates) =>
          set(
            (state) => ({
              connectedAccounts: state.connectedAccounts.map((a) =>
                a.id === accountId ? { ...a, ...updates } : a
              ),
            }),
            false,
            'scheduler/updateAccount'
          ),

        setContentLibrary: (items, total) =>
          set(
            { contentLibrary: items, contentLibraryTotal: total },
            false,
            'scheduler/setLibrary'
          ),

        addContentLibraryItem: (item) =>
          set(
            (state) => ({
              contentLibrary: [item, ...state.contentLibrary],
              contentLibraryTotal: state.contentLibraryTotal + 1,
            }),
            false,
            'scheduler/addLibraryItem'
          ),

        updateContentLibraryItem: (itemId, updates) =>
          set(
            (state) => ({
              contentLibrary: state.contentLibrary.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }),
            false,
            'scheduler/updateLibraryItem'
          ),

        removeContentLibraryItem: (itemId) =>
          set(
            (state) => ({
              contentLibrary: state.contentLibrary.filter((item) => item.id !== itemId),
              contentLibraryTotal: Math.max(0, state.contentLibraryTotal - 1),
              selectedContentId:
                state.selectedContentId === itemId ? null : state.selectedContentId,
              editingContentId:
                state.editingContentId === itemId ? null : state.editingContentId,
            }),
            false,
            'scheduler/removeLibraryItem'
          ),

        setScheduledPosts: (posts) =>
          set({ scheduledPosts: posts }, false, 'scheduler/setPosts'),

        addScheduledPost: (post) =>
          set(
            (state) => ({
              scheduledPosts: [post, ...state.scheduledPosts],
            }),
            false,
            'scheduler/addPost'
          ),

        addScheduledPosts: (posts) =>
          set(
            (state) => ({
              scheduledPosts: [...posts, ...state.scheduledPosts],
            }),
            false,
            'scheduler/addPosts'
          ),

        updateScheduledPost: (postId, updates) =>
          set(
            (state) => ({
              scheduledPosts: state.scheduledPosts.map((p) =>
                p.id === postId ? { ...p, ...updates } : p
              ),
              calendarData: state.calendarData.map((p) =>
                p.id === postId ? { ...p, ...updates } : p
              ),
            }),
            false,
            'scheduler/updatePost'
          ),

        removeScheduledPost: (postId) =>
          set(
            (state) => ({
              scheduledPosts: state.scheduledPosts.filter((p) => p.id !== postId),
              calendarData: state.calendarData.filter((p) => p.id !== postId),
              selectedPostId: state.selectedPostId === postId ? null : state.selectedPostId,
            }),
            false,
            'scheduler/removePost'
          ),

        setCalendarData: (data) =>
          set({ calendarData: data }, false, 'scheduler/setCalendarData'),

        updateCalendarPost: (postId, scheduledFor) =>
          set(
            (state) => ({
              calendarData: state.calendarData.map((p) =>
                p.id === postId ? { ...p, scheduled_for: scheduledFor } : p
              ),
              scheduledPosts: state.scheduledPosts.map((p) =>
                p.id === postId ? { ...p, scheduled_for: scheduledFor } : p
              ),
            }),
            false,
            'scheduler/updateCalendarPost'
          ),

        setAnalytics: (analytics) =>
          set({ analytics }, false, 'scheduler/setAnalytics'),

        setSelectedAccountIds: (ids) =>
          set({ selectedAccountIds: ids }, false, 'scheduler/setSelectedAccounts'),

        toggleAccountSelection: (accountId) =>
          set(
            (state) => {
              const isSelected = state.selectedAccountIds.includes(accountId)
              return {
                selectedAccountIds: isSelected
                  ? state.selectedAccountIds.filter((id) => id !== accountId)
                  : [...state.selectedAccountIds, accountId],
              }
            },
            false,
            'scheduler/toggleAccount'
          ),

        selectAllAccounts: () =>
          set(
            (state) => ({
              selectedAccountIds: state.connectedAccounts
                .filter((a) => a.is_active)
                .map((a) => a.id),
            }),
            false,
            'scheduler/selectAllAccounts'
          ),

        clearAccountSelection: () =>
          set({ selectedAccountIds: [] }, false, 'scheduler/clearAccountSelection'),

        setCalendarView: (view) =>
          set({ calendarView: view }, false, 'scheduler/setCalendarView'),

        setCalendarDate: (date) =>
          set({ calendarDate: date }, false, 'scheduler/setCalendarDate'),

        setCalendarRange: (from, to) =>
          set({ calendarRange: { from, to } }, false, 'scheduler/setCalendarRange'),

        navigateCalendarPrevious: () => {
          const state = get()
          const current = state.calendarDate
          let newDate: Date

          switch (state.calendarView) {
            case CalendarView.MONTH:
              newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1)
              break
            case CalendarView.WEEK:
              newDate = new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case CalendarView.DAY:
              newDate = new Date(current.getTime() - 24 * 60 * 60 * 1000)
              break
            default:
              newDate = current
          }

          set({ calendarDate: newDate }, false, 'scheduler/navigatePrevious')
        },

        navigateCalendarNext: () => {
          const state = get()
          const current = state.calendarDate
          let newDate: Date

          switch (state.calendarView) {
            case CalendarView.MONTH:
              newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1)
              break
            case CalendarView.WEEK:
              newDate = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
              break
            case CalendarView.DAY:
              newDate = new Date(current.getTime() + 24 * 60 * 60 * 1000)
              break
            default:
              newDate = current
          }

          set({ calendarDate: newDate }, false, 'scheduler/navigateNext')
        },

        navigateCalendarToday: () =>
          set({ calendarDate: new Date() }, false, 'scheduler/navigateToday'),

        setSelectedContentId: (id) =>
          set({ selectedContentId: id }, false, 'scheduler/setSelectedContent'),

        setEditingContentId: (id) =>
          set({ editingContentId: id }, false, 'scheduler/setEditingContent'),

        setSelectedPostId: (id) =>
          set({ selectedPostId: id }, false, 'scheduler/setSelectedPost'),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'scheduler/setLoading'),

        setLoadingAccounts: (loading) =>
          set({ isLoadingAccounts: loading }, false, 'scheduler/setLoadingAccounts'),

        setLoadingLibrary: (loading) =>
          set({ isLoadingLibrary: loading }, false, 'scheduler/setLoadingLibrary'),

        setLoadingPosts: (loading) =>
          set({ isLoadingPosts: loading }, false, 'scheduler/setLoadingPosts'),

        setLoadingCalendar: (loading) =>
          set({ isLoadingCalendar: loading }, false, 'scheduler/setLoadingCalendar'),

        setLoadingAnalytics: (loading) =>
          set({ isLoadingAnalytics: loading }, false, 'scheduler/setLoadingAnalytics'),

        setError: (error) =>
          set({ error }, false, 'scheduler/setError'),

        clearError: () =>
          set({ error: null }, false, 'scheduler/clearError'),

        reset: () =>
          set(initialState, false, 'scheduler/reset'),
      }),
      {
        name: 'scheduler-storage',
        partialize: (state) => ({
          selectedAccountIds: state.selectedAccountIds,
          calendarView: state.calendarView,
        }),
      }
    ),
    { name: 'SchedulerStore' }
  )
)

export const useConnectedAccounts = (): ConnectedAccount[] =>
  useSchedulerStore((s) => s.connectedAccounts)

export const useActiveAccounts = (): ConnectedAccount[] =>
  useSchedulerStore((s) => s.connectedAccounts.filter((a) => a.is_active))

export const useContentLibrary = (): ContentLibraryItem[] =>
  useSchedulerStore((s) => s.contentLibrary)

export const useContentLibraryTotal = (): number =>
  useSchedulerStore((s) => s.contentLibraryTotal)

export const useScheduledPosts = (): ScheduledPost[] =>
  useSchedulerStore((s) => s.scheduledPosts)

export const useCalendarData = (): CalendarPostItem[] =>
  useSchedulerStore((s) => s.calendarData)

export const useAnalytics = (): AnalyticsOverview | null =>
  useSchedulerStore((s) => s.analytics)

export const useSelectedAccountIds = (): string[] =>
  useSchedulerStore((s) => s.selectedAccountIds)

export const useCalendarView = (): CalendarView =>
  useSchedulerStore((s) => s.calendarView)

export const useCalendarDate = (): Date =>
  useSchedulerStore((s) => s.calendarDate)

export const useCalendarRange = (): { from: Date; to: Date } | null =>
  useSchedulerStore((s) => s.calendarRange)

export const useSelectedContentId = (): string | null =>
  useSchedulerStore((s) => s.selectedContentId)

export const useEditingContentId = (): string | null =>
  useSchedulerStore((s) => s.editingContentId)

export const useSelectedPostId = (): string | null =>
  useSchedulerStore((s) => s.selectedPostId)

export const useIsSchedulerLoading = (): boolean =>
  useSchedulerStore((s) => s.isLoading)

export const useIsLoadingAccounts = (): boolean =>
  useSchedulerStore((s) => s.isLoadingAccounts)

export const useIsLoadingLibrary = (): boolean =>
  useSchedulerStore((s) => s.isLoadingLibrary)

export const useIsLoadingPosts = (): boolean =>
  useSchedulerStore((s) => s.isLoadingPosts)

export const useIsLoadingCalendar = (): boolean =>
  useSchedulerStore((s) => s.isLoadingCalendar)

export const useIsLoadingAnalytics = (): boolean =>
  useSchedulerStore((s) => s.isLoadingAnalytics)

export const useSchedulerError = (): string | null =>
  useSchedulerStore((s) => s.error)

export const useGetCalendarDateRange = (): { from: Date; to: Date } => {
  const calendarDate = useSchedulerStore((s) => s.calendarDate)
  const calendarView = useSchedulerStore((s) => s.calendarView)

  switch (calendarView) {
    case CalendarView.MONTH:
      return {
        from: getStartOfMonth(calendarDate),
        to: getEndOfMonth(calendarDate),
      }
    case CalendarView.WEEK:
      return {
        from: getStartOfWeek(calendarDate),
        to: getEndOfWeek(calendarDate),
      }
    case CalendarView.DAY:
      const start = new Date(calendarDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(calendarDate)
      end.setHours(23, 59, 59, 999)
      return { from: start, to: end }
    default:
      return {
        from: getStartOfMonth(calendarDate),
        to: getEndOfMonth(calendarDate),
      }
  }
}
