// ===================
// © AngelaMos | 2026
// angela.types.ts
// ===================
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

export type TTSProvider = 'elevenlabs' | 'edgetts'

export type AngelaStatus = 'initializing' | 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking' | 'error'

export interface AngelaConfig {
  debug: boolean
  vrm: {
    modelPath: string
  }
  tts: {
    provider: TTSProvider
    endpoint: string
  }
  elevenlabs: {
    apiKey: string
    voiceId: string
    stability: number
    similarityBoost: number
  }
  porcupine: {
    accessKey: string
    keywordPath: string
    modelPath: string
    sensitivity: number
  }
  whisper: {
    endpoint: string
  }
  ollama: {
    endpoint: string
    model: string
    temperature: number
    maxTokens: number
  }
  audio: {
    sampleRate: number
    silenceThreshold: number
    silenceDuration: number
    minSpeechDuration: number
  }
  animation: {
    blinkMinInterval: number
    blinkMaxInterval: number
  }
  scene: {
    backgroundColor: number
    cameraFov: number
    cameraPosition: [number, number, number]
    cameraTarget: [number, number, number]
  }
}
