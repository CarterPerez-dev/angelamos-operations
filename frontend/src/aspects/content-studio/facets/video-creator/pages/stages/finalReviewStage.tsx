// ===================
// © AngelaMos | 2025
// finalReviewStage.tsx
// ===================

import { GiCheckMark, GiCrossMark, GiTargetArrows } from 'react-icons/gi'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import { useFinalReview } from '../../hooks/useTikTokWorkflow'
import {
  useTikTokWorkflowStore,
  useSessionId,
  useChosenIdea,
  useChosenHook,
  useGeneratedScript,
  useChosenVariations,
  useFinalReview as useFinalReviewState,
  useManualTopic,
} from '../../stores/tiktok-workflow.store'
import { DEFAULT_VIDEO_LENGTH } from '../../types/tiktok.enums'
import styles from './finalReviewStage.module.scss'

export function FinalReviewStage() {
  const sessionId = useSessionId()
  const chosenIdea = useChosenIdea()
  const chosenHook = useChosenHook()
  const generatedScript = useGeneratedScript()
  const chosenVariations = useChosenVariations()
  const finalReview = useFinalReviewState()
  const manualTopic = useManualTopic()
  const { resetWorkflow, goBack } = useTikTokWorkflowStore()
  const { mutate: runFinalReview, isPending } = useFinalReview()

  const currentTopic = chosenIdea?.topic || manualTopic || ''
  const currentFormat = chosenIdea?.format || 'talking_head'

  const assembleScript = () => {
    if (!generatedScript) return ''

    const sections = Object.entries(generatedScript).filter(([key]) => key !== 'hook')
    const lines: string[] = []

    sections.forEach(([_, section]) => {
      if ('sentences' in section) {
        section.sentences.forEach((sentence) => {
          const variationIdx = chosenVariations[sentence.sentence_number] ?? 0
          const chosenText = sentence.variations[variationIdx] || sentence.variations[0]
          lines.push(chosenText)
        })
      }
    })

    return lines.join(' ')
  }

  const handleRunReview = () => {
    if (!sessionId || !chosenHook) return

    runFinalReview({
      session_id: sessionId,
      finalized_script: assembleScript(),
      chosen_hook: {
        visual: chosenHook.visual_hook,
        text: chosenHook.text_hook,
        verbal: chosenHook.verbal_hook,
      },
      target_length: DEFAULT_VIDEO_LENGTH,
      format: currentFormat,
    })
  }

  const handleStartOver = () => {
    resetWorkflow()
  }

  const goNoGoDecision = finalReview?.go_no_go_decision as Record<string, unknown> | undefined
  const isGo = goNoGoDecision?.decision === 'GO' || goNoGoDecision?.verdict === 'GO'

  return (
    <div className={styles.container}>
      <StageHeader
        title="Final Review"
        description="Final checks on your video before recording. AI provides GO/NO-GO decision."
      />

      {!finalReview ? (
        <div className={styles.reviewSection}>
          <div className={styles.summaryCard}>
            <h3 className={styles.cardTitle}>Video Summary</h3>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Topic</span>
              <span className={styles.summaryValue}>{currentTopic}</span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Format</span>
              <span className={styles.summaryValue}>{currentFormat}</span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Target Length</span>
              <span className={styles.summaryValue}>{DEFAULT_VIDEO_LENGTH}s</span>
            </div>
          </div>

          <div className={styles.hookCard}>
            <h3 className={styles.cardTitle}>Final Hook</h3>
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

          <div className={styles.scriptCard}>
            <h3 className={styles.cardTitle}>Final Script</h3>
            <p className={styles.scriptText}>{assembleScript()}</p>
          </div>

          <button
            className={styles.reviewButton}
            onClick={handleRunReview}
            disabled={isPending || !sessionId}
            type="button"
          >
            <GiTargetArrows className={styles.icon} />
            Run Final Review
          </button>
        </div>
      ) : (
        <div className={styles.resultsSection}>
          <div className={`${styles.decisionCard} ${isGo ? styles.go : styles.noGo}`}>
            <div className={styles.decisionIcon}>
              {isGo ? <GiCheckMark /> : <GiCrossMark />}
            </div>
            <h2 className={styles.decision}>{isGo ? 'GO' : 'NO-GO'}</h2>
            <p className={styles.decisionReason}>
              {goNoGoDecision?.reason as string || goNoGoDecision?.reasoning as string || 'Review complete'}
            </p>
          </div>

          {finalReview.final_checks && (
            <div className={styles.checksCard}>
              <h3 className={styles.cardTitle}>Final Checks</h3>
              <div className={styles.checksList}>
                {Object.entries(finalReview.final_checks).map(([key, value]) => (
                  <div key={key} className={styles.checkItem}>
                    <span className={styles.checkLabel}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.checkValue}>
                      {typeof value === 'boolean' ? (
                        value ? <GiCheckMark className={styles.passIcon} /> : <GiCrossMark className={styles.failIcon} />
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalReview.recording_notes && (
            <div className={styles.notesCard}>
              <h3 className={styles.cardTitle}>Recording Notes</h3>
              <div className={styles.notesList}>
                {Object.entries(finalReview.recording_notes).map(([key, value]) => (
                  <div key={key} className={styles.noteItem}>
                    <span className={styles.noteLabel}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.noteValue}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalReview.performance_prediction && (
            <div className={styles.predictionCard}>
              <h3 className={styles.cardTitle}>Performance Prediction</h3>
              <div className={styles.predictionList}>
                {Object.entries(finalReview.performance_prediction).map(([key, value]) => (
                  <div key={key} className={styles.predictionItem}>
                    <span className={styles.predictionLabel}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.predictionValue}>
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionsSection}>
            <button
              className={styles.startOverButton}
              onClick={handleStartOver}
              type="button"
            >
              Start New Video
            </button>
          </div>
        </div>
      )}

      <NavigationButtons
        onBack={goBack}
        showNext={false}
      />
    </div>
  )
}
