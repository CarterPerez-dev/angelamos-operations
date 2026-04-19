// ===================
// © AngelaMos | 2025
// DayPlannerPage.tsx
// ===================

import { useState } from 'react'
import { FaGripVertical } from 'react-icons/fa'
import {
  useCreateBlock,
  useDeleteBlock,
  useTimeBlocks,
  useUpdateBlock,
} from '../hooks/usePlanner'
import { usePlannerStore } from '../stores/planner.store'
import type { TimeBlockCreate, TimeBlockUpdate } from '../types/planner.types'
import styles from './DayPlannerPage.module.scss'

const DURATION_OPTIONS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
]

const START_TIME_OPTIONS = [
  '6:00 AM',
  '7:00 AM',
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
  '9:00 PM',
  '10:00 PM',
]

export function DayPlannerPage() {
  const selectedDate = usePlannerStore((s) => s.selectedDate)
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate)

  const { data, isLoading } = useTimeBlocks(selectedDate)
  const { mutate: createBlock, isPending: isCreating } = useCreateBlock()
  const { mutate: deleteBlock } = useDeleteBlock()
  const { mutate: updateBlock } = useUpdateBlock()

  const [startTime, setStartTime] = useState('9:00 AM')
  const [duration, setDuration] = useState(60)
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
    const [time, period] = timeStr.split(' ')
    const [hourStr, minStr] = time.split(':')
    let hour = parseInt(hourStr, 10)
    const minute = parseInt(minStr, 10)

    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0

    return { hour, minute }
  }

  const addMinutes = (timeStr: string, minutesToAdd: number): string => {
    const { hour, minute } = parseTimeString(timeStr)
    const totalMinutes = hour * 60 + minute + minutesToAdd
    const newHour = Math.floor(totalMinutes / 60) % 24
    const newMinute = totalMinutes % 60
    return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
  }

  const formatTo24Hour = (timeStr: string): string => {
    const { hour, minute } = parseTimeString(timeStr)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    return endMinutes - startMinutes
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getLastBlockEndTime = (): string | null => {
    if (!data?.items.length) return null
    const sorted = [...data.items].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    )
    const lastBlock = sorted[sorted.length - 1]
    return lastBlock.end_time
  }

  const handleAddBlock = () => {
    if (!title.trim()) return

    const lastEndTime = getLastBlockEndTime()
    const effectiveStartTime = lastEndTime ? formatTime(lastEndTime) : startTime

    const start24 = formatTo24Hour(effectiveStartTime)
    const end24 = addMinutes(effectiveStartTime, duration)

    const newBlock: TimeBlockCreate = {
      block_date: selectedDate,
      start_time: start24,
      end_time: end24,
      title: title.trim(),
    }

    createBlock(newBlock)
    setTitle('')
  }

  const handleDateChange = (offset: number) => {
    const current = new Date(selectedDate)
    current.setDate(current.getDate() + offset)
    setSelectedDate(current.toISOString().split('T')[0])
  }

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleEditClick = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const handleEditSave = (id: string) => {
    if (editTitle.trim()) {
      const update: TimeBlockUpdate = { title: editTitle.trim() }
      updateBlock({ id, data: update })
    }
    setEditingId(null)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const items = data?.items || []
    const draggedIndex = items.findIndex((b) => b.id === draggedId)
    const targetIndex = items.findIndex((b) => b.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItem)

    newItems.forEach((item, index) => {
      updateBlock({ id: item.id, data: { sort_order: index } })
    })

    setDraggedId(null)
  }

  const sortedBlocks =
    data?.items.slice().sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.start_time.localeCompare(b.start_time)
    }) || []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Day Planner</h1>
        <div className={styles.dateNav}>
          <button
            type="button"
            onClick={() => handleDateChange(-1)}
            className={styles.navBtn}
          >
            ← Prev
          </button>
          <span className={styles.currentDate}>
            {formatDisplayDate(selectedDate)}
          </span>
          <button
            type="button"
            onClick={() => handleDateChange(1)}
            className={styles.navBtn}
          >
            Next →
          </button>
        </div>
      </header>

      <div className={styles.addSection}>
        <div className={styles.topRow}>
          <div className={styles.startTimeGroup}>
            <label className={styles.label}>
              Start Time
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={styles.timeSelect}
                disabled={!!getLastBlockEndTime()}
              >
                {START_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
            {(() => {
              const lastEnd = getLastBlockEndTime()
              return lastEnd ? (
                <span className={styles.autoNote}>
                  (Auto: {formatTime(lastEnd)})
                </span>
              ) : null
            })()}
          </div>

          <div className={styles.durationGroup}>
            <span className={styles.label}>Duration</span>
            <div className={styles.durationButtons}>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setDuration(opt.minutes)}
                  className={`${styles.durationBtn} ${duration === opt.minutes ? styles.active : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.taskRow}>
          <input
            type="text"
            placeholder="What are you working on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddBlock()}
            className={styles.titleInput}
          />
          <button
            type="button"
            onClick={handleAddBlock}
            disabled={isCreating || !title.trim()}
            className={styles.addBtn}
          >
            Add Block
          </button>
        </div>
      </div>

      <div className={styles.timeline}>
        {isLoading ? (
          <div className={styles.empty}>Loading...</div>
        ) : sortedBlocks.length === 0 ? (
          <div className={styles.empty}>
            No time blocks for today. Add one above.
          </div>
        ) : (
          sortedBlocks.map((block) => {
            const durationMinutes = calculateDuration(
              block.start_time,
              block.end_time
            )
            const isEditing = editingId === block.id

            return (
              <div
                key={block.id}
                role="listitem"
                className={`${styles.block} ${draggedId === block.id ? styles.dragging : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, block.id)}
              >
                <div className={styles.blockDragHandle}>
                  <FaGripVertical />
                </div>

                <div className={styles.blockTime}>
                  <div className={styles.timeRange}>
                    {formatTime(block.start_time)} — {formatTime(block.end_time)}
                  </div>
                  <div className={styles.durationBadge}>
                    {formatDuration(durationMinutes)}
                  </div>
                </div>

                <div className={styles.blockContent}>
                  {isEditing ? (
                    <div className={styles.editMode}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(block.id)
                          if (e.key === 'Escape') handleEditCancel()
                        }}
                        className={styles.editInput}
                      />
                      <button
                        type="button"
                        onClick={() => handleEditSave(block.id)}
                        className={styles.saveBtn}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        role="button"
                        tabIndex={0}
                        className={styles.blockTitle}
                        onClick={() => handleEditClick(block.id, block.title)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            handleEditClick(block.id, block.title)
                        }}
                      >
                        {block.title}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className={styles.deleteBtn}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
