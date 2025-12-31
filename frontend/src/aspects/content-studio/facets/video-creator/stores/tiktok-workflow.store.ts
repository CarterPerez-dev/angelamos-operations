// ===================
// © AngelaMos | 2025
// tiktok-workflow.store.ts
// ===================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  WorkflowMode,
  WorkflowStage,
  STAGE_ORDER,
  MAX_SELECTED_HOOKS,
} from '../types/tiktok.enums'
import type {
  TikTokIdea,
  TikTokHook,
  HookAnalysis,
  HookGenerationAnalysis,
  HookRecommendation,
  ScriptSection,
  ScriptHook,
  FullScriptAssembled,
  IdeaGenerationResponse,
  HookGenerationResponse,
  HookAnalysisResponse,
  ScriptGenerationResponse,
  ScriptAnalysisResponse,
  FinalReviewResponse,
} from '../types/tiktok.types'

interface TikTokWorkflowState {
  sessionId: string | null
  mode: WorkflowMode | null
  currentStage: WorkflowStage
  manualTopic: string | null

  generatedIdeas: TikTokIdea[] | null
  chosenIdea: TikTokIdea | null
  contentGapAnalysis: { topics_you_havent_covered: string[]; trending_topics_in_your_niche: string[] } | null

  hookGenerationId: string | null
  generatedHooks: TikTokHook[] | null
  selectedHookIds: number[]
  hookGenerationAnalysis: HookGenerationAnalysis | null

  hookAnalysisData: Record<string, HookAnalysis> | null
  hookRecommendation: HookRecommendation | null
  chosenHook: TikTokHook | null

  scriptGenerationId: string | null
  generatedScript: {
    hook: ScriptHook
    context_building: ScriptSection
    core_delivery: ScriptSection
    key_revelation: ScriptSection
    cta: ScriptSection
  } | null
  fullScriptAssembled: FullScriptAssembled | null
  chosenVariations: Record<number, number>

  scriptAnalysisData: ScriptAnalysisResponse | null

  finalReviewData: FinalReviewResponse | null

  isLoading: boolean
  loadingMessage: string
  error: string | null
}

interface TikTokWorkflowActions {
  startWorkflow: (mode: WorkflowMode) => void
  setSessionId: (id: string) => void
  setManualTopic: (topic: string) => void
  setLoading: (loading: boolean, message?: string) => void
  setError: (error: string | null) => void

  saveIdeasResponse: (response: IdeaGenerationResponse) => void
  selectIdea: (idea: TikTokIdea) => void

  saveHooksResponse: (response: HookGenerationResponse) => void
  toggleHookSelection: (hookId: number) => void
  clearHookSelection: () => void

  saveHookAnalysisResponse: (response: HookAnalysisResponse) => void
  selectFinalHook: (hook: TikTokHook) => void

  saveScriptResponse: (response: ScriptGenerationResponse) => void
  selectVariation: (sentenceNum: number, variationIdx: number) => void
  clearVariationSelections: () => void

  saveScriptAnalysisResponse: (response: ScriptAnalysisResponse) => void

  saveFinalReviewResponse: (response: FinalReviewResponse) => void

  goToStage: (stage: WorkflowStage) => void
  nextStage: () => void
  previousStage: () => void
  goBack: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  getStageIndex: () => number

  resetWorkflow: () => void
  resetFromStage: (stage: WorkflowStage) => void
}

type TikTokWorkflowStore = TikTokWorkflowState & TikTokWorkflowActions

const initialState: TikTokWorkflowState = {
  sessionId: null,
  mode: null,
  currentStage: WorkflowStage.MODE_SELECTION,
  manualTopic: null,

  generatedIdeas: null,
  chosenIdea: null,
  contentGapAnalysis: null,

  hookGenerationId: null,
  generatedHooks: null,
  selectedHookIds: [],
  hookGenerationAnalysis: null,

  hookAnalysisData: null,
  hookRecommendation: null,
  chosenHook: null,

  scriptGenerationId: null,
  generatedScript: null,
  fullScriptAssembled: null,
  chosenVariations: {},

  scriptAnalysisData: null,

  finalReviewData: null,

  isLoading: false,
  loadingMessage: '',
  error: null,
}

