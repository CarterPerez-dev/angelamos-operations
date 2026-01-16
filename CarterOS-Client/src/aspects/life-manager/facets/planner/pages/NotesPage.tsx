// ===================
// © AngelaMos | 2025
// NotesPage.tsx
// ===================

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useCreateFolder,
  useDeleteFolder,
} from '../hooks/usePlanner'
import { usePlannerStore } from '../stores/planner.store'
import type { Note } from '../types/planner.types'
import styles from './NotesPage.module.scss'

export function NotesPage() {
  const { data, isLoading } = useNotes()
  const { mutate: createNote, isPending: isCreatingNote } = useCreateNote()
  const { mutate: updateNote, isPending: isSaving } = useUpdateNote()
  const { mutate: deleteNote } = useDeleteNote()
  const { mutate: createFolder, isPending: isCreatingFolder } = useCreateFolder()
  const { mutate: deleteFolder } = useDeleteFolder()

  const selectedNoteId = usePlannerStore((s) => s.selectedNoteId)
  const selectedFolderId = usePlannerStore((s) => s.selectedFolderId)
  const editingContent = usePlannerStore((s) => s.editingContent)
  const setSelectedFolder = usePlannerStore((s) => s.setSelectedFolder)
  const setEditingContent = usePlannerStore((s) => s.setEditingContent)
  const startEditingNote = usePlannerStore((s) => s.startEditingNote)
  const clearEditing = usePlannerStore((s) => s.clearEditing)

  const [newFolderName, setNewFolderName] = useState('')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedContentRef = useRef('')

  useEffect(() => {
    if (data && selectedFolderId && !data.folders.some((f) => f.id === selectedFolderId)) {
      setSelectedFolder(null)
    }
  }, [data, selectedFolderId, setSelectedFolder])

  const selectedNote = data?.notes.find((n) => n.id === selectedNoteId)

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
    startEditingNote(note.id, note.content)
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

  const filteredNotes = data?.notes.filter((n) =>
    selectedFolderId ? n.folder_id === selectedFolderId : n.folder_id === null
  )

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Folders</h2>
        </div>

        <div className={styles.folderList}>
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className={`${styles.folderItem} ${selectedFolderId === null ? styles.active : ''}`}
          >
            All Notes
          </button>
          {data?.folders.map((folder) => (
            <div key={folder.id} className={styles.folderRow}>
              <button
                type="button"
                onClick={() => setSelectedFolder(folder.id)}
                className={`${styles.folderItem} ${selectedFolderId === folder.id ? styles.active : ''}`}
              >
                {folder.name}
              </button>
              <button
                type="button"
                onClick={() => deleteFolder(folder.id)}
                className={styles.deleteFolderBtn}
              >
                x
              </button>
            </div>
          ))}
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

      <div className={styles.notesList}>
        <div className={styles.notesHeader}>
          <h2 className={styles.notesTitle}>Notes</h2>
        </div>

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

        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : filteredNotes?.length === 0 ? (
          <div className={styles.empty}>No notes yet</div>
        ) : (
          <div className={styles.notes}>
            {filteredNotes?.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`${styles.noteItem} ${selectedNoteId === note.id ? styles.active : ''}`}
              >
                <span className={styles.noteTitle}>{note.title}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNote(note.id)
                    if (selectedNoteId === note.id) clearEditing()
                  }}
                  className={styles.deleteNoteBtn}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.editor}>
        {selectedNote ? (
          <>
            <div className={styles.editorHeader}>
              <h2 className={styles.editorTitle}>
                {selectedNote.title}
                {hasUnsavedChanges && <span className={styles.unsavedIndicator}> *</span>}
              </h2>
              <div className={styles.saveStatus}>
                {isSaving ? (
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
            <textarea
              value={editingContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your notes here..."
              className={styles.editorTextarea}
            />
          </>
        ) : (
          <div className={styles.editorEmpty}>Select a note to edit</div>
        )}
      </div>
    </div>
  )
}
