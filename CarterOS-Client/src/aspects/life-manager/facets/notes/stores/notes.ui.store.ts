// ===================
// © AngelaMos | 2026
// notes.ui.store.ts
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotesUIState {
  selectedNoteId: string | null
  selectedFolderId: string | null
  editingContent: string
  editingNoteId: string | null
  viewingDeleted: boolean
  selectionMode: boolean
  selectedNoteIds: string[]
  selectedFolderIds: string[]
  setSelectedNote: (id: string | null) => void
  setSelectedFolder: (id: string | null) => void
  setEditingContent: (content: string) => void
  startEditingNote: (id: string, content: string) => void
  clearEditing: () => void
  setViewingDeleted: (viewing: boolean) => void
  toggleSelectionMode: () => void
  toggleNoteSelection: (id: string) => void
  toggleFolderSelection: (id: string) => void
  clearSelections: () => void
}

export const useNotesUIStore = create<NotesUIState>()(
  persist(
    (set) => ({
      selectedNoteId: null,
      selectedFolderId: null,
      editingContent: '',
      editingNoteId: null,
      viewingDeleted: false,
      selectionMode: false,
      selectedNoteIds: [],
      selectedFolderIds: [],
      setSelectedNote: (id) => set({ selectedNoteId: id }),
      setSelectedFolder: (id) =>
        set({ selectedFolderId: id, viewingDeleted: false }),
      setEditingContent: (content) => set({ editingContent: content }),
      startEditingNote: (id, content) =>
        set({
          selectedNoteId: id,
          editingNoteId: id,
          editingContent: content,
        }),
      clearEditing: () =>
        set({ editingContent: '', editingNoteId: null, selectedNoteId: null }),
      setViewingDeleted: (viewing) =>
        set({
          viewingDeleted: viewing,
          selectedFolderId: null,
          selectedNoteId: null,
          editingContent: '',
          editingNoteId: null,
        }),
      toggleSelectionMode: () =>
        set((state) => ({
          selectionMode: !state.selectionMode,
          selectedNoteIds: !state.selectionMode ? [] : state.selectedNoteIds,
          selectedFolderIds: !state.selectionMode ? [] : state.selectedFolderIds,
        })),
      toggleNoteSelection: (id) =>
        set((state) => ({
          selectedNoteIds: state.selectedNoteIds.includes(id)
            ? state.selectedNoteIds.filter((noteId) => noteId !== id)
            : [...state.selectedNoteIds, id],
        })),
      toggleFolderSelection: (id) =>
        set((state) => ({
          selectedFolderIds: state.selectedFolderIds.includes(id)
            ? state.selectedFolderIds.filter((folderId) => folderId !== id)
            : [...state.selectedFolderIds, id],
        })),
      clearSelections: () => set({ selectedNoteIds: [], selectedFolderIds: [] }),
    }),
    {
      name: 'notes-ui-store',
    }
  )
)
