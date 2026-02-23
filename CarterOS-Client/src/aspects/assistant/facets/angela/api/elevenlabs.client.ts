/**
 * Angela AI Assistant - ElevenLabs TTS Client
 */

import { getAngelaConfig } from '../config'
import type { ElevenLabsVoice } from '../types'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export async function synthesizeSpeech(text: string, voiceId?: string): Promise<ArrayBuffer> {
  const config = getAngelaConfig()
  const voice = voiceId || config.elevenlabs.voiceId

  if (!config.elevenlabs.apiKey) {
    throw new Error('ElevenLabs API key not configured')
  }

  if (!voice) {
    throw new Error('No voice ID configured')
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': config.elevenlabs.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: config.elevenlabs.stability,
        similarity_boost: config.elevenlabs.similarityBoost,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs TTS failed: ${response.status} - ${error}`)
  }

  return response.arrayBuffer()
}

export async function getVoices(): Promise<ElevenLabsVoice[]> {
  const config = getAngelaConfig()

  if (!config.elevenlabs.apiKey) {
    throw new Error('ElevenLabs API key not configured')
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    method: 'GET',
    headers: {
      'xi-api-key': config.elevenlabs.apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`)
  }

  const data = await response.json()
  return data.voices.map((v: { voice_id: string; name: string; category: string }) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
  }))
}

export async function checkElevenLabsHealth(): Promise<boolean> {
  const config = getAngelaConfig()
  if (!config.elevenlabs.apiKey) {
    return false
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
      method: 'GET',
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
