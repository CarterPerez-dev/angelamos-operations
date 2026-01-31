// ===================
// © AngelaMos | 2026
// planner.store.ts
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlannerState {
  selectedDate: string
  setSelectedDate: (date: string) => void
}

const getTodayString = () => new Date().toISOString().split('T')[0]

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      selectedDate: getTodayString(),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'planner-store',
    }
  )
)
