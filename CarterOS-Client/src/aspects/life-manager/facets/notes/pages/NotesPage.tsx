// ===================
// © AngelaMos | 2026
// NotesPage.tsx
// ===================

import { useState, useEffect, useRef, useCallback } from 'react'
import { GoTrash } from 'react-icons/go'
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useCreateFolder,
  useDeleteFolder,
  useDeletedNotes,
  useRestoreNote,
  useRestoreFolder,
  usePermanentDeleteNote,
  usePermanentDeleteFolder,
  useBulkDeleteNotes,
  useBulkDeleteFolders,
} from '../hooks/useNotes'
import { useNotesUIStore } from '../stores/notes.ui.store'
import type { Note } from '../types/notes.types'
import styles from './NotesPage.module.scss'

const STORAGE_KEY = 'notes-panel-widths'
const DEFAULT_WIDTHS = { sidebar: 200, notesList: 280 }
const MIN_SIDEBAR = 120
const MAX_SIDEBAR = 350
const MIN_NOTES = 140
const MAX_NOTES = 500

function loadWidths(): { sidebar: number; notesList: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_WIDTHS
}

function saveWidths(widths: { sidebar: number; notesList: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widths))
}

export function NotesPage() {
  const { data, isLoading } = useNotes()
  const { data: deletedData, isLoading: isLoadingDeleted } = useDeletedNotes()
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote()
  const { mutate: updateNote, isPending: isSaving } = useUpdateNote()
  const { mutate: deleteNote } = useDeleteNote()
  const { mutate: createFolder, isPending: isCreatingFolder } = useCreateFolder()
  const { mutate: deleteFolder } = useDeleteFolder()
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

  const [newFolderName, setNewFolderName] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'note' | 'folder' } | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedContentRef = useRef('')

  const [panelWidths, setPanelWidths] = useState(loadWidths)
  const [dragging, setDragging] = useState<'sidebar' | 'notesList' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - containerRect.left

      if (dragging === 'sidebar') {
        const newWidth = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, x))
        setPanelWidths((prev) => {
          const updated = { ...prev, sidebar: newWidth }
          saveWidths(updated)
          return updated
        })
      } else if (dragging === 'notesList') {
        const newWidth = Math.max(MIN_NOTES, Math.min(MAX_NOTES, x - panelWidths.sidebar - 4))
        setPanelWidths((prev) => {
          const updated = { ...prev, notesList: newWidth }
          saveWidths(updated)
          return updated
        })
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, panelWidths.sidebar])

  useEffect(() => {
    if (data && selectedFolderId && !data.folders.some((f) => f.id === selectedFolderId)) {
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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder({ name: newFolderName })
    setNewFolderName('')
  }

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return
    const validFolderId = data?.folders.some((f) => f.id === selectedFolderId)
      ? selectedFolderId
      : undefined
    createNote({
      title: newNoteTitle,
      folder_id: validFolderId || undefined,
    })
    setNewNoteTitle('')
  }

  const handleSelectNote = (note: Note) => {
    if (selectionMode) {
      toggleNoteSelection(note.id)
    } else {
      startEditingNote(note.id, note.content)
    }
  }

  const handleRestore = (id: string) => {
    restoreNote(id, {
      onSuccess: () => {
        clearEditing()
        setViewingDeleted(false)
      },
    })
  }

  const handlePermanentDelete = () => {
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
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const filteredNotes = viewingDeleted
    ? deletedData?.notes
    : data?.notes.filter((n) =>
        selectedFolderId ? n.folder_id === selectedFolderId : n.folder_id === null
      )

  const deletedCount = (deletedData?.notes.length || 0) + (deletedData?.folders.length || 0)

  return (
    <div ref={containerRef} className={styles.page}>
      <div
        className={styles.sidebar}
        style={{ width: panelWidths.sidebar }}
        data-compact={panelWidths.sidebar < 180 ? '' : undefined}
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>
            {selectionMode && selectedFolderIds.length > 0
              ? `${selectedFolderIds.length} Selected`
              : 'Folders'}
          </h2>
          {selectionMode && selectedFolderIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteFolders}
              className={styles.deleteSelectedBtn}
            >
              Delete
            </button>
          )}
        </div>

        <div className={styles.folderList}>
          <div
            onClick={() => setSelectedFolder(null)}
            className={`${styles.folderItem} ${selectedFolderId === null && !viewingDeleted ? styles.active : ''}`}
          >
            All Notes
          </div>
          {data?.folders.map((folder) => {
            const isSelected = selectedFolderIds.includes(folder.id)
            return (
              <div
                key={folder.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleFolderSelection(folder.id)
                  } else {
                    setSelectedFolder(folder.id)
                  }
                }}
                className={`${styles.folderItem} ${selectedFolderId === folder.id && !selectionMode ? styles.active : ''} ${selectionMode && isSelected ? styles.selected : ''}`}
              >
                {folder.name}
              </div>
            )
          })}
          <div className={styles.folderSeparator} />
          <div
            onClick={() => setViewingDeleted(true)}
            className={`${styles.folderItem} ${styles.deletedFolder} ${viewingDeleted ? styles.active : ''}`}
          >
            <GoTrash className={styles.trashIcon} />
            Deleted {deletedCount > 0 && `(${deletedCount})`}
          </div>
        </div>

        <div className={styles.addFolder}>
          <input
            type="text"
            placeholder="New folder..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            className={styles.addFolderInput}
          />
          <button
            type="button"
            onClick={handleCreateFolder}
            disabled={isCreatingFolder}
            className={styles.addFolderBtn}
          >
            +
          </button>
        </div>
      </div>

      <div
        className={`${styles.resizeHandle} ${dragging === 'sidebar' ? styles.dragging : ''}`}
        onMouseDown={() => setDragging('sidebar')}
      />

      <div
        className={styles.notesList}
        style={{ width: panelWidths.notesList }}
        data-compact={panelWidths.notesList < 220 ? '' : undefined}
      >
        <div className={styles.notesHeader}>
          <h2 className={styles.notesTitle}>
            {viewingDeleted ? 'Deleted Notes' : selectionMode ? `${selectedNoteIds.length} Selected` : 'Notes'}
          </h2>
          {!viewingDeleted && (
            <div className={styles.notesActions}>
              {selectionMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={selectedNoteIds.length === 0}
                    className={styles.deleteSelectedBtn}
                  >
                    Delete Selected
                  </button>
                  <button
                    type="button"
                    onClick={toggleSelectionMode}
                    className={styles.cancelSelectBtn}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={toggleSelectionMode}
                  className={styles.selectBtn}
                >
                  Select
                </button>
              )}
            </div>
          )}
        </div>

        {!viewingDeleted && (
          <div className={styles.addNote}>
            <input
              type="text"
              placeholder="New note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
              className={styles.addNoteInput}
            />
            <button
              type="button"
              onClick={handleCreateNote}
              disabled={isCreatingNote}
              className={styles.addNoteBtn}
            >
              Add Note
            </button>
          </div>
        )}

        {(viewingDeleted ? isLoadingDeleted : isLoading) ? (
          <div className={styles.loading}>Loading...</div>
        ) : (viewingDeleted ? (deletedData?.notes.length === 0 && deletedData?.folders.length === 0) : filteredNotes?.length === 0) ? (
          <div className={styles.empty}>{viewingDeleted ? 'No deleted items' : 'No notes yet'}</div>
        ) : (
          <div className={styles.notes}>
            {viewingDeleted && deletedData?.folders && deletedData.folders.length > 0 && (
              <>
                <div className={styles.deletedSectionHeader}>Deleted Folders</div>
                {deletedData.folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`${styles.noteItem} ${styles.deletedItem}`}
                  >
                    <span className={styles.noteTitle}>📁 {folder.name}</span>
                    <div className={styles.deletedActions}>
                      <button
                        type="button"
                        onClick={() => restoreFolder(folder.id)}
                        className={styles.restoreBtn}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ id: folder.id, type: 'folder' })}
                        className={styles.permanentDeleteBtn}
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
                {deletedData.notes.length > 0 && <div className={styles.deletedSectionHeader}>Deleted Notes</div>}
              </>
            )}
            {filteredNotes?.map((note) => {
              const isSelected = selectedNoteIds.includes(note.id)
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`${styles.noteItem} ${selectedNoteId === note.id && !selectionMode ? styles.active : ''} ${viewingDeleted ? styles.deletedItem : ''} ${selectionMode && isSelected ? styles.selected : ''}`}
                >
                  <span className={styles.noteTitle}>{note.title}</span>
                  {viewingDeleted && (
                    <div className={styles.deletedActions}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(note.id)
                        }}
                        className={styles.restoreBtn}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete({ id: note.id, type: 'note' })
                        }}
                        className={styles.permanentDeleteBtn}
                      >
                        Delete Forever
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div
        className={`${styles.resizeHandle} ${dragging === 'notesList' ? styles.dragging : ''}`}
        onMouseDown={() => setDragging('notesList')}
      />

      <div className={styles.editorPanel}>
        {confirmDelete && (
          <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.confirmTitle}>Delete Forever?</h3>
              <p className={styles.confirmText}>
                {confirmDelete.type === 'folder'
                  ? 'This folder and all its notes will be permanently deleted. This cannot be undone.'
                  : 'This note will be permanently deleted. This cannot be undone.'}
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className={styles.confirmCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePermanentDelete}
                  className={styles.confirmDelete}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.editor}>
          {selectedNote ? (
            <>
              <div className={styles.editorHeader}>
                <h2 className={styles.editorTitle}>
                  {selectedNote.title}
                  {hasUnsavedChanges && !viewingDeleted && (
                    <span className={styles.unsavedIndicator}> *</span>
                  )}
                </h2>
                <div className={styles.editorActions}>
                  <button type="button" onClick={handleCopyAll} className={styles.copyBtn}>
                    Copy
                  </button>
                  <div className={styles.saveStatus}>
                    {viewingDeleted ? (
                      <span className={styles.readOnlyBadge}>Read Only</span>
                    ) : isSaving ? (
                      <span className={styles.savingText}>Saving...</span>
                    ) : hasUnsavedChanges ? (
                      <button type="button" onClick={handleSaveContent} className={styles.saveBtn}>
                        Save Now
                      </button>
                    ) : (
                      <span className={styles.savedText}>Saved</span>
                    )}
                  </div>
                </div>
              </div>
              <textarea
                value={editingContent}
                onChange={(e) => !viewingDeleted && handleContentChange(e.target.value)}
                placeholder="Write your notes here..."
                className={styles.editorTextarea}
                readOnly={viewingDeleted}
              />
            </>
          ) : (
            <div className={styles.editorEmpty}>
              Select a note to {viewingDeleted ? 'view' : 'edit'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
