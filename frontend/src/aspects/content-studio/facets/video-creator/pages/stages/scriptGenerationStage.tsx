// ===================
// © AngelaMos | 2025
// scriptGenerationStage.tsx
// ===================

import { GiScrollUnfurled } from 'react-icons/gi'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import { ScriptSentenceCard } from '../../components/scriptSentenceCard'
import { useGenerateScript } from '../../hooks/useTikTokWorkflow'
import {
  useTikTokWorkflowStore,
  useSessionId,
  useChosenIdea,
  useChosenHook,
  useGeneratedScript,
  useChosenVariations,
  useManualTopic,
} from '../../stores/tiktok-workflow.store'
import { WorkflowStage, DEFAULT_VIDEO_LENGTH, VARIATIONS_PER_SENTENCE } from '../../types/tiktok.enums'
import styles from './scriptGenerationStage.module.scss'

export function ScriptGenerationStage() {
  const sessionId = useSessionId()
  const chosenIdea = useChosenIdea()
  const chosenHook = useChosenHook()
  const generatedScript = useGeneratedScript()
  const chosenVariations = useChosenVariations()
  const manualTopic = useManualTopic()
  const { selectVariation, goToStage, goBack } = useTikTokWorkflowStore()
  const { mutate: generateScript, isPending } = useGenerateScript()

  const currentTopic = chosenIdea?.topic || manualTopic || ''
  const currentFormat = chosenIdea?.format || 'talking_head'

  const handleGenerate = () => {
    if (!sessionId || !chosenHook || !currentTopic) return

    generateScript({
      session_id: sessionId,
      chosen_hook_id: chosenHook.id,
      video_length: DEFAULT_VIDEO_LENGTH,
      topic: currentTopic,
      format: currentFormat,
    })
  }

  const handleNext = () => {
    goToStage(WorkflowStage.SCRIPT_ANALYSIS)
  }

  const scriptSections = generatedScript
    ? Object.entries(generatedScript).filter(([key]) => key !== 'hook')
    : []
  const allSentences = scriptSections.flatMap(([_, section]) =>
    'sentences' in section ? section.sentences : []
  )
  const allVariationsSelected = allSentences.every(
    (s) => chosenVariations[s.sentence_number] !== undefined
  )

  return (
    <div className={styles.container}>
      <StageHeader
        title="Script Generation"
        description={`AI generates your script with ${VARIATIONS_PER_SENTENCE} variations per sentence. Choose the best option for each.`}
      />

      {!generatedScript ? (
        <div className={styles.generateSection}>
          <div className={styles.hookPreview}>
            <h3 className={styles.previewTitle}>Chosen Hook</h3>
            <div className={styles.hookDetails}>
              <div className={styles.hookLine}>
                <span className={styles.hookLabel}>Visual:</span>
                <span className={styles.hookText}>{chosenHook?.visual_hook}</span>
              </div>
              <div className={styles.hookLine}>
                <span className={styles.hookLabel}>Text:</span>
                <span className={styles.hookText}>{chosenHook?.text_hook}</span>
              </div>
              <div className={styles.hookLine}>
                <span className={styles.hookLabel}>Verbal:</span>
                <span className={styles.hookText}>{chosenHook?.verbal_hook}</span>
              </div>
            </div>
          </div>
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={isPending || !sessionId || !chosenHook}
            type="button"
          >
            <GiScrollUnfurled className={styles.icon} />
            Generate Script
          </button>
        </div>
      ) : (
        <>
          <p className={styles.instruction}>
            Select one variation for each sentence. AI recommendations are highlighted.
          </p>

          <div className={styles.scriptSections}>
            {scriptSections.map(([sectionKey, section]) => {
              if (!('sentences' in section)) return null
              return (
                <div key={sectionKey} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.timestamp}>{section.timestamp}</span>
                    <span className={styles.energyLevel}>Energy: {section.energy_level}</span>
                  </div>

                  {section.pattern_interrupt_suggestion && (
                    <p className={styles.patternInterrupt}>
                      {section.pattern_interrupt_suggestion}
                    </p>
                  )}

                  <div className={styles.sentences}>
                    {section.sentences.map((sentence) => (
                      <ScriptSentenceCard
                        key={sentence.sentence_number}
                        sentence={sentence}
                        selectedVariation={chosenVariations[sentence.sentence_number] ?? -1}
                        onSelectVariation={(idx) => selectVariation(sentence.sentence_number, idx)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <NavigationButtons
        onBack={goBack}
        onNext={handleNext}
        nextDisabled={!allVariationsSelected}
        nextLabel="Analyze Script"
        showNext={!!generatedScript}
      />
    </div>
  )
}