export const useTikTokWorkflowStore = create<TikTokWorkflowStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        startWorkflow: (mode) =>
          set(
            {
              ...initialState,
              mode,
              currentStage: mode === WorkflowMode.I_HAVE_IDEA
                ? WorkflowStage.HOOKS
                : WorkflowStage.IDEAS,
            },
            false,
            'workflow/start'
          ),

        setSessionId: (id) =>
          set({ sessionId: id }, false, 'workflow/setSessionId'),

        setManualTopic: (topic) =>
          set({ manualTopic: topic }, false, 'workflow/setManualTopic'),

        setLoading: (loading, message = '') =>
          set({ isLoading: loading, loadingMessage: message }, false, 'workflow/setLoading'),

        setError: (error) =>
          set({ error }, false, 'workflow/setError'),

        saveIdeasResponse: (response) =>
          set(
            {
              sessionId: response.session_id,
              generatedIdeas: response.ideas,
              contentGapAnalysis: response.content_gap_analysis,
            },
            false,
            'workflow/saveIdeas'
          ),

        selectIdea: (idea) =>
          set({ chosenIdea: idea }, false, 'workflow/selectIdea'),

        saveHooksResponse: (response) =>
          set(
            {
              sessionId: response.session_id,
              hookGenerationId: response.generation_id,
              generatedHooks: response.hooks,
              hookGenerationAnalysis: response.hook_analysis,
            },
            false,
            'workflow/saveHooks'
          ),

        toggleHookSelection: (hookId) =>
          set(
            (state) => {
              const isSelected = state.selectedHookIds.includes(hookId)
              if (isSelected) {
                return {
                  selectedHookIds: state.selectedHookIds.filter((id) => id !== hookId),
                }
              }
              if (state.selectedHookIds.length >= MAX_SELECTED_HOOKS) {
                return state
              }
              return {
                selectedHookIds: [...state.selectedHookIds, hookId],
              }
            },
            false,
            'workflow/toggleHookSelection'
          ),

        clearHookSelection: () =>
          set({ selectedHookIds: [] }, false, 'workflow/clearHookSelection'),

        saveHookAnalysisResponse: (response) =>
          set(
            {
              hookAnalysisData: response.analysis,
              hookRecommendation: response.recommendation,
            },
            false,
            'workflow/saveHookAnalysis'
          ),

        selectFinalHook: (hook) =>
          set({ chosenHook: hook }, false, 'workflow/selectFinalHook'),

        saveScriptResponse: (response) =>
          set(
            {
              scriptGenerationId: response.generation_id,
              generatedScript: response.script,
              fullScriptAssembled: response.full_script_assembled,
            },
            false,
            'workflow/saveScript'
          ),

        selectVariation: (sentenceNum, variationIdx) =>
          set(
            (state) => ({
              chosenVariations: {
                ...state.chosenVariations,
                [sentenceNum]: variationIdx,
              },
            }),
            false,
            'workflow/selectVariation'
          ),

        clearVariationSelections: () =>
          set({ chosenVariations: {} }, false, 'workflow/clearVariations'),

        saveScriptAnalysisResponse: (response) =>
          set({ scriptAnalysisData: response }, false, 'workflow/saveScriptAnalysis'),

        saveFinalReviewResponse: (response) =>
          set({ finalReviewData: response }, false, 'workflow/saveFinalReview'),

        goToStage: (stage) =>
          set({ currentStage: stage }, false, 'workflow/goToStage'),

        nextStage: () => {
          const state = get()
          const currentIndex = STAGE_ORDER.indexOf(state.currentStage)
          if (currentIndex < STAGE_ORDER.length - 1) {
            set({ currentStage: STAGE_ORDER[currentIndex + 1] }, false, 'workflow/nextStage')
          }
        },

        previousStage: () => {
          const state = get()
          const currentIndex = STAGE_ORDER.indexOf(state.currentStage)
          if (currentIndex > 0) {
            set({ currentStage: STAGE_ORDER[currentIndex - 1] }, false, 'workflow/previousStage')
          }
        },

        goBack: () => {
          const state = get()
          const currentIndex = STAGE_ORDER.indexOf(state.currentStage)
          if (currentIndex > 0) {
            set({ currentStage: STAGE_ORDER[currentIndex - 1] }, false, 'workflow/goBack')
          }
        },

        canGoBack: () => {
          const state = get()
          const currentIndex = STAGE_ORDER.indexOf(state.currentStage)
          return currentIndex > 0
        },

        canGoForward: () => {
          const state = get()
          const currentIndex = STAGE_ORDER.indexOf(state.currentStage)
          return currentIndex < STAGE_ORDER.length - 1
        },

        getStageIndex: () => {
          const state = get()
          return STAGE_ORDER.indexOf(state.currentStage)
        },

        resetWorkflow: () =>
          set(initialState, false, 'workflow/reset'),

        resetFromStage: (stage) => {
          const stageIndex = STAGE_ORDER.indexOf(stage)
          set(
            (state) => {
              const newState = { ...state, currentStage: stage }

              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.IDEAS)) {
                newState.generatedIdeas = null
                newState.chosenIdea = null
                newState.contentGapAnalysis = null
              }
              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.HOOKS)) {
                newState.hookGenerationId = null
                newState.generatedHooks = null
                newState.selectedHookIds = []
                newState.hookGenerationAnalysis = null
              }
              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.HOOK_ANALYSIS)) {
                newState.hookAnalysisData = null
                newState.hookRecommendation = null
                newState.chosenHook = null
              }
              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.SCRIPT)) {
                newState.scriptGenerationId = null
                newState.generatedScript = null
                newState.fullScriptAssembled = null
                newState.chosenVariations = {}
              }
              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.SCRIPT_ANALYSIS)) {
                newState.scriptAnalysisData = null
              }
              if (stageIndex <= STAGE_ORDER.indexOf(WorkflowStage.FINAL_REVIEW)) {
                newState.finalReviewData = null
              }

              return newState
            },
            false,
            'workflow/resetFromStage'
          )
        },
      }),
      {
        name: 'tiktok-workflow-storage',
        partialize: (state) => ({
          sessionId: state.sessionId,
          mode: state.mode,
          currentStage: state.currentStage,
          manualTopic: state.manualTopic,
          chosenIdea: state.chosenIdea,
          selectedHookIds: state.selectedHookIds,
          chosenHook: state.chosenHook,
          chosenVariations: state.chosenVariations,
        }),
      }
    ),
    { name: 'TikTokWorkflowStore' }
  )
)

