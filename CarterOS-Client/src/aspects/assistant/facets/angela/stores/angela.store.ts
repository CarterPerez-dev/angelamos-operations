/**
 * Angela AI Assistant - Zustand Store
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AngelaState, Expression } from '../types/angela.enums'
import type { AngelaStore, AngelaSettings, ChatMessage } from '../types/angela.types'
import { DEFAULT_SETTINGS } from '../config/angela.config'

const STORAGE_KEY = 'angela-store'

export const useAngelaStore = create<AngelaStore>()(
  devtools(
    persist(
      (set) => ({
        status: AngelaState.IDLE,
        transcript: null,
        response: null,
        error: null,
        messages: [],
        isRecording: false,
        audioLevel: 0,
        currentExpression: Expression.NEUTRAL,
        isSpeaking: false,
        settings: DEFAULT_SETTINGS,
        isExpanded: false,
        isEnabled: true,

        transitionTo: (status) =>
          set({ status }, false, 'angela/transitionTo'),

        setTranscript: (transcript) =>
          set({ transcript }, false, 'angela/setTranscript'),

        setResponse: (response) =>
          set({ response }, false, 'angela/setResponse'),

        addMessage: (message: ChatMessage) =>
          set(
            (state) => ({ messages: [...state.messages, message] }),
            false,
            'angela/addMessage'
          ),

        clearConversation: () =>
          set({ messages: [], transcript: null, response: null }, false, 'angela/clearConversation'),

        setRecording: (isRecording) =>
          set({ isRecording }, false, 'angela/setRecording'),

        setAudioLevel: (audioLevel) =>
          set({ audioLevel }, false, 'angela/setAudioLevel'),

        setExpression: (currentExpression) =>
          set({ currentExpression }, false, 'angela/setExpression'),

        setSpeaking: (isSpeaking) =>
          set({ isSpeaking }, false, 'angela/setSpeaking'),

        updateSettings: (settings: Partial<AngelaSettings>) =>
          set(
            (state) => ({ settings: { ...state.settings, ...settings } }),
            false,
            'angela/updateSettings'
          ),

        setError: (error) =>
          set({ error, status: error ? AngelaState.ERROR : AngelaState.IDLE }, false, 'angela/setError'),

        setExpanded: (isExpanded) =>
          set({ isExpanded }, false, 'angela/setExpanded'),

        setEnabled: (isEnabled) =>
          set({ isEnabled }, false, 'angela/setEnabled'),

        reset: () =>
          set(
            {
              status: AngelaState.IDLE,
              transcript: null,
              response: null,
              error: null,
              isRecording: false,
              audioLevel: 0,
              currentExpression: Expression.NEUTRAL,
              isSpeaking: false,
            },
            false,
            'angela/reset'
          ),
      }),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          settings: state.settings,
          isEnabled: state.isEnabled,
          messages: state.messages.slice(-20),
        }),
      }
    ),
    { name: 'AngelaStore' }
  )
)

export const useAngelaStatus = () => useAngelaStore((s) => s.status)
export const useAngelaTranscript = () => useAngelaStore((s) => s.transcript)
export const useAngelaResponse = () => useAngelaStore((s) => s.response)
export const useAngelaError = () => useAngelaStore((s) => s.error)
export const useAngelaMessages = () => useAngelaStore((s) => s.messages)
export const useAngelaIsRecording = () => useAngelaStore((s) => s.isRecording)
export const useAngelaAudioLevel = () => useAngelaStore((s) => s.audioLevel)
export const useAngelaExpression = () => useAngelaStore((s) => s.currentExpression)
export const useAngelaIsSpeaking = () => useAngelaStore((s) => s.isSpeaking)
export const useAngelaSettings = () => useAngelaStore((s) => s.settings)
export const useAngelaIsExpanded = () => useAngelaStore((s) => s.isExpanded)
export const useAngelaIsEnabled = () => useAngelaStore((s) => s.isEnabled)
