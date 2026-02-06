// ===================
// © AngelaMos | 2026
// edgetts.client.ts
// ===================

import { getAngelaConfig } from '../config'

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const config = getAngelaConfig()
  const response = await fetch(`${config.tts.endpoint}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(`Edge TTS error: ${response.status}`)
  }

  return response.arrayBuffer()
}

export async function checkEdgeTTSHealth(): Promise<boolean> {
  const config = getAngelaConfig()
  try {
    const response = await fetch(`${config.tts.endpoint}/health`)
    return response.ok
  } catch {
    return false
  }
}
