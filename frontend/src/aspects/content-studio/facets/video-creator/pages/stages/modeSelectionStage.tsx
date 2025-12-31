// ===================
// © AngelaMos | 2025
// modeSelectionStage.tsx
// ===================

import { GiLightBulb, GiPencil } from 'react-icons/gi'
import { useTikTokWorkflowStore } from '../../stores/tiktok-workflow.store'
import { WorkflowMode } from '../../types/tiktok.enums'
import styles from './modeSelectionStage.module.scss'

export function ModeSelectionStage() {
  const { startWorkflow } = useTikTokWorkflowStore()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Create TikTok Content</h2>
        <p className={styles.subtitle}>How do you want to start?</p>
      </div>

      <div className={styles.options}>
        <button
          className={styles.optionCard}
          onClick={() => startWorkflow(WorkflowMode.GIVE_ME_IDEAS)}
          type="button"
        >
          <GiLightBulb className={styles.optionIcon} />
          <h3 className={styles.optionTitle}>Give Me Ideas</h3>
          <p className={styles.optionDescription}>
            AI generates 10 video ideas based on your skills, interests, and past performance
          </p>
          <span className={styles.optionTag}>Recommended</span>
        </button>

        <button
          className={styles.optionCard}
          onClick={() => startWorkflow(WorkflowMode.I_HAVE_IDEA)}
          type="button"
        >
          <GiPencil className={styles.optionIcon} />
          <h3 className={styles.optionTitle}>I Have an Idea</h3>
          <p className={styles.optionDescription}>
            Skip idea generation and jump straight to hooks with your own topic
          </p>
        </button>
      </div>
    </div>
  )
}
