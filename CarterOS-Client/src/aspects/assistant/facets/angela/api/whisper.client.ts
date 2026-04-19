/**
 * Angela AI Assistant - Whisper STT Client
 */

import { getAngelaConfig } from '../config'
import type { TranscriptResult } from '../types'

export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptResult> {
  const config = getAngelaConfig()
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.wav')

  const response = await fetch(`${config.whisper.endpoint}/inference`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Whisper transcription failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    text: data.text?.trim() || '',
    duration_ms: data.duration_ms,
  }
}
