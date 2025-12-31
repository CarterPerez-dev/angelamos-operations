// ===================
// © AngelaMos | 2025
// hookAnalysisCard.tsx
// ===================

import { GiCheckMark, GiCrossMark, GiNuclearBomb } from 'react-icons/gi'
import type { HookAnalysis, TikTokHook } from '../types/tiktok.types'
import styles from './hookAnalysisCard.module.scss'

interface HookAnalysisCardProps {
  hook: TikTokHook
  analysis: HookAnalysis
  isChosen: boolean
  onChoose: () => void
}

export function HookAnalysisCard({
  hook,
  analysis,
  isChosen,
  onChoose,
}: HookAnalysisCardProps) {
  return (
    <div className={`${styles.card} ${isChosen ? styles.chosen : ''}`}>
      <div className={styles.header}>
        <span className={styles.hookId}>Hook #{hook.id}</span>
        <span className={styles.prediction}>{analysis.performance_prediction}</span>
        {isChosen && (
          <span className={styles.chosenBadge}>
            <GiCheckMark /> Chosen
          </span>
        )}
      </div>

      <div className={styles.hookPreview}>
        <div className={styles.hookLine}>
          <span className={styles.hookType}>Visual:</span>
          <span className={styles.hookContent}>{hook.visual_hook}</span>
        </div>
        <div className={styles.hookLine}>
          <span className={styles.hookType}>Text:</span>
          <span className={styles.hookContent}>{hook.text_hook}</span>
        </div>
        <div className={styles.hookLine}>
          <span className={styles.hookType}>Verbal:</span>
          <span className={styles.hookContent}>{hook.verbal_hook}</span>
        </div>
      </div>

      <div className={styles.analysisGrid}>
        <div className={styles.prosSection}>
          <h4 className={styles.sectionTitle}>
            <GiCheckMark className={styles.prosIcon} />
            Pros
          </h4>
          <ul className={styles.list}>
            {analysis.pros.map((pro, idx) => (
              <li key={idx} className={styles.listItem}>{pro}</li>
            ))}
          </ul>
        </div>

        <div className={styles.consSection}>
          <h4 className={styles.sectionTitle}>
            <GiCrossMark className={styles.consIcon} />
            Cons
          </h4>
          <ul className={styles.list}>
            {analysis.cons.map((con, idx) => (
              <li key={idx} className={styles.listItem}>{con}</li>
            ))}
          </ul>
        </div>
      </div>

      {analysis.risk_factors.length > 0 && (
        <div className={styles.riskSection}>
          <h4 className={styles.sectionTitle}>
            <GiNuclearBomb className={styles.warningIcon} />
            Risk Factors
          </h4>
          <ul className={styles.list}>
            {analysis.risk_factors.map((risk, idx) => (
              <li key={idx} className={styles.listItem}>{risk}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        className={`${styles.chooseButton} ${isChosen ? styles.chosenButton : ''}`}
        onClick={onChoose}
        type="button"
        disabled={isChosen}
      >
        {isChosen ? 'Selected' : 'Choose This Hook'}
      </button>
    </div>
  )
}
