// ===================
// © AngelaMos | 2026
// NotesPage.tsx
// ===================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ConfirmDeleteModal,
  FolderSidebar,
  NoteEditor,
  NotesList,
} from '../components'
import {
  useBulkDeleteFolders,
  useBulkDeleteNotes,
  useCreateFolder,
  useCreateNote,
  useDeletedNotes,
  useNotes,
  usePermanentDeleteFolder,
  usePermanentDeleteNote,
  useRestoreFolder,
  useRestoreNote,
  useUpdateNote,
} from '../hooks/useNotes'
import { useResizablePanels } from '../hooks/useResizablePanels'
import { useNotesUIStore } from '../stores/notes.ui.store'
import type { Note } from '../types/notes.types'
import styles from './NotesPage.module.scss'

export function NotesPage() {
  const { data, isLoading } = useNotes()
  const { data: deletedData, isLoading: isLoadingDeleted } = useDeletedNotes()
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote()
  const { mutate: updateNote, isPending: isSaving } = useUpdateNote()
  const { mutate: createFolder, isPending: isCreatingFolder } = useCreateFolder()
  const { mutate: restoreNote } = useRestoreNote()
  const { mutate: restoreFolder } = useRestoreFolder()
  const { mutate: permanentDeleteNote } = usePermanentDeleteNote()
  const { mutate: permanentDeleteFolder } = usePermanentDeleteFolder()
  const { mutate: bulkDeleteNotes } = useBulkDeleteNotes()
  const { mutate: bulkDeleteFolders } = useBulkDeleteFolders()

  const selectedNoteId = useNotesUIStore((s) => s.selectedNoteId)
  const selectedFolderId = useNotesUIStore((s) => s.selectedFolderId)
  const editingContent = useNotesUIStore((s) => s.editingContent)
  const viewingDeleted = useNotesUIStore((s) => s.viewingDeleted)
  const selectionMode = useNotesUIStore((s) => s.selectionMode)
  const selectedNoteIds = useNotesUIStore((s) => s.selectedNoteIds)
  const selectedFolderIds = useNotesUIStore((s) => s.selectedFolderIds)
  const setSelectedFolder = useNotesUIStore((s) => s.setSelectedFolder)
  const setEditingContent = useNotesUIStore((s) => s.setEditingContent)
  const startEditingNote = useNotesUIStore((s) => s.startEditingNote)
  const clearEditing = useNotesUIStore((s) => s.clearEditing)
  const setViewingDeleted = useNotesUIStore((s) => s.setViewingDeleted)
  const toggleSelectionMode = useNotesUIStore((s) => s.toggleSelectionMode)
  const toggleNoteSelection = useNotesUIStore((s) => s.toggleNoteSelection)
  const toggleFolderSelection = useNotesUIStore((s) => s.toggleFolderSelection)
  const clearSelections = useNotesUIStore((s) => s.clearSelections)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string
    type: 'note' | 'folder'
  } | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedContentRef = useRef('')

  const { panelWidths, dragging, setDragging, containerRef } =
    useResizablePanels()

  useEffect(() => {
    if (
      data &&
      selectedFolderId &&
      !data.folders.some((f) => f.id === selectedFolderId)
    ) {
      setSelectedFolder(null)
    }
  }, [data, selectedFolderId, setSelectedFolder])

  const selectedNote = viewingDeleted
    ? deletedData?.notes.find((n) => n.id === selectedNoteId)
    : data?.notes.find((n) => n.id === selectedNoteId)

  useEffect(() => {
    if (selectedNote) {
      lastSavedContentRef.current = selectedNote.content
      setHasUnsavedChanges(false)
    }
  }, [selectedNote])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateFolder = (name: string) => {
    createFolder({ name })
  }

  const handleCreateNote = (title: string) => {
    const validFolderId = data?.folders.some((f) => f.id === selectedFolderId)
      ? selectedFolderId
      : undefined
    createNote({
      title,
      folder_id: validFolderId || undefined,
    })
  }

  const handleSelectNote = (note: Note) => {
    if (selectionMode) {
      toggleNoteSelection(note.id)
    } else {
      startEditingNote(note.id, note.content)
    }
  }

  const handleRestoreNote = (id: string) => {
    restoreNote(id, {
      onSuccess: () => {
        clearEditing()
        setViewingDeleted(false)
      },
    })
  }

  const handlePermanentDeleteNote = (id: string) => {
    setConfirmDelete({ id, type: 'note' })
  }

  const handlePermanentDeleteFolder = (id: string) => {
    setConfirmDelete({ id, type: 'folder' })
  }

  const handleConfirmPermanentDelete = () => {
    if (!confirmDelete) return

    if (confirmDelete.type === 'note') {
      permanentDeleteNote(confirmDelete.id)
      if (selectedNoteId === confirmDelete.id) clearEditing()
    } else {
      permanentDeleteFolder(confirmDelete.id)
    }

    setConfirmDelete(null)
  }

  const handleBulkDelete = () => {
    if (selectedNoteIds.length === 0) return
    bulkDeleteNotes(selectedNoteIds, {
      onSuccess: () => {
        clearSelections()
        toggleSelectionMode()
        if (selectedNoteId && selectedNoteIds.includes(selectedNoteId)) {
          clearEditing()
        }
      },
    })
  }

  const handleBulkDeleteFolders = () => {
    if (selectedFolderIds.length === 0) return
    bulkDeleteFolders(selectedFolderIds, {
      onSuccess: () => {
        clearSelections()
        toggleSelectionMode()
        if (selectedFolderId && selectedFolderIds.includes(selectedFolderId)) {
          setSelectedFolder(null)
        }
      },
    })
  }

  const handleSaveContent = useCallback(() => {
    if (!selectedNoteId) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    updateNote(
      { id: selectedNoteId, data: { content: editingContent } },
      {
        onSuccess: () => {
          lastSavedContentRef.current = editingContent
          setHasUnsavedChanges(false)
        },
      }
    )
  }, [selectedNoteId, editingContent, updateNote])

  const handleContentChange = useCallback(
    (newContent: string) => {
      setEditingContent(newContent)
      setHasUnsavedChanges(newContent !== lastSavedContentRef.current)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (selectedNoteId && newContent !== lastSavedContentRef.current) {
          updateNote(
            { id: selectedNoteId, data: { content: newContent } },
            {
              onSuccess: () => {
                lastSavedContentRef.current = newContent
                setHasUnsavedChanges(false)
              },
            }
          )
        }
      }, 1000)
    },
    [selectedNoteId, updateNote, setEditingContent]
  )

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(editingContent)
    } catch (_) {}
  }

  const filteredNotes = viewingDeleted
    ? deletedData?.notes
    : data?.notes
        .filter((n) =>
          selectedFolderId
            ? n.folder_id === selectedFolderId
            : n.folder_id === null
        )
        .sort((a, b) => a.sort_order - b.sort_order)

  const deletedCount =
    (deletedData?.notes.length || 0) + (deletedData?.folders.length || 0)

  return (
    <div ref={containerRef} className={styles.page}>
      <FolderSidebar
        folders={data?.folders || []}
        selectedFolderId={selectedFolderId}
        viewingDeleted={viewingDeleted}
        selectionMode={selectionMode}
        selectedFolderIds={selectedFolderIds}
        deletedCount={deletedCount}
        isCreatingFolder={isCreatingFolder}
        width={panelWidths.sidebar}
        onSelectFolder={setSelectedFolder}
        onToggleFolderSelection={toggleFolderSelection}
        onViewDeleted={() => setViewingDeleted(true)}
        onCreateFolder={handleCreateFolder}
        onBulkDeleteFolders={handleBulkDeleteFolders}
      />

      <div
        role="separator"
        className={`${styles.resizeHandle} ${dragging === 'sidebar' ? styles.dragging : ''}`}
        onMouseDown={() => setDragging('sidebar')}
      />

      <NotesList
        notes={filteredNotes}
        deletedFolders={deletedData?.folders}
        selectedNoteId={selectedNoteId}
        selectedFolderId={selectedFolderId}
        viewingDeleted={viewingDeleted}
        selectionMode={selectionMode}
        selectedNoteIds={selectedNoteIds}
        isLoading={viewingDeleted ? isLoadingDeleted : isLoading}
        isCreatingNote={isCreatingNote}
        width={panelWidths.notesList}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onToggleSelectionMode={toggleSelectionMode}
        onBulkDelete={handleBulkDelete}
        onRestoreNote={handleRestoreNote}
        onRestoreFolder={restoreFolder}
        onPermanentDeleteNote={handlePermanentDeleteNote}
        onPermanentDeleteFolder={handlePermanentDeleteFolder}
      />

      <div
        role="separator"
        className={`${styles.resizeHandle} ${dragging === 'notesList' ? styles.dragging : ''}`}
        onMouseDown={() => setDragging('notesList')}
      />

      <NoteEditor
        selectedNote={selectedNote}
        editingContent={editingContent}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        viewingDeleted={viewingDeleted}
        onContentChange={handleContentChange}
        onSaveContent={handleSaveContent}
        onCopyAll={handleCopyAll}
      />

      {confirmDelete && (
        <ConfirmDeleteModal
          deleteType={confirmDelete.type}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleConfirmPermanentDelete}
        />
      )}
    </div>
  )
}
