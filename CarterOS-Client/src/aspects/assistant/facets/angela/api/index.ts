// ===================
// © AngelaMos | 2026
// index.ts
// ===================

export { checkEdgeTTSHealth } from './edgetts.client'
export { checkElevenLabsHealth, getVoices } from './elevenlabs.client'
export * from './ollama.client'
export {
  checkTTSHealth,
  getAvailableProvider,
  synthesizeSpeech,
} from './tts.client'
export * from './whisper.client'
