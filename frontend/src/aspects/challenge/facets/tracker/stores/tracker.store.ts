// ===================
// © AngelaMos | 2025
// tracker.store.ts
// ===================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { TrackerTab } from '../types/tracker.enums'
import type { ChallengeWithStats, ChallengeLog } from '../types/tracker.types'

interface TrackerState {
  challenge: ChallengeWithStats | null
  selectedDate: string | null
  activeTab: TrackerTab

  isLoading: boolean
  isStarting: boolean
  isSavingLog: boolean
  error: string | null
}

interface TrackerActions {
  setChallenge: (challenge: ChallengeWithStats | null) => void
  updateLog: (log: ChallengeLog) => void

  setSelectedDate: (date: string | null) => void
  setActiveTab: (tab: TrackerTab) => void

  setLoading: (loading: boolean) => void
  setStarting: (starting: boolean) => void
  setSavingLog: (saving: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  reset: () => void
}

type TrackerStore = TrackerState & TrackerActions

const initialState: TrackerState = {
  challenge: null,
  selectedDate: null,
  activeTab: TrackerTab.DASHBOARD,

  isLoading: false,
  isStarting: false,
  isSavingLog: false,
  error: null,
}

export const useTrackerStore = create<TrackerStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setChallenge: (challenge) =>
          set({ challenge }, false, 'tracker/setChallenge'),

        updateLog: (log) =>
          set(
            (state) => {
              if (!state.challenge) return state

              const existingIndex = state.challenge.logs.findIndex(
                (l) => l.log_date === log.log_date
              )

              const updatedLogs =
                existingIndex >= 0
                  ? state.challenge.logs.map((l, i) =>
                      i === existingIndex ? log : l
                    )
                  : [...state.challenge.logs, log]

              const totalContent = updatedLogs.reduce(
                (sum, l) => sum + l.total_content,
                0
              )
              const totalJobs = updatedLogs.reduce(
                (sum, l) => sum + l.jobs_applied,
                0
              )

              return {
                challenge: {
                  ...state.challenge,
                  logs: updatedLogs,
                  total_content: totalContent,
                  total_jobs: totalJobs,
                  content_percentage:
                    state.challenge.content_goal > 0
                      ? Math.round(
                          (totalContent / state.challenge.content_goal) * 1000
                        ) / 10
                      : 0,
                  jobs_percentage:
                    state.challenge.jobs_goal > 0
                      ? Math.round(
                          (totalJobs / state.challenge.jobs_goal) * 1000
                        ) / 10
                      : 0,
                },
              }
            },
            false,
            'tracker/updateLog'
          ),

        setSelectedDate: (date) =>
          set({ selectedDate: date }, false, 'tracker/setSelectedDate'),

        setActiveTab: (tab) =>
          set({ activeTab: tab }, false, 'tracker/setActiveTab'),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'tracker/setLoading'),

        setStarting: (starting) =>
          set({ isStarting: starting }, false, 'tracker/setStarting'),

        setSavingLog: (saving) =>
          set({ isSavingLog: saving }, false, 'tracker/setSavingLog'),

        setError: (error) =>
          set({ error }, false, 'tracker/setError'),

        clearError: () =>
          set({ error: null }, false, 'tracker/clearError'),

        reset: () =>
          set(initialState, false, 'tracker/reset'),
      }),
      {
        name: 'tracker-storage',
        partialize: (state) => ({
          activeTab: state.activeTab,
          selectedDate: state.selectedDate,
        }),
      }
    ),
    { name: 'TrackerStore' }
  )
)

export const useChallenge = (): ChallengeWithStats | null =>
  useTrackerStore((s) => s.challenge)

export const useSelectedDate = (): string | null =>
  useTrackerStore((s) => s.selectedDate)

export const useActiveTab = (): TrackerTab =>
  useTrackerStore((s) => s.activeTab)

export const useIsTrackerLoading = (): boolean =>
  useTrackerStore((s) => s.isLoading)

export const useIsStarting = (): boolean =>
  useTrackerStore((s) => s.isStarting)

export const useIsSavingLog = (): boolean =>
  useTrackerStore((s) => s.isSavingLog)

export const useTrackerError = (): string | null =>
  useTrackerStore((s) => s.error)

export const useSelectedLog = (): ChallengeLog | null => {
  const challenge = useTrackerStore((s) => s.challenge)
  const selectedDate = useTrackerStore((s) => s.selectedDate)

  if (!challenge || !selectedDate) return null

  return challenge.logs.find((l) => l.log_date === selectedDate) ?? null
}
