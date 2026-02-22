// ===================
// © AngelaMos | 2026
// checklistPage.tsx
// ===================

import { useState } from 'react'
import {
  useChecklistDay,
  useChecklistStats,
  useUpdateChecklistLog,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useCreateChecklistItem,
} from '../hooks/useChecklist'
import { ChecklistItem, StatsPanel, HeatmapGrid } from '../components'
import styles from './checklistPage.module.scss'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function ChecklistPage() {
  const today = todayStr()
  const [editMode, setEditMode] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const { data: dayData, isLoading: dayLoading } = useChecklistDay(today)
  const { data: stats } = useChecklistStats()
  const { mutate: updateLog } = useUpdateChecklistLog(today)
  const { mutate: updateItem } = useUpdateChecklistItem()
  const { mutate: deleteItem } = useDeleteChecklistItem()
  const { mutate: createItem } = useCreateChecklistItem()

  const handleToggle = (id: string, completed: boolean, note?: string | null) => {
    updateLog({ id, data: { completed, note } })
  }

  const handleEdit = (itemId: string, title: string) => {
    updateItem({ id: itemId, data: { title } })
  }

  const handleDelete = (itemId: string) => {
    deleteItem(itemId)
  }

  const handleAddItem = () => {
    if (!newTitle.trim()) return
    createItem({ title: newTitle.trim() })
    setNewTitle('')
  }

  if (dayLoading) return <div className={styles.loading}>Loading...</div>
  if (!dayData) return null

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.title}>Daily Checklist</h2>
            <span className={styles.date}>{today}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.count}>
              {dayData.completed_count}/{dayData.total_count}
            </span>
            <button
              className={`${styles.editToggle} ${editMode ? styles.editActive : ''}`}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? 'done' : 'edit'}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          {dayData.entries.map((entry) => (
            <ChecklistItem
              key={entry.id}
              entry={entry}
              onToggle={handleToggle}
              editMode={editMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {editMode && (
            <div className={styles.addRow}>
              <input
                className={styles.addInput}
                placeholder="New item..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button className={styles.addBtn} onClick={handleAddItem}>
                add
              </button>
            </div>
          )}
        </div>
      </section>

      {stats && (
        <section className={styles.section}>
          <h2 className={styles.title}>Stats</h2>
          <div className={styles.card}>
            <StatsPanel stats={stats} />
          </div>
        </section>
      )}

      {stats && (
        <section className={styles.section}>
          <h2 className={styles.title}>{new Date().getFullYear()} Activity</h2>
          <div className={styles.card}>
            <HeatmapGrid heatmap={stats.heatmap} />
          </div>
        </section>
      )}
    </div>
  )
}
