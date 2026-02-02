// ===================
// © AngelaMos | 2026
// input.ui.store.ts
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TikTokVideoCreate } from '../types/analytics.types'

interface InputUIState {
  showForm: boolean
  editingId: string | null
  formData: Partial<TikTokVideoCreate>
  setShowForm: (show: boolean) => void
  setEditingId: (id: string | null) => void
  setFormData: (data: Partial<TikTokVideoCreate>) => void
  updateFormField: <K extends keyof TikTokVideoCreate>(
    field: K,
    value: TikTokVideoCreate[K]
  ) => void
  resetFormData: (defaultRank?: number) => void
  clearAll: () => void
}

const getDefaultFormData = (rank: number = 1): Partial<TikTokVideoCreate> => ({
  rank,
  date_posted: new Date().toISOString().split('T')[0],
})

export const useInputUIStore = create<InputUIState>()(
  persist(
    (set) => ({
      showForm: false,
      editingId: null,
      formData: getDefaultFormData(),
      setShowForm: (show) => set({ showForm: show }),
      setEditingId: (id) => set({ editingId: id }),
      setFormData: (data) => set({ formData: data }),
      updateFormField: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),
      resetFormData: (defaultRank) =>
        set({ formData: getDefaultFormData(defaultRank) }),
      clearAll: () =>
        set({
          showForm: false,
          editingId: null,
          formData: getDefaultFormData(),
        }),
    }),
    {
      name: 'analytics-input-ui-store',
    }
  )
)
