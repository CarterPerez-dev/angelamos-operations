// ===================
// © AngelaMos | 2026
// useVoicePipeline.ts
// ===================

import { useCallback, useRef } from 'react'
import { streamChat } from '../api/ollama.client'
import { synthesizeSpeech } from '../api/tts.client'
import { transcribeAudio } from '../api/whisper.client'
import { getAngelaConfig } from '../config'
import type { AnimationController, AnimationManager } from '../lib/animation'
import { type AudioRecorder, SilenceDetector } from '../lib/audio'
import { logger } from '../lib/debug'
import type { AngelaStatus, OllamaMessage } from '../types'

type WakeWordEngine = {
  start: () => Promise<void>
  stop: () => void
  dispose: () => Promise<void>
  onWakeWord?: (() => void) | null
}

interface UseVoicePipelineProps {
  animControllerRef: React.MutableRefObject<AnimationController | null>
  animManagerRef: React.MutableRefObject<AnimationManager | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  dataArrayRef: React.MutableRefObject<Uint8Array | null>
  isPlayingRef: React.MutableRefObject<boolean>
  wakeWordRef: React.MutableRefObject<WakeWordEngine | null>
  recorderRef: React.MutableRefObject<AudioRecorder | null>
  onStatusChange: (status: AngelaStatus) => void
  onTranscriptChange: (transcript: string) => void
  onResponseChange: (response: string) => void
  onError: (error: string) => void
}

export function useVoicePipeline({
  animControllerRef,
  animManagerRef,
  analyserRef,
  dataArrayRef,
  isPlayingRef,
  wakeWordRef,
  recorderRef,
  onStatusChange,
  onTranscriptChange,
  onResponseChange,
  onError,
}: UseVoicePipelineProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const messagesRef = useRef<OllamaMessage[]>([])
  const statusRef = useRef<AngelaStatus>('initializing')
  const abortControllerRef = useRef<AbortController | null>(null)

  const updateStatus = useCallback(
    (newStatus: AngelaStatus) => {
      statusRef.current = newStatus
      onStatusChange(newStatus)

      const state = newStatus === 'processing' ? 'thinking' : newStatus

      if (animControllerRef.current) {
        animControllerRef.current.setState(
          state as 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
        )
      }

      if (animManagerRef.current) {
        animManagerRef.current.setState(
          state as 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
        )
      }
    },
    [animControllerRef, animManagerRef, onStatusChange]
  )

  const playAudioWithLipSync = useCallback(
    async (audioBuffer: ArrayBuffer): Promise<void> => {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

      const decoded = await audioContextRef.current.decodeAudioData(
        audioBuffer.slice(0)
      )

      sourceRef.current = audioContextRef.current.createBufferSource()
      sourceRef.current.buffer = decoded
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)

      isPlayingRef.current = true

      return new Promise<void>((resolve) => {
        const source = sourceRef.current
        if (!source) {
          resolve()
          return
        }
        source.onended = () => {
          isPlayingRef.current = false
          animControllerRef.current?.setMouthOpen(0)
          audioContextRef.current?.close()
          resolve()
        }
        source.start(0)
      })
    },
    [analyserRef, dataArrayRef, isPlayingRef, animControllerRef]
  )

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      updateStatus('processing')

      try {
        logger.pipeline.log('Transcribing...')
        const result = await transcribeAudio(audioBlob)
        logger.pipeline.log('Transcription:', result.text)

        if (!result.text?.trim()) {
          logger.pipeline.log('Empty transcription')
          updateStatus('idle')
          wakeWordRef.current?.start()
          return
        }

        onTranscriptChange(result.text)
        messagesRef.current.push({ role: 'user', content: result.text })

        updateStatus('thinking')
        logger.pipeline.log('Calling LLM...')

        abortControllerRef.current = new AbortController()

        let fullResponse = ''
        try {
          for await (const chunk of streamChat(
            messagesRef.current,
            abortControllerRef.current.signal
          )) {
            fullResponse += chunk
            onResponseChange(fullResponse)
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            logger.pipeline.log('LLM generation aborted')
            return
          }
          throw err
        }
        logger.pipeline.log('LLM response:', `${fullResponse.slice(0, 50)}...`)

        if (!fullResponse.trim()) {
          logger.pipeline.log('Empty LLM response')
          updateStatus('idle')
          wakeWordRef.current?.start()
          return
        }

        messagesRef.current.push({ role: 'assistant', content: fullResponse })

        updateStatus('speaking')
        logger.pipeline.log('Synthesizing speech...')

        const audioBuffer = await synthesizeSpeech(fullResponse)
        logger.pipeline.log('Audio buffer:', audioBuffer.byteLength)

        await playAudioWithLipSync(audioBuffer)
        logger.pipeline.log('Playback complete')

        updateStatus('idle')
        wakeWordRef.current?.start()
      } catch (err) {
        logger.pipeline.error('Error:', err)
        onError(err instanceof Error ? err.message : 'Processing failed')
        updateStatus('error')

        setTimeout(() => {
          updateStatus('idle')
          onError('')
          wakeWordRef.current?.start()
        }, 3000)
      }
    },
    [
      updateStatus,
      wakeWordRef,
      onTranscriptChange,
      onResponseChange,
      onError,
      playAudioWithLipSync,
    ]
  )

  const handleWakeWord = useCallback(async () => {
    if (!recorderRef.current) return

    const config = getAngelaConfig()

    logger.pipeline.log('Wake word triggered')
    updateStatus('listening')
    onTranscriptChange('')
    onResponseChange('')
    wakeWordRef.current?.stop()

    const silenceDetector = new SilenceDetector({
      silenceThreshold: config.audio.silenceThreshold,
      silenceDuration: config.audio.silenceDuration,
      minSpeechDuration: config.audio.minSpeechDuration,
    })

    recorderRef.current.onAudioLevel = (level) => {
      silenceDetector.update(level)
    }

    silenceDetector.onSilenceDetected = () => {
      logger.pipeline.log('Silence detected')
      recorderRef.current?.stop()
    }

    recorderRef.current.onComplete = async (audioBlob) => {
      logger.pipeline.log('Recording complete, size:', audioBlob.size)
      await processAudio(audioBlob)
    }

    logger.pipeline.log('Starting recorder')
    recorderRef.current.start()
  }, [
    recorderRef,
    wakeWordRef,
    updateStatus,
    onTranscriptChange,
    onResponseChange,
    processAudio,
  ])

  const stopAudio = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
      } catch {}
      sourceRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    isPlayingRef.current = false
    animControllerRef.current?.setMouthOpen(0)
  }, [isPlayingRef, animControllerRef])

  const handleMute = useCallback(() => {
    logger.pipeline.log('Mute requested')
    stopAudio()
  }, [stopAudio])

  const handleStop = useCallback(() => {
    logger.pipeline.log('Stop requested')

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    stopAudio()
    recorderRef.current?.stop()

    updateStatus('idle')
    wakeWordRef.current?.start()
  }, [stopAudio, recorderRef, updateStatus, wakeWordRef])

  return {
    handleWakeWord,
    handleStop,
    handleMute,
    statusRef,
  }
}