export const useSessionId = (): string | null =>
  useTikTokWorkflowStore((s) => s.sessionId)

export const useWorkflowMode = (): WorkflowMode | null =>
  useTikTokWorkflowStore((s) => s.mode)

export const useCurrentStage = (): WorkflowStage =>
  useTikTokWorkflowStore((s) => s.currentStage)

export const useManualTopic = (): string | null =>
  useTikTokWorkflowStore((s) => s.manualTopic)

export const useGeneratedIdeas = (): TikTokIdea[] | null =>
  useTikTokWorkflowStore((s) => s.generatedIdeas)

export const useChosenIdea = (): TikTokIdea | null =>
  useTikTokWorkflowStore((s) => s.chosenIdea)

export const useGeneratedHooks = (): TikTokHook[] | null =>
  useTikTokWorkflowStore((s) => s.generatedHooks)

export const useSelectedHookIds = (): number[] =>
  useTikTokWorkflowStore((s) => s.selectedHookIds)

export const useHookGenerationId = (): string | null =>
  useTikTokWorkflowStore((s) => s.hookGenerationId)

export const useChosenHook = (): TikTokHook | null =>
  useTikTokWorkflowStore((s) => s.chosenHook)

export const useHookAnalysis = (): Record<string, HookAnalysis> | null =>
  useTikTokWorkflowStore((s) => s.hookAnalysisData)

export const useGeneratedScript = () =>
  useTikTokWorkflowStore((s) => s.generatedScript)

export const useChosenVariations = (): Record<number, number> =>
  useTikTokWorkflowStore((s) => s.chosenVariations)

export const useScriptAnalysis = (): ScriptAnalysisResponse | null =>
  useTikTokWorkflowStore((s) => s.scriptAnalysisData)

export const useFinalReview = (): FinalReviewResponse | null =>
  useTikTokWorkflowStore((s) => s.finalReviewData)

export const useIsWorkflowLoading = (): boolean =>
  useTikTokWorkflowStore((s) => s.isLoading)

export const useLoadingMessage = (): string =>
  useTikTokWorkflowStore((s) => s.loadingMessage)

export const useWorkflowError = (): string | null =>
  useTikTokWorkflowStore((s) => s.error)
