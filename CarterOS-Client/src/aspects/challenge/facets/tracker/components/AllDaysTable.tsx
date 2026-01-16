// ===================
// © AngelaMos | 2025
// AllDaysTable.tsx
// ===================

import { useMemo } from 'react'
import { PLATFORM_INFO, PLATFORM_KEYS } from '../types/tracker.enums'
import type { ChallengeWithStats, ChallengeLog, PlatformKey } from '../types/tracker.types'
import styles from './AllDaysTable.module.scss'

interface AllDaysTableProps {
  challenge: ChallengeWithStats
}

interface DayRow {
  dayNumber: number
  date: string
  log: ChallengeLog | null
}

export function AllDaysTable({ challenge }: AllDaysTableProps) {
  const rows = useMemo(() => {
    const result: DayRow[] = []
    const startDate = new Date(challenge.start_date)

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const log = challenge.logs.find((l) => l.log_date === dateStr) ?? null

      result.push({
        dayNumber: i + 1,
        date: dateStr,
        log,
      })
    }

    return result
  }, [challenge.start_date, challenge.logs])

  const totals = useMemo(() => {
    const platformTotals: Record<PlatformKey, number> = {
      tiktok: 0,
      instagram_reels: 0,
      youtube_shorts: 0,
      reddit: 0,
      linkedin_personal: 0,
    }

    let jobsTotal = 0
    let contentTotal = 0

    challenge.logs.forEach((log) => {
      PLATFORM_KEYS.forEach((key) => {
        platformTotals[key] += log[key]
      })
      jobsTotal += log.jobs_applied
      contentTotal += log.total_content
    })

    return { platformTotals, jobsTotal, contentTotal }
  }, [challenge.logs])

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.dayCol}>Day</th>
              {PLATFORM_KEYS.map((key) => (
                <th key={key} className={styles.dataCol}>
                  {PLATFORM_INFO[key].shortLabel}
                </th>
              ))}
              <th className={styles.dataCol}>Jobs</th>
              <th className={styles.totalCol}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dayNumber} className={row.log ? '' : styles.emptyRow}>
                <td className={styles.dayCol}>{row.dayNumber}</td>
                {PLATFORM_KEYS.map((key) => (
                  <td key={key} className={styles.dataCol}>
                    {row.log ? row.log[key] : '—'}
                  </td>
                ))}
                <td className={styles.dataCol}>
                  {row.log ? row.log.jobs_applied : '—'}
                </td>
                <td className={styles.totalCol}>
                  {row.log ? row.log.total_content : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalsRow}>
              <td className={styles.dayCol}>Total</td>
              {PLATFORM_KEYS.map((key) => (
                <td key={key} className={styles.dataCol}>
                  {totals.platformTotals[key]}
                </td>
              ))}
              <td className={styles.dataCol}>{totals.jobsTotal}</td>
              <td className={styles.totalCol}>{totals.contentTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
