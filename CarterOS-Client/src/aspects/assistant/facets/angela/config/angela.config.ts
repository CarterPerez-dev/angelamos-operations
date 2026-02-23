// ===================
// © AngelaMos | 2026
// config.ts
// ===================

import type { AngelaConfig, AngelaSettings, TTSProvider } from '../types'

const STORAGE_KEY = 'angela-settings'


export const ANGELA_SYSTEM_PROMPT = `You are Angela - elite, competent, direct. You give answers with precision and confidence.
But beneath the surface, you understand complexity, internal battles, and hard truths. You don't sugarcoat reality.
You help people achieve their best, while acknowledging that "best" means accepting nothing less than actual maximum effort.`

export const DEFAULT_SETTINGS: AngelaSettings = {
  voiceId: '',
  modelName: 'qwen2.5:7b',
  wakeWordSensitivity: 0.5,
  silenceThreshold: 0.08,
  silenceDuration: 850,
}

export const getAngelaConfig = (): AngelaConfig => ({
  debug: import.meta.env.VITE_ANGELA_DEBUG === 'true',

  vrm: {
    modelPath: '/vrm/angela.vrm',
  },

  tts: {
    provider: (import.meta.env.VITE_TTS_PROVIDER as TTSProvider) || 'edgetts',
    endpoint: import.meta.env.VITE_TTS_ENDPOINT || 'http://localhost:5002',
  },

  elevenlabs: {
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
    voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || '',
    stability: 0.5,
    similarityBoost: 0.75,
  },

  wakeWord: {
    endpoint: import.meta.env.VITE_WAKEWORD_ENDPOINT || 'ws://localhost:5003/ws',
    threshold: 0.5,
  },

  whisper: {
    endpoint: import.meta.env.VITE_WHISPER_ENDPOINT || 'http://localhost:8089',
  },

  ollama: {
    endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5:7b',
    temperature: 0.7,
    maxTokens: 2048,
  },

  audio: {
    sampleRate: 16000,
    silenceThreshold: 0.08,
    silenceDuration: 850,
    minSpeechDuration: 500,
  },

  animation: {
    blinkMinInterval: 3,
    blinkMaxInterval: 5,
  },

  scene: {
    backgroundColor: 0x080808,
    cameraFov: 99,
    cameraPosition: [0, 1.3, 2.0],
    cameraTarget: [0, 1.3, 0],
  },
})

export const saveApiKey = (key: 'elevenlabs', value: string): void => {
  localStorage.setItem(`angela_${key}_key`, value)
}

export const saveVoiceId = (voiceId: string): void => {
  localStorage.setItem('angela_voice_id', voiceId)
}

export const saveModel = (model: string): void => {
  localStorage.setItem('angela_model', model)
}

export const loadSettings = (): AngelaSettings => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  }
  return DEFAULT_SETTINGS
}

export const saveSettings = (settings: Partial<AngelaSettings>): void => {
  const current = loadSettings()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }))
}
