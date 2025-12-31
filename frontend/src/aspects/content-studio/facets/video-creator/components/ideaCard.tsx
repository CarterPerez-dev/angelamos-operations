// ===================
// © AngelaMos | 2025
// ideaCard.tsx
// ===================

import type { TikTokIdea } from '../types/tiktok.types'
import styles from './ideaCard.module.scss'

interface IdeaCardProps {
  idea: TikTokIdea
  isSelected: boolean
  onSelect: () => void
}

export function IdeaCard({ idea, isSelected, onSelect }: IdeaCardProps) {
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
      type="button"
    >
      <div className={styles.header}>
        <span className={styles.category}>{idea.category}</span>
        <span className={styles.risk}>{idea.risk_level}</span>
      </div>

      <h3 className={styles.topic}>{idea.topic}</h3>

      <div className={styles.meta}>
        <span className={styles.metaItem}>{idea.video_length_target}</span>
        <span className={styles.metaItem}>{idea.format}</span>
      </div>

      <p className={styles.engagement}>{idea.estimated_engagement}</p>

      {idea.reasoning.why_it_fits_carter && (
        <p className={styles.reasoning}>{idea.reasoning.why_it_fits_carter}</p>
      )}

      <div className={styles.hookStyle}>
        <span className={styles.hookLabel}>Hook style:</span>
        <span className={styles.hookValue}>{idea.suggested_hook_style}</span>
      </div>
    </button>
  )
}
