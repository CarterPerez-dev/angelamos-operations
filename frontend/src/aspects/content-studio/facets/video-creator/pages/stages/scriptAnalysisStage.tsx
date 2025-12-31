// ===================
// © AngelaMos | 2025
// scriptAnalysisStage.tsx
// ===================

import { GiMicroscope, GiCheckMark, GiCycle } from 'react-icons/gi'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import { useAnalyzeScript } from '../../hooks/useTikTokWorkflow'
import {
  useTikTokWorkflowStore,
  useSessionId,
  useChosenVariations,
  useScriptAnalysis,
  useGeneratedScript,
} from '../../stores/tiktok-workflow.store'
import { WorkflowStage } from '../../types/tiktok.enums'
import styles from './scriptAnalysisStage.module.scss'

export function ScriptAnalysisStage() {
  const sessionId = useSessionId()
  const chosenVariations = useChosenVariations()
  const scriptAnalysis = useScriptAnalysis()
  const generatedScript = useGeneratedScript()
  const { goToStage, goBack } = useTikTokWorkflowStore()
  const { mutate: analyzeScript, isPending } = useAnalyzeScript()

  const handleAnalyze = () => {
    if (!sessionId) return

    analyzeScript({
      session_id: sessionId,
      chosen_variations: chosenVariations,
    })
  }

  const handleNext = () => {
    goToStage(WorkflowStage.FINAL_REVIEW)
  }

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

  const sentenceFeedback = scriptAnalysis?.sentence_by_sentence_feedback
    ? Object.entries(scriptAnalysis.sentence_by_sentence_feedback)
    : []

  return (
    <div className={styles.container}>
      <StageHeader
        title="Script Analysis"
        description="AI reviews your assembled script for flow, retention, and engagement potential."
      />

      {!scriptAnalysis ? (
        <div className={styles.analyzeSection}>
          <div className={styles.scriptPreview}>
            <h3 className={styles.previewTitle}>Assembled Script</h3>
            <p className={styles.scriptText}>{assembleScript()}</p>
          </div>
          <button
            className={styles.analyzeButton}
            onClick={handleAnalyze}
            disabled={isPending || !sessionId}
            type="button"
          >
            <GiMicroscope className={styles.icon} />
            Analyze Script
          </button>
        </div>
      ) : (
        <>
          <div className={styles.analysisResults}>
            {scriptAnalysis.overall_assessment && (
              <div className={styles.overallSection}>
                <h3 className={styles.sectionTitle}>Overall Assessment</h3>
                <div className={styles.assessmentContent}>
                  {Object.entries(scriptAnalysis.overall_assessment).map(([key, value]) => (
                    <div key={key} className={styles.assessmentItem}>
                      <span className={styles.assessmentLabel}>{key.replace(/_/g, ' ')}</span>
                      <span className={styles.assessmentValue}>
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentenceFeedback.length > 0 && (
              <div className={styles.feedbackSection}>
                <h3 className={styles.sectionTitle}>Sentence-by-Sentence Feedback</h3>
                <div className={styles.feedbackList}>
                  {sentenceFeedback.map(([sentenceKey, feedback]) => (
                    <div key={sentenceKey} className={styles.feedbackItem}>
                      <div className={styles.feedbackHeader}>
                        <span className={styles.sentenceLabel}>Sentence {sentenceKey}</span>
                        <span className={`${styles.keepSwap} ${feedback.keep_or_swap === 'keep' ? styles.keep : styles.swap}`}>
                          {feedback.keep_or_swap === 'keep' ? (
                            <><GiCheckMark /> Keep</>
                          ) : (
                            <><GiCycle /> Consider Swapping</>
                          )}
                        </span>
                      </div>
                      <p className={styles.yourChoice}>{feedback.your_choice}</p>
                      <p className={styles.assessment}>{feedback.assessment}</p>
                      <p className={styles.whyItWorks}>{feedback.why_it_works}</p>
                      {feedback.alternative_suggestion && (
                        <p className={styles.alternative}>
                          Alternative: {feedback.alternative_suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scriptAnalysis.retention_prediction && (
              <div className={styles.predictionSection}>
                <h3 className={styles.sectionTitle}>Retention Prediction</h3>
                <div className={styles.predictionContent}>
                  {Object.entries(scriptAnalysis.retention_prediction).map(([key, value]) => (
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
          </div>
        </>
      )}

      <NavigationButtons
        onBack={goBack}
        onNext={handleNext}
        nextDisabled={!scriptAnalysis}
        nextLabel="Final Review"
        showNext={!!scriptAnalysis}
      />
    </div>
  )
}
