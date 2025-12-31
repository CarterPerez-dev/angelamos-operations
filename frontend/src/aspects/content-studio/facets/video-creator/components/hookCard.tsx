// ===================
// © AngelaMos | 2025
// hookCard.tsx
// ===================

import { GiCheckMark } from 'react-icons/gi'
import type { TikTokHook } from '../types/tiktok.types'
import styles from './hookCard.module.scss'

interface HookCardProps {
  hook: TikTokHook
  isSelected: boolean
  onToggle: () => void
  selectionCount: number
  maxSelections: number
}

export function HookCard({
  hook,
  isSelected,
  onToggle,
  selectionCount,
  maxSelections,
}: HookCardProps) {
  const canSelect = isSelected || selectionCount < maxSelections

  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${!canSelect ? styles.disabled : ''}`}
      onClick={canSelect ? onToggle : undefined}
      type="button"
      disabled={!canSelect}
    >
      <div className={styles.header}>
        <span className={styles.hookId}>Hook #{hook.id}</span>
        <span className={styles.stopRate}>{hook.estimated_stop_rate}</span>
        {isSelected && (
          <span className={styles.checkmark}>
            <GiCheckMark />
          </span>
        )}
      </div>

      <div className={styles.hookTriplet}>
        <div className={styles.hookSection}>
          <span className={styles.hookLabel}>Visual</span>
          <p className={styles.hookText}>{hook.visual_hook}</p>
        </div>

        <div className={styles.hookSection}>
          <span className={styles.hookLabel}>Text</span>
          <p className={styles.hookText}>{hook.text_hook}</p>
        </div>

        <div className={styles.hookSection}>
          <span className={styles.hookLabel}>Verbal</span>
          <p className={styles.hookText}>{hook.verbal_hook}</p>
        </div>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>{hook.word_count} words</span>
        <span className={styles.metaItem}>
          {hook.hook_formulas_used.length} formulas
        </span>
      </div>

      {hook.reasoning && (
        <p className={styles.reasoning}>{hook.reasoning}</p>
      )}

      <div className={styles.tags}>
        {hook.credibility_signals.slice(0, 2).map((signal, idx) => (
          <span key={`cred-${idx}`} className={styles.tag}>
            {signal}
          </span>
        ))}
        {hook.curiosity_drivers.slice(0, 2).map((driver, idx) => (
          <span key={`cur-${idx}`} className={styles.tag}>
            {driver}
          </span>
        ))}
      </div>
    </button>
  )
}
