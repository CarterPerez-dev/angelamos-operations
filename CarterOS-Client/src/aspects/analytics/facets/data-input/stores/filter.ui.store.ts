// ===================
// © AngelaMos | 2026
// filter.ui.store.ts
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { VideoFilters } from '../types/analytics.types'

interface FilterUIState {
  filters: VideoFilters
  setSearchQuery: (query: string) => void
  setDateRange: (startDate: string, endDate: string) => void
  setMinViews: (minViews: number | undefined) => void
  clearFilters: () => void
}

const getDefaultFilters = (): VideoFilters => ({
  searchQuery: '',
  startDate: undefined,
  endDate: undefined,
  minViews: undefined,
})

export const useFilterUIStore = create<FilterUIState>()(
  persist(
    (set) => ({
      filters: getDefaultFilters(),
      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),
      setDateRange: (startDate, endDate) =>
        set((state) => ({
          filters: { ...state.filters, startDate, endDate },
        })),
      setMinViews: (minViews) =>
        set((state) => ({
          filters: { ...state.filters, minViews },
        })),
      clearFilters: () => set({ filters: getDefaultFilters() }),
    }),
    {
      name: 'analytics-filter-ui-store',
    }
  )
)
