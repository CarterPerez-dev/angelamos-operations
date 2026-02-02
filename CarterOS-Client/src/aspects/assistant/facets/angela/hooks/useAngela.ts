/**
 * Angela AI Assistant - Main Orchestration Hook
 */

import { useCallback, useEffect, useRef } from 'react'
import { useAngelaStore } from '../stores'
import { AngelaState, Expression } from '../types'
import { AudioRecorder, SilenceDetector } from '../lib/audio'
import { VrmViewer } from '../lib/vrm'
import { createWakeWordEngine, type WakeWordEngine, type MockWakeWordEngine } from '../lib/porcupine'
import { transcribeAudio } from '../api/whisper.client'
import { streamChat } from '../api/ollama.client'
import { synthesizeSpeech } from '../api/elevenlabs.client'
import type { OllamaMessage } from '../types'

export function useAngela() {
  const store = useAngelaStore()
  const viewerRef = useRef<VrmViewer | null>(null)
  const wakeWordRef = useRef<WakeWordEngine | MockWakeWordEngine | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const silenceDetectorRef = useRef<SilenceDetector | null>(null)
  const isInitializedRef = useRef(false)

  const handleWakeWord = useCallback(async () => {
    if (store.status !== AngelaState.IDLE) return
    if (!recorderRef.current) {
      console.error('AudioRecorder not ready')
      return
    }

    store.transitionTo(AngelaState.LISTENING)
    store.setExpression(Expression.HAPPY)

    wakeWordRef.current?.stop()

    silenceDetectorRef.current = new SilenceDetector({
      silenceThreshold: store.settings.silenceThreshold,
      silenceDuration: store.settings.silenceDuration,
    })

    recorderRef.current.onAudioLevel = (level) => {
      store.setAudioLevel(level)
      silenceDetectorRef.current?.update(level)
    }

    silenceDetectorRef.current.onSilenceDetected = () => {
      recorderRef.current?.stop()
    }

    recorderRef.current.onComplete = async (audioBlob) => {
      await processAudio(audioBlob)
    }

    recorderRef.current.start()
    store.setRecording(true)
  }, [store])

  const processAudio = useCallback(async (audioBlob: Blob) => {
    store.setRecording(false)
    store.transitionTo(AngelaState.PROCESSING)

    try {
      const result = await transcribeAudio(audioBlob)
      if (!result.text || result.text.trim().length === 0) {
        store.transitionTo(AngelaState.IDLE)
        wakeWordRef.current?.start()
        return
      }

      store.setTranscript(result.text)
      store.addMessage({ role: 'user', content: result.text, timestamp: Date.now() })

      store.transitionTo(AngelaState.THINKING)
      store.setExpression(Expression.NEUTRAL)

      const messages: OllamaMessage[] = store.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      let fullResponse = ''
      for await (const chunk of streamChat(messages)) {
        fullResponse += chunk
        store.setResponse(fullResponse)
      }

      store.addMessage({ role: 'assistant', content: fullResponse, timestamp: Date.now() })

      store.transitionTo(AngelaState.SPEAKING)
      store.setExpression(Expression.HAPPY)
      store.setSpeaking(true)

      const audioBuffer = await synthesizeSpeech(fullResponse)
      await viewerRef.current?.speak(audioBuffer)

      store.setSpeaking(false)
      store.setExpression(Expression.NEUTRAL)
      store.transitionTo(AngelaState.IDLE)

      wakeWordRef.current?.start()
    } catch (error) {
      console.error('Error processing audio:', error)
      store.setError(error instanceof Error ? error.message : 'Unknown error')
      store.setExpression(Expression.SAD)

      setTimeout(() => {
        store.reset()
        wakeWordRef.current?.start()
      }, 3000)
    }
  }, [store])

  const initializeViewer = useCallback((canvas: HTMLCanvasElement) => {
    if (viewerRef.current) return

    viewerRef.current = new VrmViewer(canvas)

    viewerRef.current.loadModel('/vrm/angela.vrm').catch((error) => {
      console.error('Failed to load VRM model:', error)
    })
  }, [])

  const initialize = useCallback(async () => {
    if (isInitializedRef.current || !store.isEnabled) return
    isInitializedRef.current = true

    try {
      recorderRef.current = new AudioRecorder()
      await recorderRef.current.initialize()
      console.log('AudioRecorder initialized')

      wakeWordRef.current = await createWakeWordEngine()
      wakeWordRef.current.onWakeWord = handleWakeWord
      await wakeWordRef.current.start()

      store.transitionTo(AngelaState.IDLE)
    } catch (error) {
      console.error('Failed to initialize Angela:', error)
      store.setError('Failed to initialize')
    }
  }, [store, handleWakeWord])

  const cleanup = useCallback(() => {
    wakeWordRef.current?.dispose()
    recorderRef.current?.dispose()
    viewerRef.current?.dispose()

    wakeWordRef.current = null
    recorderRef.current = null
    viewerRef.current = null
    isInitializedRef.current = false
  }, [])

  const stopAndReset = useCallback(() => {
    recorderRef.current?.stop()
    viewerRef.current?.stopSpeaking()
    store.reset()
    wakeWordRef.current?.start()
  }, [store])

  const triggerManually = useCallback(() => {
    handleWakeWord()
  }, [handleWakeWord])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    status: store.status,
    transcript: store.transcript,
    response: store.response,
    error: store.error,
    audioLevel: store.audioLevel,
    isRecording: store.isRecording,
    isSpeaking: store.isSpeaking,
    isExpanded: store.isExpanded,
    isEnabled: store.isEnabled,
    initialize,
    cleanup,
    initializeViewer,
    stopAndReset,
    triggerManually,
    setExpanded: store.setExpanded,
    setEnabled: store.setEnabled,
  }
}
