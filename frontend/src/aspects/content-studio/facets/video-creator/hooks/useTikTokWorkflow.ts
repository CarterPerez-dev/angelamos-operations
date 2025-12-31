// ===================
// © AngelaMos | 2025
// useTikTokWorkflow.ts
// ===================

import { type UseMutationResult, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/core/api'
import { useTikTokWorkflowStore } from '../stores/tiktok-workflow.store'
import {
  TIKTOK_API,
  LOADING_MESSAGES,
  WorkflowStage,
} from '../types/tiktok.enums'
import {
  isIdeaGenerationResponse,
  isHookGenerationResponse,
  isHookAnalysisResponse,
  isScriptGenerationResponse,
  isScriptAnalysisResponse,
  isFinalReviewResponse,
} from '../types/tiktok.guards'
import type {
  IdeaGenerationRequest,
  IdeaGenerationResponse,
  HookGenerationRequest,
  HookGenerationResponse,
  HookAnalysisRequest,
  HookAnalysisResponse,
  ScriptGenerationRequest,
  ScriptGenerationResponse,
  ScriptAnalysisRequest,
  ScriptAnalysisResponse,
  FinalReviewRequest,
  FinalReviewResponse,
} from '../types/tiktok.types'

class TikTokApiError extends Error {
  endpoint: string

  constructor(message: string, endpoint: string) {
    super(message)
    this.name = 'TikTokApiError'
    this.endpoint = endpoint
  }
}

const generateIdeas = async (
  request: IdeaGenerationRequest
): Promise<IdeaGenerationResponse> => {
  const response = await apiClient.post<unknown>(TIKTOK_API.IDEAS, request)
  const data: unknown = response.data

  if (!isIdeaGenerationResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from idea generation',
      TIKTOK_API.IDEAS
    )
  }

  return data
}

export const useGenerateIdeas = (): UseMutationResult<
  IdeaGenerationResponse,
  Error,
  IdeaGenerationRequest
> => {
  const { saveIdeasResponse, setLoading, setError, goToStage } =
    useTikTokWorkflowStore()

  return useMutation({
    mutationFn: generateIdeas,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.IDEAS])
      setError(null)
    },
    onSuccess: (data) => {
      saveIdeasResponse(data)
      setLoading(false)
      toast.success(`Generated ${data.ideas.length} video ideas`)
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to generate ideas. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}

const generateHooks = async (
  request: HookGenerationRequest
): Promise<HookGenerationResponse> => {
  const response = await apiClient.post<unknown>(TIKTOK_API.HOOKS, request)
  const data: unknown = response.data

  if (!isHookGenerationResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from hook generation',
      TIKTOK_API.HOOKS
    )
  }

  return data
}

export const useGenerateHooks = (): UseMutationResult<
  HookGenerationResponse,
  Error,
  HookGenerationRequest
> => {
  const { saveHooksResponse, setLoading, setError } = useTikTokWorkflowStore()

  return useMutation({
    mutationFn: generateHooks,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.HOOKS])
      setError(null)
    },
    onSuccess: (data) => {
      saveHooksResponse(data)
      setLoading(false)
      toast.success(`Generated ${data.hooks.length} hook variations`)
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to generate hooks. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}

const analyzeHooks = async (
  request: HookAnalysisRequest
): Promise<HookAnalysisResponse> => {
  const response = await apiClient.post<unknown>(
    TIKTOK_API.HOOKS_ANALYZE,
    request
  )
  const data: unknown = response.data

  if (!isHookAnalysisResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from hook analysis',
      TIKTOK_API.HOOKS_ANALYZE
    )
  }

  return data
}

export const useAnalyzeHooks = (): UseMutationResult<
  HookAnalysisResponse,
  Error,
  HookAnalysisRequest
> => {
  const { saveHookAnalysisResponse, setLoading, setError } =
    useTikTokWorkflowStore()

  return useMutation({
    mutationFn: analyzeHooks,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.HOOK_ANALYSIS])
      setError(null)
    },
    onSuccess: (data) => {
      saveHookAnalysisResponse(data)
      setLoading(false)
      toast.success('Hook analysis complete')
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to analyze hooks. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}

const generateScript = async (
  request: ScriptGenerationRequest
): Promise<ScriptGenerationResponse> => {
  const response = await apiClient.post<unknown>(TIKTOK_API.SCRIPT, request)
  const data: unknown = response.data

  if (!isScriptGenerationResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from script generation',
      TIKTOK_API.SCRIPT
    )
  }

  return data
}

export const useGenerateScript = (): UseMutationResult<
  ScriptGenerationResponse,
  Error,
  ScriptGenerationRequest
> => {
  const { saveScriptResponse, setLoading, setError } = useTikTokWorkflowStore()

  return useMutation({
    mutationFn: generateScript,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.SCRIPT])
      setError(null)
    },
    onSuccess: (data) => {
      saveScriptResponse(data)
      setLoading(false)
      toast.success('Script generated with variations')
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to generate script. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}

const analyzeScript = async (
  request: ScriptAnalysisRequest
): Promise<ScriptAnalysisResponse> => {
  const response = await apiClient.post<unknown>(
    TIKTOK_API.SCRIPT_ANALYZE,
    request
  )
  const data: unknown = response.data

  if (!isScriptAnalysisResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from script analysis',
      TIKTOK_API.SCRIPT_ANALYZE
    )
  }

  return data
}

export const useAnalyzeScript = (): UseMutationResult<
  ScriptAnalysisResponse,
  Error,
  ScriptAnalysisRequest
> => {
  const { saveScriptAnalysisResponse, setLoading, setError } =
    useTikTokWorkflowStore()

  return useMutation({
    mutationFn: analyzeScript,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.SCRIPT_ANALYSIS])
      setError(null)
    },
    onSuccess: (data) => {
      saveScriptAnalysisResponse(data)
      setLoading(false)
      toast.success('Script analysis complete')
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to analyze script. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}

const performFinalReview = async (
  request: FinalReviewRequest
): Promise<FinalReviewResponse> => {
  const response = await apiClient.post<unknown>(TIKTOK_API.REVIEW, request)
  const data: unknown = response.data

  if (!isFinalReviewResponse(data)) {
    throw new TikTokApiError(
      'Invalid response format from final review',
      TIKTOK_API.REVIEW
    )
  }

  return data
}

export const useFinalReview = (): UseMutationResult<
  FinalReviewResponse,
  Error,
  FinalReviewRequest
> => {
  const { saveFinalReviewResponse, setLoading, setError } =
    useTikTokWorkflowStore()

  return useMutation({
    mutationFn: performFinalReview,
    onMutate: () => {
      setLoading(true, LOADING_MESSAGES[WorkflowStage.FINAL_REVIEW])
      setError(null)
    },
    onSuccess: (data) => {
      saveFinalReviewResponse(data)
      setLoading(false)
      const decision = data.go_no_go_decision.decision
      if (decision.includes('GO')) {
        toast.success('Ready to record!')
      } else {
        toast.warning('Review the feedback before recording')
      }
    },
    onError: (error) => {
      setLoading(false)
      const message =
        error instanceof TikTokApiError
          ? error.message
          : 'Failed to complete final review. Please try again.'
      setError(message)
      toast.error(message)
    },
  })
}
