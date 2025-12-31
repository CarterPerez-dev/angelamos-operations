// ===================
// © AngelaMos | 2025
// ideaGenerationStage.tsx
// ===================

import { GiSparkles } from 'react-icons/gi'
import {
  useTikTokWorkflowStore,
  useGeneratedIdeas,
  useChosenIdea,
} from '../../stores/tiktok-workflow.store'
import { useGenerateIdeas } from '../../hooks/useTikTokWorkflow'
import { WorkflowMode, WorkflowStage, DEFAULT_IDEA_COUNT } from '../../types/tiktok.enums'
import { IdeaCard } from '../../components/ideaCard'
import { StageHeader } from '../../components/stageHeader'
import { NavigationButtons } from '../../components/navigationButtons'
import styles from './ideaGenerationStage.module.scss'

export function IdeaGenerationStage() {
  const ideas = useGeneratedIdeas()
  const chosenIdea = useChosenIdea()
  const { selectIdea, goToStage, mode } = useTikTokWorkflowStore()
  const { mutate: generateIdeas, isPending } = useGenerateIdeas()

  const handleGenerate = () => {
    generateIdeas({
      mode: mode ?? WorkflowMode.GIVE_ME_IDEAS,
      count: DEFAULT_IDEA_COUNT,
    })
  }

  const handleNext = () => {
    if (chosenIdea) {
      goToStage(WorkflowStage.HOOKS)
    }
  }

  const handleBack = () => {
    goToStage(WorkflowStage.MODE_SELECTION)
  }

  return (
    <div className={styles.container}>
      <StageHeader
        title="Idea Generation"
        description="AI generates 10 video ideas based on your skills and past performance. Pick one to continue."
      />

      {!ideas && (
        <div className={styles.generateSection}>
          <button
            className={styles.generateButton}
            onClick={handleGenerate}
            disabled={isPending}
            type="button"
          >
            <GiSparkles className={styles.buttonIcon} />
            Generate 10 Ideas
          </button>
        </div>
      )}

      {ideas && ideas.length > 0 && (
        <div className={styles.ideasGrid}>
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isSelected={chosenIdea?.id === idea.id}
              onSelect={() => selectIdea(idea)}
            />
          ))}
        </div>
      )}

      <NavigationButtons
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={!chosenIdea}
        nextLabel="Continue to Hooks"
      />
    </div>
  )
}
