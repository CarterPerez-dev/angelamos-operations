// ===================
// © AngelaMos | 2025
// DayPlannerPage.tsx
// ===================

import { useState } from 'react'
import { useTimeBlocks, useCreateBlock, useDeleteBlock } from '../hooks/usePlanner'
import { usePlannerStore } from '../stores/planner.store'
import type { TimeBlockCreate } from '../types/planner.types'
import styles from './DayPlannerPage.module.scss'

type Period = 'AM' | 'PM'

export function DayPlannerPage() {
  const selectedDate = usePlannerStore((s) => s.selectedDate)
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate)

  const { data, isLoading } = useTimeBlocks(selectedDate)
  const { mutate: createBlock, isPending: isCreating } = useCreateBlock()
  const { mutate: deleteBlock } = useDeleteBlock()

  const [startHour, setStartHour] = useState('9')
  const [startMin, setStartMin] = useState('00')
  const [startPeriod, setStartPeriod] = useState<Period>('AM')
  const [endHour, setEndHour] = useState('10')
  const [endMin, setEndMin] = useState('00')
  const [endPeriod, setEndPeriod] = useState<Period>('AM')
  const [title, setTitle] = useState('')

  const convertTo24Hour = (hour: string, period: Period): string => {
    let h = parseInt(hour) || 0
    if (h < 1) h = 12
    if (h > 12) h = 12
    if (period === 'AM') {
      if (h === 12) h = 0
    } else {
      if (h !== 12) h += 12
    }
    return h.toString().padStart(2, '0')
  }

  const handleAddBlock = () => {
    if (!title.trim()) return
    const startH = convertTo24Hour(startHour, startPeriod)
    const endH = convertTo24Hour(endHour, endPeriod)
    const startM = (parseInt(startMin) || 0).toString().padStart(2, '0')
    const endM = (parseInt(endMin) || 0).toString().padStart(2, '0')

    const newBlock: TimeBlockCreate = {
      block_date: selectedDate,
      start_time: `${startH}:${startM}`,
      end_time: `${endH}:${endM}`,
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

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleHourInput = (
    value: string,
    setter: (v: string) => void
  ) => {
    const num = value.replace(/\D/g, '')
    if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 12)) {
      setter(num)
    }
  }

  const handleMinInput = (
    value: string,
    setter: (v: string) => void
  ) => {
    const num = value.replace(/\D/g, '')
    if (num === '' || (parseInt(num) >= 0 && parseInt(num) <= 59)) {
      setter(num.slice(0, 2))
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Day Planner</h1>
        <div className={styles.dateNav}>
          <button type="button" onClick={() => handleDateChange(-1)} className={styles.navBtn}>
            ← Prev
          </button>
          <span className={styles.currentDate}>{formatDisplayDate(selectedDate)}</span>
          <button type="button" onClick={() => handleDateChange(1)} className={styles.navBtn}>
            Next →
          </button>
        </div>
      </header>

      <div className={styles.addSection}>
        <div className={styles.timeInputs}>
          <div className={styles.timeGroup}>
            <span className={styles.timeLabel}>Start</span>
            <div className={styles.timeFields}>
              <input
                type="text"
                value={startHour}
                onChange={(e) => handleHourInput(e.target.value, setStartHour)}
                placeholder="12"
                className={styles.hourInput}
                maxLength={2}
              />
              <span className={styles.colon}>:</span>
              <input
                type="text"
                value={startMin}
                onChange={(e) => handleMinInput(e.target.value, setStartMin)}
                placeholder="00"
                className={styles.minInput}
                maxLength={2}
              />
              <div className={styles.periodToggle}>
                <button
                  type="button"
                  onClick={() => setStartPeriod('AM')}
                  className={`${styles.periodBtn} ${startPeriod === 'AM' ? styles.active : ''}`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setStartPeriod('PM')}
                  className={`${styles.periodBtn} ${startPeriod === 'PM' ? styles.active : ''}`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <span className={styles.toLabel}>to</span>

          <div className={styles.timeGroup}>
            <span className={styles.timeLabel}>End</span>
            <div className={styles.timeFields}>
              <input
                type="text"
                value={endHour}
                onChange={(e) => handleHourInput(e.target.value, setEndHour)}
                placeholder="12"
                className={styles.hourInput}
                maxLength={2}
              />
              <span className={styles.colon}>:</span>
              <input
                type="text"
                value={endMin}
                onChange={(e) => handleMinInput(e.target.value, setEndMin)}
                placeholder="00"
                className={styles.minInput}
                maxLength={2}
              />
              <div className={styles.periodToggle}>
                <button
                  type="button"
                  onClick={() => setEndPeriod('AM')}
                  className={`${styles.periodBtn} ${endPeriod === 'AM' ? styles.active : ''}`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setEndPeriod('PM')}
                  className={`${styles.periodBtn} ${endPeriod === 'PM' ? styles.active : ''}`}
                >
                  PM
                </button>
              </div>
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

      <div className={styles.blockList}>
        {isLoading ? (
          <div className={styles.empty}>Loading...</div>
        ) : data?.items.length === 0 ? (
          <div className={styles.empty}>No time blocks for today. Add one above.</div>
        ) : (
          data?.items.map((block) => (
            <div key={block.id} className={styles.block}>
              <div className={styles.blockTime}>
                {formatTime(block.start_time)} — {formatTime(block.end_time)}
              </div>
              <div className={styles.blockTitle}>{block.title}</div>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                className={styles.deleteBtn}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
