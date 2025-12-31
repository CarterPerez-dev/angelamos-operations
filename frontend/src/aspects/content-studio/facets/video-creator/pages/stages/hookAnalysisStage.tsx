// ===================
// © AngelaMos | 2025
// hookAnalysisStage.tsx
// ===================

import { GiMagnifyingGlass } from 'react-icons/gi'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import { HookAnalysisCard } from '../../components/hookAnalysisCard'
import { useAnalyzeHooks } from '../../hooks/useTikTokWorkflow'
import {
  useTikTokWorkflowStore,
  useSessionId,
  useHookGenerationId,
  useGeneratedHooks,
  useSelectedHookIds,
  useHookAnalysis,
  useChosenHook,
} from '../../stores/tiktok-workflow.store'
import { WorkflowStage } from '../../types/tiktok.enums'
import styles from './hookAnalysisStage.module.scss'

export function HookAnalysisStage() {
  const sessionId = useSessionId()
  const hookGenerationId = useHookGenerationId()
  const generatedHooks = useGeneratedHooks()
  const selectedHookIds = useSelectedHookIds()
  const hookAnalysis = useHookAnalysis()
  const chosenHook = useChosenHook()
  const { selectFinalHook, goToStage, goBack } = useTikTokWorkflowStore()
  const { mutate: analyzeHooks, isPending } = useAnalyzeHooks()

  const selectedHooks = generatedHooks?.filter(h => selectedHookIds.includes(h.id)) || []

  const handleAnalyze = () => {
    if (!sessionId || !hookGenerationId || selectedHookIds.length === 0) return

    analyzeHooks({
      session_id: sessionId,
      generation_id: hookGenerationId,
      selected_hook_ids: selectedHookIds,
    })
  }

  const handleNext = () => {
    if (chosenHook) {
      goToStage(WorkflowStage.SCRIPT)
    }
  }

  return (
    <div className={styles.container}>
      <StageHeader
        title="Hook Analysis"
        description={`AI analyzes your ${selectedHookIds.length} selected hooks with pros, cons, and performance predictions.`}
      />

      {!hookAnalysis ? (
        <div className={styles.analyzeSection}>
          <div className={styles.selectedPreview}>
            <h3 className={styles.previewTitle}>Selected Hooks</h3>
            {selectedHooks.map((hook) => (
              <div key={hook.id} className={styles.previewItem}>
                <span className={styles.previewId}>#{hook.id}</span>
                <span className={styles.previewText}>{hook.verbal_hook}</span>
              </div>
            ))}
          </div>
          <button
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={isPending || !sessionId || selectedHookIds.length === 0}
            type="button"
          >
            <GiMagnifyingGlass className={styles.icon} />
            Analyze Hooks
          </button>
        </div>
      ) : (
        <>
          <p className={styles.instruction}>
            Review the analysis below and choose your final hook for script generation.
          </p>

          <div className={styles.analysisGrid}>
            {selectedHooks.map((hook) => {
              const analysis = hookAnalysis[hook.id.toString()]
              if (!analysis) return null

              return (
                <HookAnalysisCard
                  key={hook.id}
                  hook={hook}
                  analysis={analysis}
                  isChosen={chosenHook?.id === hook.id}
                  onChoose={() => selectFinalHook(hook)}
                />
              )
            })}
          </div>
        </>
      )}

      <NavigationButtons
        onBack={goBack}
        onNext={handleNext}
        nextDisabled={!chosenHook}
        nextLabel="Generate Script"
        showNext={!!hookAnalysis}
      />
    </div>
  )
}
