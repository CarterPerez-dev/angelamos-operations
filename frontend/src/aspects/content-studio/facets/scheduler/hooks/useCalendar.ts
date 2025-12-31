// ===================
// © AngelaMos | 2025
// useCalendar.ts
// ===================

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/core/api'
import { API_ENDPOINTS, QUERY_KEYS } from '@/config'
import { useSchedulerStore, useGetCalendarDateRange } from '../stores'
import type {
  CalendarPostItem,
  CalendarRescheduleRequest,
  ScheduledPost,
} from '../types'

const fetchCalendarData = async (
  from: Date,
  to: Date,
  accountIds?: string[]
): Promise<CalendarPostItem[]> => {
  const params = new URLSearchParams()
  params.append('from_date', from.toISOString())
  params.append('to_date', to.toISOString())

  if (accountIds && accountIds.length > 0) {
    params.append('account_ids', accountIds.join(','))
  }

  const response = await apiClient.get<CalendarPostItem[]>(
    `${API_ENDPOINTS.SCHEDULER.CALENDAR.DATA}?${params}`
  )
  return response.data
}

export const useCalendarData = (): UseQueryResult<CalendarPostItem[], Error> => {
  const setCalendarData = useSchedulerStore((s) => s.setCalendarData)
  const setLoadingCalendar = useSchedulerStore((s) => s.setLoadingCalendar)
  const selectedAccountIds = useSchedulerStore((s) => s.selectedAccountIds)
  const dateRange = useGetCalendarDateRange()

  return useQuery({
    queryKey: QUERY_KEYS.SCHEDULER.CALENDAR(
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
      selectedAccountIds.length > 0 ? selectedAccountIds : undefined
    ),
    queryFn: async () => {
      setLoadingCalendar(true)
      try {
        const data = await fetchCalendarData(
          dateRange.from,
          dateRange.to,
          selectedAccountIds.length > 0 ? selectedAccountIds : undefined
        )
        setCalendarData(data)
        return data
      } finally {
        setLoadingCalendar(false)
      }
    },
    staleTime: 1000 * 60,
  })
}

const calendarReschedule = async (
  request: CalendarRescheduleRequest
): Promise<ScheduledPost> => {
  const response = await apiClient.put<ScheduledPost>(
    API_ENDPOINTS.SCHEDULER.CALENDAR.RESCHEDULE,
    request
  )
  return response.data
}

export const useCalendarReschedule = (): UseMutationResult<
  ScheduledPost,
  Error,
  CalendarRescheduleRequest
> => {
  const queryClient = useQueryClient()
  const updateCalendarPost = useSchedulerStore((s) => s.updateCalendarPost)

  return useMutation({
    mutationFn: calendarReschedule,
    onMutate: async (request) => {
      updateCalendarPost(request.post_id, request.scheduled_for)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.success('Post rescheduled')
    },
    onError: (error, request) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULER.ALL })
      toast.error(error.message || 'Failed to reschedule post')
    },
  })
}

export const useCalendarNavigation = () => {
  const {
    calendarView,
    calendarDate,
    setCalendarView,
    setCalendarDate,
    navigateCalendarPrevious,
    navigateCalendarNext,
    navigateCalendarToday,
  } = useSchedulerStore()

  const getCalendarTitle = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    }

    switch (calendarView) {
      case 'month':
        return calendarDate.toLocaleDateString('en-US', options)
      case 'week': {
        const startOfWeek = new Date(calendarDate)
        const day = startOfWeek.getDay()
        startOfWeek.setDate(startOfWeek.getDate() - day)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)

        const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' })
        const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
        const year = calendarDate.getFullYear()

        if (startMonth === endMonth) {
          return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`
        }
        return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`
      }
      case 'day':
        return calendarDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      default:
        return calendarDate.toLocaleDateString('en-US', options)
    }
  }

  return {
    view: calendarView,
    date: calendarDate,
    title: getCalendarTitle(),
    setView: setCalendarView,
    setDate: setCalendarDate,
    goToPrevious: navigateCalendarPrevious,
    goToNext: navigateCalendarNext,
    goToToday: navigateCalendarToday,
  }
}
