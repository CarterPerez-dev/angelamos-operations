// ===================
// © AngelaMos | 2026
// tts.client.ts
// ===================

import { getAngelaConfig } from '../config'
import * as elevenlabs from './elevenlabs.client'
import * as edgetts from './edgetts.client'
import type { TTSProvider } from '../types'

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const config = getAngelaConfig()
  const provider = config.tts.provider

  if (provider === 'edgetts') {
    return edgetts.synthesizeSpeech(text)
  }

  return elevenlabs.synthesizeSpeech(text)
}

export async function checkTTSHealth(): Promise<{ provider: TTSProvider; healthy: boolean }> {
  const config = getAngelaConfig()
  const provider = config.tts.provider

  if (provider === 'edgetts') {
    const healthy = await edgetts.checkEdgeTTSHealth()
    return { provider, healthy }
  }

  const healthy = await elevenlabs.checkElevenLabsHealth()
  return { provider, healthy }
}

export async function getAvailableProvider(): Promise<TTSProvider | null> {
  const edgeTTSHealthy = await edgetts.checkEdgeTTSHealth()
  if (edgeTTSHealthy) return 'edgetts'

  const elevenLabsHealthy = await elevenlabs.checkElevenLabsHealth()
  if (elevenLabsHealthy) return 'elevenlabs'

  return null
}
