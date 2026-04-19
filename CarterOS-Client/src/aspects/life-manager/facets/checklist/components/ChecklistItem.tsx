// ===================
// © AngelaMos | 2026
// ChecklistItem.tsx
// ===================

import { useState } from 'react'
import type { ChecklistLogEntry } from '../types'
import styles from './ChecklistItem.module.scss'

interface ChecklistItemProps {
  entry: ChecklistLogEntry
  onToggle: (id: string, completed: boolean, note?: string | null) => void
  editMode: boolean
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}

export function ChecklistItem({
  entry,
  onToggle,
  editMode,
  onEdit,
  onDelete,
}: ChecklistItemProps) {
  const [note, setNote] = useState(entry.note ?? '')
  const [showNote, setShowNote] = useState(!!entry.note)
  const [editTitle, setEditTitle] = useState(entry.item_title)

  const handleCheck = () => {
    const nextCompleted = !entry.completed
    onToggle(entry.id, nextCompleted, nextCompleted ? note || null : null)
    if (nextCompleted) setShowNote(true)
  }

  const handleNoteBlur = () => {
    if (entry.completed) {
      onToggle(entry.id, true, note || null)
    }
  }

  return (
    <div className={`${styles.row} ${entry.completed ? styles.completed : ''}`}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={entry.completed}
        onChange={handleCheck}
      />

      {editMode ? (
        <input
          className={styles.titleInput}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => onEdit(entry.item_id, editTitle)}
        />
      ) : (
        <span className={styles.title}>{entry.item_title}</span>
      )}

      {entry.completed && !editMode && (
        <button
          type="button"
          className={styles.noteToggle}
          onClick={() => setShowNote((v) => !v)}
        >
          {showNote ? 'hide note' : 'add note'}
        </button>
      )}

      {editMode && (
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onDelete(entry.item_id)}
        >
          remove
        </button>
      )}

      {showNote && entry.completed && !editMode && (
        <input
          className={styles.noteInput}
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
        />
      )}
    </div>
  )
}
