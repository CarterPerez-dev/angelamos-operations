/**
 * Angela AI Assistant - Type Definitions
 */

import type { AngelaState, Expression } from './angela.enums'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface AngelaSettings {
  voiceId: string
  modelName: string
  wakeWordSensitivity: number
  silenceThreshold: number
  silenceDuration: number
}

export interface AngelaStoreState {
  status: AngelaState
  transcript: string | null
  response: string | null
  error: string | null
  messages: ChatMessage[]
  isRecording: boolean
  audioLevel: number
  currentExpression: Expression
  isSpeaking: boolean
  settings: AngelaSettings
  isExpanded: boolean
  isEnabled: boolean
}

export interface AngelaStoreActions {
  transitionTo: (state: AngelaState) => void
  setTranscript: (text: string | null) => void
  setResponse: (text: string | null) => void
  addMessage: (message: ChatMessage) => void
  clearConversation: () => void
  setRecording: (recording: boolean) => void
  setAudioLevel: (level: number) => void
  setExpression: (expression: Expression) => void
  setSpeaking: (speaking: boolean) => void
  updateSettings: (settings: Partial<AngelaSettings>) => void
  setError: (error: string | null) => void
  setExpanded: (expanded: boolean) => void
  setEnabled: (enabled: boolean) => void
  reset: () => void
}

export type AngelaStore = AngelaStoreState & AngelaStoreActions

export interface TranscriptResult {
  text: string
  duration_ms?: number
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OllamaRequest {
  model: string
  messages: OllamaMessage[]
  stream: boolean
}

export interface OllamaStreamChunk {
  model: string
  message: { role: string; content: string }
  done: boolean
}

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
}

export interface AngelaConfig {
  elevenlabs: {
    apiKey: string
    voiceId: string
  }
  picovoice: {
    accessKey: string
    wakeWordPath: string
  }
  whisper: {
    endpoint: string
  }
  ollama: {
    endpoint: string
    model: string
  }
}
