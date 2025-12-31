// ===================
// © AngelaMos | 2025
// hookGenerationStage.tsx
// ===================

import { GiCog } from 'react-icons/gi'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import { HookCard } from '../../components/hookCard'
import { useGenerateHooks } from '../../hooks/useTikTokWorkflow'
import {
  useTikTokWorkflowStore,
  useSessionId,
  useChosenIdea,
  useGeneratedHooks,
  useSelectedHookIds,
  useWorkflowMode,
  useManualTopic,
} from '../../stores/tiktok-workflow.store'
import { WorkflowMode, WorkflowStage, DEFAULT_HOOK_COUNT, MAX_SELECTED_HOOKS, MIN_SELECTED_HOOKS } from '../../types/tiktok.enums'
import styles from './hookGenerationStage.module.scss'

export function HookGenerationStage() {
  const sessionId = useSessionId()
  const mode = useWorkflowMode()
  const chosenIdea = useChosenIdea()
  const generatedHooks = useGeneratedHooks()
  const selectedHookIds = useSelectedHookIds()
  const storedManualTopic = useManualTopic()
  const { toggleHookSelection, goToStage, goBack, setManualTopic } = useTikTokWorkflowStore()
  const { mutate: generateHooks, isPending } = useGenerateHooks()

  const isManualMode = mode === WorkflowMode.I_HAVE_IDEA
  const currentTopic = isManualMode ? (storedManualTopic || '') : (chosenIdea?.topic || '')
  const canGenerate = isManualMode ? (storedManualTopic || '').trim().length > 0 : !!chosenIdea

  const handleTopicChange = (topic: string) => {
    setManualTopic(topic)
  }

  const handleGenerate = () => {
    if (!canGenerate) return

    generateHooks({
      session_id: sessionId || undefined,
      topic: currentTopic,
      category: chosenIdea?.category,
      target_length: chosenIdea?.video_length_target,
      format: chosenIdea?.format,
      count: DEFAULT_HOOK_COUNT,
    })
  }

  const handleNext = () => {
    if (selectedHookIds.length > 0) {
      goToStage(WorkflowStage.HOOK_ANALYSIS)
    }
  }

  const canProceed = selectedHookIds.length >= MIN_SELECTED_HOOKS && selectedHookIds.length <= MAX_SELECTED_HOOKS

  return (
    <div className={styles.container}>
      <StageHeader
        title="Generate Hooks"
        description={`Create ${DEFAULT_HOOK_COUNT} hook variations for "${currentTopic || 'your topic'}". Select ${MIN_SELECTED_HOOKS}-${MAX_SELECTED_HOOKS} hooks to analyze.`}
      />

      {!generatedHooks ? (
        <div className={styles.generateSection}>
          {isManualMode ? (
            <div className={styles.topicInput}>
              <label htmlFor="topic" className={styles.inputLabel}>
                What's your video topic?
              </label>
              <input
                id="topic"
                type="text"
                className={styles.input}
                value={storedManualTopic || ''}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder="e.g., How to save $1000 in 30 days"
              />
            </div>
          ) : (
            <p className={styles.prompt}>
              Ready to generate {DEFAULT_HOOK_COUNT} unique hooks based on your chosen idea.
            </p>
          )}
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={isPending || !canGenerate}
            type="button"
          >
            <GiCog className={styles.icon} />
            Generate Hooks
          </button>
        </div>
      ) : (
        <>
          <div className={styles.selectionInfo}>
            <span className={styles.selectionCount}>
              {selectedHookIds.length} of {MAX_SELECTED_HOOKS} selected
            </span>
            {selectedHookIds.length === 0 && (
              <span className={styles.selectionHint}>
                Select at least 1 hook to continue
              </span>
            )}
          </div>

          <div className={styles.hookGrid}>
            {generatedHooks.map((hook) => (
              <HookCard
                key={hook.id}
                hook={hook}
                isSelected={selectedHookIds.includes(hook.id)}
                onToggle={() => toggleHookSelection(hook.id)}
                selectionCount={selectedHookIds.length}
                maxSelections={MAX_SELECTED_HOOKS}
              />
            ))}
          </div>
        </>
      )}

      <NavigationButtons
        onBack={goBack}
        onNext={handleNext}
        nextDisabled={!canProceed}
        nextLabel="Analyze Hooks"
        showNext={!!generatedHooks}
      />
    </div>
  )
}
