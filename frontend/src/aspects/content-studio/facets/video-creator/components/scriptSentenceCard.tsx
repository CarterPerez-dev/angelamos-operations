// ===================
// © AngelaMos | 2025
// scriptSentenceCard.tsx
// ===================

import { GiStarFormation } from 'react-icons/gi'
import type { ScriptSentence } from '../types/tiktok.types'
import styles from './scriptSentenceCard.module.scss'

interface ScriptSentenceCardProps {
  sentence: ScriptSentence
  selectedVariation: number
  onSelectVariation: (index: number) => void
}

export function ScriptSentenceCard({
  sentence,
  selectedVariation,
  onSelectVariation,
}: ScriptSentenceCardProps) {
  const recommendedIndex = sentence.variations.findIndex(
    (v) => v === sentence.recommendation
  )

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.sentenceNumber}>
          Sentence {sentence.sentence_number}
        </span>
        <span className={styles.purpose}>{sentence.purpose}</span>
      </div>

      <div className={styles.variations}>
        {sentence.variations.map((variation, idx) => {
          const isSelected = selectedVariation === idx
          const isRecommended = idx === recommendedIndex

          return (
            <button
              key={idx}
              className={`${styles.variation} ${isSelected ? styles.selected : ''} ${isRecommended ? styles.recommended : ''}`}
              onClick={() => onSelectVariation(idx)}
              type="button"
            >
              <div className={styles.variationHeader}>
                <span className={styles.variationIndex}>Option {idx + 1}</span>
                {isRecommended && (
                  <span className={styles.recommendedBadge}>
                    <GiStarFormation className={styles.starIcon} />
                    AI Pick
                  </span>
                )}
              </div>
              <p className={styles.variationText}>{variation}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
