// ===================
// © AngelaMos | 2025
// planner.store.ts
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlannerState {
  selectedDate: string
  selectedNoteId: string | null
  selectedFolderId: string | null
  editingContent: string
  editingNoteId: string | null
  setSelectedDate: (date: string) => void
  setSelectedNote: (id: string | null) => void
  setSelectedFolder: (id: string | null) => void
  setEditingContent: (content: string) => void
  startEditingNote: (id: string, content: string) => void
  clearEditing: () => void
}

const getTodayString = () => new Date().toISOString().split('T')[0]

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      selectedDate: getTodayString(),
      selectedNoteId: null,
      selectedFolderId: null,
      editingContent: '',
      editingNoteId: null,
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedNote: (id) => set({ selectedNoteId: id }),
      setSelectedFolder: (id) => set({ selectedFolderId: id }),
      setEditingContent: (content) => set({ editingContent: content }),
      startEditingNote: (id, content) => set({
        selectedNoteId: id,
        editingNoteId: id,
        editingContent: content
      }),
      clearEditing: () => set({ editingContent: '', editingNoteId: null, selectedNoteId: null }),
    }),
    {
      name: 'planner-store',
    }
  )
)
