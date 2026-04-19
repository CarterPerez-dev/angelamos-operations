// ===================
// © AngelaMos | 2026
// NotesList.tsx
// ===================

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PiDotsNineLight } from 'react-icons/pi'
import { useUpdateNote } from '../hooks/useNotes'
import styles from '../pages/NotesPage.module.scss'
import type { Note, NoteFolder, NotesListResponse } from '../types/notes.types'
import { InlineEdit } from './InlineEdit'

interface NotesListProps {
  notes: Note[] | undefined
  deletedFolders?: NoteFolder[]
  selectedNoteId: string | null
  selectedFolderId: string | null
  viewingDeleted: boolean
  selectionMode: boolean
  selectedNoteIds: string[]
  isLoading: boolean
  isCreatingNote: boolean
  width: number
  onSelectNote: (note: Note) => void
  onCreateNote: (title: string) => void
  onToggleSelectionMode: () => void
  onBulkDelete: () => void
  onRestoreNote: (id: string) => void
  onRestoreFolder: (id: string) => void
  onPermanentDeleteNote: (id: string) => void
  onPermanentDeleteFolder: (id: string) => void
}

interface SortableNoteProps {
  note: Note
  selectedNoteId: string | null
  selectionMode: boolean
  viewingDeleted: boolean
  isSelected: boolean
  onSelectNote: (note: Note) => void
  onRename: (noteId: string, newTitle: string) => void
  onRestoreNote: (id: string) => void
  onPermanentDeleteNote: (id: string) => void
}

function SortableNote({
  note,
  selectedNoteId,
  selectionMode,
  viewingDeleted,
  isSelected,
  onSelectNote,
  onRename,
  onRestoreNote,
  onPermanentDeleteNote,
}: SortableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: note.id,
      disabled: viewingDeleted,
    })

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      style={style}
      onClick={() => onSelectNote(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelectNote(note)
      }}
      className={`${styles.noteItem} ${selectedNoteId === note.id && !selectionMode ? styles.active : ''} ${viewingDeleted ? styles.deletedItem : ''} ${selectionMode && isSelected ? styles.selected : ''}`}
    >
      <InlineEdit
        value={note.title}
        onSave={(newTitle) => onRename(note.id, newTitle)}
        disabled={selectionMode || viewingDeleted}
        className={styles.noteTitle}
      />
      {!viewingDeleted && (
        <span className={styles.dragHandle} {...attributes} {...listeners}>
          <PiDotsNineLight />
        </span>
      )}
      {viewingDeleted && (
        <div className={styles.deletedActions}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRestoreNote(note.id)
            }}
            className={styles.restoreBtn}
          >
            Restore
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPermanentDeleteNote(note.id)
            }}
            className={styles.permanentDeleteBtn}
          >
            Delete Forever
          </button>
        </div>
      )}
    </div>
  )
}

export function NotesList({
  notes,
  deletedFolders,
  selectedNoteId,
  selectedFolderId,
  viewingDeleted,
  selectionMode,
  selectedNoteIds,
  isLoading,
  isCreatingNote,
  width,
  onSelectNote,
  onCreateNote,
  onToggleSelectionMode,
  onBulkDelete,
  onRestoreNote,
  onRestoreFolder,
  onPermanentDeleteNote,
  onPermanentDeleteFolder,
}: NotesListProps) {
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const { mutate: updateNote } = useUpdateNote()
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return
    onCreateNote(newNoteTitle)
    setNewNoteTitle('')
  }

  const handleRenameNote = (noteId: string, newTitle: string) => {
    updateNote({ id: noteId, data: { title: newTitle } })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id || !notes) return

    const oldIndex = notes.findIndex((n) => n.id === active.id)
    const newIndex = notes.findIndex((n) => n.id === over.id)

    const reorderedNotes = arrayMove(notes, oldIndex, newIndex)

    queryClient.setQueryData<NotesListResponse>(['notes'], (old) => {
      if (!old) return old

      const updatedNotes = old.notes.map((note) => {
        const folderMatches = selectedFolderId
          ? note.folder_id === selectedFolderId
          : note.folder_id === null
        if (!folderMatches) return note

        const reorderedIndex = reorderedNotes.findIndex((n) => n.id === note.id)
        if (reorderedIndex !== -1) {
          return { ...note, sort_order: reorderedIndex }
        }
        return note
      })

      return { ...old, notes: updatedNotes }
    })

    reorderedNotes.forEach((note, index) => {
      if (note.sort_order !== index) {
        updateNote({ id: note.id, data: { sort_order: index } })
      }
    })
  }

  return (
    <div
      className={styles.notesList}
      style={{ width }}
      data-compact={width < 220 ? '' : undefined}
    >
      <div className={styles.notesHeader}>
        <h2 className={styles.notesTitle}>
          {viewingDeleted
            ? 'Deleted Notes'
            : selectionMode
              ? `${selectedNoteIds.length} Selected`
              : 'Notes'}
        </h2>
        {!viewingDeleted && (
          <div className={styles.notesActions}>
            {selectionMode ? (
              <>
                <button
                  type="button"
                  onClick={onBulkDelete}
                  disabled={selectedNoteIds.length === 0}
                  className={styles.deleteSelectedBtn}
                >
                  Delete Selected
                </button>
                <button
                  type="button"
                  onClick={onToggleSelectionMode}
                  className={styles.cancelSelectBtn}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onToggleSelectionMode}
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

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
          viewingDeleted
            ? notes?.length === 0 && deletedFolders?.length === 0
            : notes?.length === 0
        ) ? (
        <div className={styles.empty}>
          {viewingDeleted ? 'No deleted items' : 'No notes yet'}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.notes}>
            {viewingDeleted && deletedFolders && deletedFolders.length > 0 && (
              <>
                <div className={styles.deletedSectionHeader}>Deleted Folders</div>
                {deletedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`${styles.noteItem} ${styles.deletedItem}`}
                  >
                    <span className={styles.noteTitle}>📁 {folder.name}</span>
                    <div className={styles.deletedActions}>
                      <button
                        type="button"
                        onClick={() => onRestoreFolder(folder.id)}
                        className={styles.restoreBtn}
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onPermanentDeleteFolder(folder.id)}
                        className={styles.permanentDeleteBtn}
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
                {notes && notes.length > 0 && (
                  <div className={styles.deletedSectionHeader}>Deleted Notes</div>
                )}
              </>
            )}
            <SortableContext
              items={notes?.map((n) => n.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {notes?.map((note) => {
                const isSelected = selectedNoteIds.includes(note.id)
                return (
                  <SortableNote
                    key={note.id}
                    note={note}
                    selectedNoteId={selectedNoteId}
                    selectionMode={selectionMode}
                    viewingDeleted={viewingDeleted}
                    isSelected={isSelected}
                    onSelectNote={onSelectNote}
                    onRename={handleRenameNote}
                    onRestoreNote={onRestoreNote}
                    onPermanentDeleteNote={onPermanentDeleteNote}
                  />
                )
              })}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  )
}
