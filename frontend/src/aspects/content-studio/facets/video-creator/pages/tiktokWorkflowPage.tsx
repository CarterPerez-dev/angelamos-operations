// ===================
// © AngelaMos | 2025
// tiktokWorkflowPage.tsx
// ===================

import { useEffect } from 'react'
import {
  useTikTokWorkflowStore,
  useCurrentStage,
  useIsWorkflowLoading,
  useLoadingMessage,
  useWorkflowError,
} from '../stores/tiktok-workflow.store'
import { WorkflowStage, STAGE_ORDER } from '../types/tiktok.enums'
import { WorkflowProgress } from '../components/workflowProgress'
import { LoadingOverlay } from '../components/loadingOverlay'
import { ModeSelectionStage } from './stages/modeSelectionStage'
import { IdeaGenerationStage } from './stages/ideaGenerationStage'
import { HookGenerationStage } from './stages/hookGenerationStage'
import { HookAnalysisStage } from './stages/hookAnalysisStage'
import { ScriptGenerationStage } from './stages/scriptGenerationStage'
import { ScriptAnalysisStage } from './stages/scriptAnalysisStage'
import { FinalReviewStage } from './stages/finalReviewStage'
import styles from './tiktokWorkflowPage.module.scss'

export function TikTokWorkflowPage() {
  const currentStage = useCurrentStage()
  const isLoading = useIsWorkflowLoading()
  const loadingMessage = useLoadingMessage()
  const error = useWorkflowError()
  const { resetWorkflow } = useTikTokWorkflowStore()

  useEffect(() => {
    return () => {
    }
  }, [])

  const renderStage = () => {
    switch (currentStage) {
      case WorkflowStage.MODE_SELECTION:
        return <ModeSelectionStage />
      case WorkflowStage.IDEAS:
        return <IdeaGenerationStage />
      case WorkflowStage.HOOKS:
        return <HookGenerationStage />
      case WorkflowStage.HOOK_ANALYSIS:
        return <HookAnalysisStage />
      case WorkflowStage.SCRIPT:
        return <ScriptGenerationStage />
      case WorkflowStage.SCRIPT_ANALYSIS:
        return <ScriptAnalysisStage />
      case WorkflowStage.FINAL_REVIEW:
        return <FinalReviewStage />
      default:
        return <ModeSelectionStage />
    }
  }

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage)
  const showProgress = currentStage !== WorkflowStage.MODE_SELECTION

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>TikTok Content Generator</h1>
          {showProgress && (
            <button
              className={styles.resetButton}
              onClick={resetWorkflow}
              type="button"
            >
              Start Over
            </button>
          )}
        </div>
        {showProgress && (
          <WorkflowProgress
            currentStage={currentStage}
            stageIndex={currentStageIndex}
          />
        )}
      </header>

      <main className={styles.main}>
        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button
              onClick={() => useTikTokWorkflowStore.getState().setError(null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        )}
        {renderStage()}
      </main>

      {isLoading && <LoadingOverlay message={loadingMessage} />}
    </div>
  )
}
