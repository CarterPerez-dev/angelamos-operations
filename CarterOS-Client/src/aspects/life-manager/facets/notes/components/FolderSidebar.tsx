// ===================
// © AngelaMos | 2026
// FolderSidebar.tsx
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
import { GoTrash } from 'react-icons/go'
import { PiDotsNineLight } from 'react-icons/pi'
import { useUpdateFolder } from '../hooks/useNotes'
import styles from '../pages/NotesPage.module.scss'
import type { NoteFolder, NotesListResponse } from '../types/notes.types'
import { InlineEdit } from './InlineEdit'

interface FolderSidebarProps {
  folders: NoteFolder[]
  selectedFolderId: string | null
  viewingDeleted: boolean
  selectionMode: boolean
  selectedFolderIds: string[]
  deletedCount: number
  isCreatingFolder: boolean
  width: number
  onSelectFolder: (folderId: string | null) => void
  onToggleFolderSelection: (folderId: string) => void
  onViewDeleted: () => void
  onCreateFolder: (name: string) => void
  onBulkDeleteFolders: () => void
}

interface SortableFolderProps {
  folder: NoteFolder
  selectedFolderId: string | null
  selectionMode: boolean
  isSelected: boolean
  onSelectFolder: (folderId: string) => void
  onToggleFolderSelection: (folderId: string) => void
  onRename: (folderId: string, newName: string) => void
}

function SortableFolder({
  folder,
  selectedFolderId,
  selectionMode,
  isSelected,
  onSelectFolder,
  onToggleFolderSelection,
  onRename,
}: SortableFolderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: folder.id,
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
      onClick={() => {
        if (selectionMode) {
          onToggleFolderSelection(folder.id)
        } else {
          onSelectFolder(folder.id)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (selectionMode) onToggleFolderSelection(folder.id)
          else onSelectFolder(folder.id)
        }
      }}
      className={`${styles.folderItem} ${selectedFolderId === folder.id && !selectionMode ? styles.active : ''} ${selectionMode && isSelected ? styles.selected : ''}`}
    >
      <InlineEdit
        value={folder.name}
        onSave={(newName) => onRename(folder.id, newName)}
        disabled={selectionMode}
      />
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        <PiDotsNineLight />
      </span>
    </div>
  )
}

export function FolderSidebar({
  folders,
  selectedFolderId,
  viewingDeleted,
  selectionMode,
  selectedFolderIds,
  deletedCount,
  isCreatingFolder,
  width,
  onSelectFolder,
  onToggleFolderSelection,
  onViewDeleted,
  onCreateFolder,
  onBulkDeleteFolders,
}: FolderSidebarProps) {
  const [newFolderName, setNewFolderName] = useState('')
  const { mutate: updateFolder } = useUpdateFolder()
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    onCreateFolder(newFolderName)
    setNewFolderName('')
  }

  const handleRenameFolder = (folderId: string, newName: string) => {
    updateFolder({ id: folderId, data: { name: newName } })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = folders.findIndex((f) => f.id === active.id)
    const newIndex = folders.findIndex((f) => f.id === over.id)

    const reorderedFolders = arrayMove(folders, oldIndex, newIndex)

    queryClient.setQueryData<NotesListResponse>(['notes'], (old) => {
      if (!old) return old
      return {
        ...old,
        folders: reorderedFolders.map((folder, index) => ({
          ...folder,
          sort_order: index,
        })),
      }
    })

    reorderedFolders.forEach((folder, index) => {
      if (folder.sort_order !== index) {
        updateFolder({ id: folder.id, data: { sort_order: index } })
      }
    })
  }

  return (
    <div
      className={styles.sidebar}
      style={{ width }}
      data-compact={width < 180 ? '' : undefined}
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
            onClick={onBulkDeleteFolders}
            className={styles.deleteSelectedBtn}
          >
            Delete
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.folderList}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectFolder(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectFolder(null)
            }}
            className={`${styles.folderItem} ${selectedFolderId === null && !viewingDeleted ? styles.active : ''}`}
          >
            All Notes
          </div>
          <SortableContext
            items={folders.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {folders.map((folder) => {
              const isSelected = selectedFolderIds.includes(folder.id)
              return (
                <SortableFolder
                  key={folder.id}
                  folder={folder}
                  selectedFolderId={selectedFolderId}
                  selectionMode={selectionMode}
                  isSelected={isSelected}
                  onSelectFolder={onSelectFolder}
                  onToggleFolderSelection={onToggleFolderSelection}
                  onRename={handleRenameFolder}
                />
              )
            })}
          </SortableContext>
          <div className={styles.folderSeparator} />
          <div
            role="button"
            tabIndex={0}
            onClick={onViewDeleted}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onViewDeleted()
            }}
            className={`${styles.folderItem} ${styles.deletedFolder} ${viewingDeleted ? styles.active : ''}`}
          >
            <GoTrash className={styles.trashIcon} />
            Deleted {deletedCount > 0 && `(${deletedCount})`}
          </div>
        </div>
      </DndContext>

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
  )
}
