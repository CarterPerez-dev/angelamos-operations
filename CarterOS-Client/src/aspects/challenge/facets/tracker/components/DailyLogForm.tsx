// ===================
// © AngelaMos | 2025
// DailyLogForm.tsx
// ===================

import { useState, useEffect } from 'react'
import { useCreateLog } from '../hooks/useTracker'
import { useTrackerStore } from '../stores/tracker.store'
import { PLATFORM_INFO, PLATFORM_KEYS } from '../types/tracker.enums'
import type { ChallengeLog, LogCreateRequest, PlatformKey } from '../types/tracker.types'
import styles from './DailyLogForm.module.scss'

interface DailyLogFormProps {
  selectedDate: string
  existingLog: ChallengeLog | null
}

export function DailyLogForm({ selectedDate, existingLog }: DailyLogFormProps) {
  const { mutate: createLog, isPending } = useCreateLog()
  const isSavingLog = useTrackerStore((s) => s.isSavingLog)

  const [formData, setFormData] = useState<Record<PlatformKey | 'jobs_applied', number>>({
    tiktok: 0,
    instagram_reels: 0,
    youtube_shorts: 0,
    reddit: 0,
    linkedin_personal: 0,
    jobs_applied: 0,
  })

  useEffect(() => {
    if (existingLog) {
      setFormData({
        tiktok: existingLog.tiktok,
        instagram_reels: existingLog.instagram_reels,
        youtube_shorts: existingLog.youtube_shorts,
        reddit: existingLog.reddit,
        linkedin_personal: existingLog.linkedin_personal,
        jobs_applied: existingLog.jobs_applied,
      })
    } else {
      setFormData({
        tiktok: 0,
        instagram_reels: 0,
        youtube_shorts: 0,
        reddit: 0,
        linkedin_personal: 0,
        jobs_applied: 0,
      })
    }
  }, [existingLog, selectedDate])

  const handleChange = (key: PlatformKey | 'jobs_applied', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    const numValue = cleaned === '' ? 0 : parseInt(cleaned, 10)
    setFormData((prev) => ({
      ...prev,
      [key]: Math.max(0, numValue),
    }))
  }

  const displayValue = (val: number) => (val === 0 ? '' : String(val))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const request: LogCreateRequest = {
      log_date: selectedDate,
      ...formData,
    }

    createLog(request)
  }

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const dayNumber = existingLog?.day_number ?? '—'

  const totalContent = PLATFORM_KEYS.reduce(
    (sum, key) => sum + (formData[key] || 0),
    0
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <span className={styles.dayLabel}>Day {dayNumber}</span>
        <span className={styles.dateLabel}>{formattedDate}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Content</span>
        <div className={styles.inputGrid}>
          {PLATFORM_KEYS.map((key) => (
            <div key={key} className={styles.inputGroup}>
              <label className={styles.label}>{PLATFORM_INFO[key].label}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={displayValue(formData[key])}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="0"
                className={styles.input}
              />
            </div>
          ))}
        </div>
        <div className={styles.subtotal}>
          <span>Content Total</span>
          <span className={styles.subtotalValue}>{totalContent}</span>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Jobs</span>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Jobs Applied</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={displayValue(formData.jobs_applied)}
            onChange={(e) => handleChange('jobs_applied', e.target.value)}
            placeholder="0"
            className={styles.input}
          />
        </div>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isPending || isSavingLog}
      >
        {isPending || isSavingLog ? 'Saving...' : `Save Day ${dayNumber}`}
      </button>
    </form>
  )
}
