// ===================
// © AngelaMos | 2026
// AngelaPage.tsx
// ===================

import { useCallback, useEffect, useState } from 'react'
import { StatusOverlay } from './components'
import { useThreeScene, useVoicePipeline, useWakeWord } from './hooks'
import type { AngelaStatus } from './types'

export function AngelaPage() {
  const [status, setStatus] = useState<AngelaStatus>('initializing')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const {
    canvasRef,
    animControllerRef,
    animManagerRef,
    analyserRef,
    dataArrayRef,
    isPlayingRef,
  } = useThreeScene()

  const handleReady = useCallback(() => setStatus('idle'), [])
  const handleInitError = useCallback((err: Error) => {
    setError(err.message)
    setStatus('error')
  }, [])

  const { wakeWordRef, recorderRef, setWakeWordCallback } = useWakeWord(
    handleReady,
    handleInitError
  )

  const { handleWakeWord, handleStop, handleMute } = useVoicePipeline({
    animControllerRef,
    animManagerRef,
    analyserRef,
    dataArrayRef,
    isPlayingRef,
    wakeWordRef,
    recorderRef,
    onStatusChange: setStatus,
    onTranscriptChange: setTranscript,
    onResponseChange: setResponse,
    onError: setError,
  })

  useEffect(() => {
    setWakeWordCallback(handleWakeWord)
  }, [setWakeWordCallback, handleWakeWord])

  const triggerManually = () => {
    if (status === 'idle') {
      handleWakeWord()
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.6 100%)',
        }}
      />
      <StatusOverlay
        status={status}
        transcript={transcript}
        response={response}
        error={error}
        onTrigger={triggerManually}
        onStop={handleStop}
        onMute={handleMute}
      />
    </div>
  )
}
