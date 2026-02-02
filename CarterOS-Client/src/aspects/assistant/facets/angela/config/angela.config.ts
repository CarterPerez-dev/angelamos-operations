/**
 * Angela AI Assistant - Configuration
 */

import type { AngelaConfig, AngelaSettings } from '../types'

const STORAGE_KEY = 'angela-settings'

export const DEFAULT_SETTINGS: AngelaSettings = {
  voiceId: '',
  modelName: 'qwen2.5:7b',
  wakeWordSensitivity: 0.5,
  silenceThreshold: 0.02,
  silenceDuration: 1500,
}

export const getAngelaConfig = (): AngelaConfig => ({
  elevenlabs: {
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
    voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID || '',
  },
  picovoice: {
    accessKey: import.meta.env.VITE_PICOVOICE_ACCESS_KEY || '',
    wakeWordPath: '/porcupine/angela_en_wasm_v4_0_0.ppn',
  },
  whisper: {
    endpoint: import.meta.env.VITE_WHISPER_ENDPOINT || 'http://localhost:8089',
  },
  ollama: {
    endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5:7b',
  },
})

export const saveApiKey = (key: 'elevenlabs' | 'picovoice', value: string): void => {
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

export const ANGELA_SYSTEM_PROMPT = `You are Angela - elite, competent, direct. You give answers with precision and confidence.
But beneath the surface, you understand complexity, internal battles, and hard truths. You don't sugarcoat reality.
You help people achieve their best, while acknowledging that "best" means accepting nothing less than actual maximum effort.`
