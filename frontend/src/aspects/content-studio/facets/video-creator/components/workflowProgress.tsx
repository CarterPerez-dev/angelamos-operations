// ===================
// © AngelaMos | 2025
// workflowProgress.tsx
// ===================

import { WorkflowStage, STAGE_ORDER, STAGE_TITLES } from '../types/tiktok.enums'
import styles from './workflowProgress.module.scss'

interface WorkflowProgressProps {
  currentStage: WorkflowStage
  stageIndex: number
}

export function WorkflowProgress({ currentStage, stageIndex }: WorkflowProgressProps) {
  const stages = STAGE_ORDER.filter((s) => s !== WorkflowStage.MODE_SELECTION)

  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        {stages.map((stage, index) => {
          const adjustedIndex = stageIndex - 1
          const isCompleted = index < adjustedIndex
          const isCurrent = index === adjustedIndex
          const isPending = index > adjustedIndex

          return (
            <div
              key={stage}
              className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isPending ? styles.pending : ''}`}
            >
              <div className={styles.indicator}>
                {isCompleted ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={styles.label}>{STAGE_TITLES[stage]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
