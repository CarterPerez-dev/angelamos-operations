// ===================
// © AngelaMos | 2026
// useWakeWord.ts
// ===================

import { useEffect, useRef, useCallback } from 'react'
import { createWakeWordEngine } from '../lib/wakeword'
import { AudioRecorder } from '../lib/audio'
import { logger } from '../lib/debug'

type WakeWordEngine = Awaited<ReturnType<typeof createWakeWordEngine>>

interface UseWakeWordResult {
  wakeWordRef: React.MutableRefObject<WakeWordEngine | null>
  recorderRef: React.MutableRefObject<AudioRecorder | null>
  setWakeWordCallback: (callback: () => void) => void
}

export function useWakeWord(
  onReady: () => void,
  onError: (error: Error) => void
): UseWakeWordResult {
  const wakeWordRef = useRef<WakeWordEngine | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const callbackRef = useRef<(() => void) | null>(null)

  const setWakeWordCallback = useCallback((callback: () => void) => {
    callbackRef.current = callback
    if (wakeWordRef.current) {
      wakeWordRef.current.onWakeWord = callback
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        recorderRef.current = new AudioRecorder()
        await recorderRef.current.initialize()
        logger.page.log('AudioRecorder ready')

        const wakeWord = await createWakeWordEngine()
        wakeWordRef.current = wakeWord

        if (callbackRef.current) {
          wakeWord.onWakeWord = callbackRef.current
        }

        await wakeWord.start()
        logger.page.log('Wake word listening')

        if (mounted) onReady()
      } catch (err) {
        logger.page.error('Init error:', err)
        if (mounted) {
          onError(err instanceof Error ? err : new Error('Init failed'))
        }
      }
    }

    init()

    return () => {
      mounted = false
      wakeWordRef.current?.dispose()
      recorderRef.current?.dispose()
    }
  }, [onReady, onError])

  return { wakeWordRef, recorderRef, setWakeWordCallback }
}
