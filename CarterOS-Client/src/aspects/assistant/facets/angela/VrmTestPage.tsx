// ===================
// © AngelaMos | 2026
// VrmTestPage.tsx
// ===================

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AnimationController } from './lib/animation'
import { createWakeWordEngine } from './lib/porcupine'
import { AudioRecorder, SilenceDetector } from './lib/audio'
import { transcribeAudio } from './api/whisper.client'
import { streamChat } from './api/ollama.client'
import { synthesizeSpeech } from './api/elevenlabs.client'
import type { OllamaMessage } from './types'

type Status = 'initializing' | 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking' | 'error'

export function VrmTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vrmRef = useRef<VRM | null>(null)
  const animControllerRef = useRef<AnimationController | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const isPlayingRef = useRef(false)
  const wakeWordRef = useRef<ReturnType<typeof createWakeWordEngine> extends Promise<infer T> ? T : never>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)
  const messagesRef = useRef<OllamaMessage[]>([])
  const statusRef = useRef<Status>('initializing')

  const [status, setStatus] = useState<Status>('initializing')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')

  const updateStatus = (newStatus: Status) => {
    statusRef.current = newStatus
    setStatus(newStatus)

    if (animControllerRef.current) {
      if (newStatus === 'idle') {
        animControllerRef.current.setState('idle')
      } else if (newStatus === 'listening') {
        animControllerRef.current.setState('listening')
      } else if (newStatus === 'thinking' || newStatus === 'processing') {
        animControllerRef.current.setState('thinking')
      } else if (newStatus === 'speaking') {
        animControllerRef.current.setState('speaking')
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = window.innerWidth
    const height = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100)
    camera.position.set(0, 1.3, 2.0)

    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 1.3, 0)
    controls.enableDamping = true
    controls.update()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.4)
    backLight.position.set(-1, 0.5, -1)
    scene.add(backLight)

    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))

    loader.load('/vrm/angela.vrm', (gltf) => {
      const vrm = gltf.userData.vrm as VRM
      vrmRef.current = vrm

      vrm.scene.rotation.y = Math.PI
      scene.add(vrm.scene)

      animControllerRef.current = new AnimationController(vrm)
      animControllerRef.current.setState('idle')

      const head = vrm.humanoid?.getNormalizedBoneNode('head')
      if (head) {
        const headPos = new THREE.Vector3()
        head.getWorldPosition(headPos)
        camera.position.set(0, headPos.y, 1.8)
        controls.target.set(0, headPos.y - 0.1, 0)
        controls.update()
      }

      console.log('VRM loaded with AnimationController')
      console.log('Available expressions:', Object.keys(vrm.expressionManager?.expressionMap || {}))
    })

    const clock = new THREE.Clock()
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      controls.update()

      if (vrmRef.current) {
        vrmRef.current.update(delta)

        if (animControllerRef.current) {
          animControllerRef.current.update(delta)

          if (isPlayingRef.current && analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)
            let sum = 0
            const lowFreqEnd = Math.floor(dataArrayRef.current.length * 0.3)
            for (let i = 0; i < lowFreqEnd; i++) {
              sum += dataArrayRef.current[i]
            }
            const volume = sum / (lowFreqEnd * 255)
            const mouthOpen = Math.min(1, volume * 3)
            animControllerRef.current.setMouthOpen(mouthOpen)
          }
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      controls.dispose()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        recorderRef.current = new AudioRecorder()
        await recorderRef.current.initialize()
        console.log('AudioRecorder ready')

        const wakeWord = await createWakeWordEngine()
        wakeWordRef.current = wakeWord

        wakeWord.onWakeWord = () => {
          if (!mounted) return
          handleWakeWord()
        }

        await wakeWord.start()
        console.log('Wake word listening')

        if (mounted) updateStatus('idle')
      } catch (err) {
        console.error('Init error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Init failed')
          updateStatus('error')
        }
      }
    }

    init()

    return () => {
      mounted = false
      wakeWordRef.current?.dispose()
      recorderRef.current?.dispose()
    }
  }, [])

  const handleWakeWord = async () => {
    if (!recorderRef.current) return

    updateStatus('listening')
    setTranscript('')
    setResponse('')
    wakeWordRef.current?.stop()

    const silenceDetector = new SilenceDetector({
      silenceThreshold: 0.04,
      silenceDuration: 1200,
    })

    recorderRef.current.onAudioLevel = (level) => {
      silenceDetector.update(level)
      // Uncomment to debug silence detection:
      // if (Math.random() < 0.05) console.log('Audio level:', level.toFixed(3))
    }

    silenceDetector.onSilenceDetected = () => {
      recorderRef.current?.stop()
    }

    recorderRef.current.onComplete = async (audioBlob) => {
      await processAudio(audioBlob)
    }

    recorderRef.current.start()
  }

  const processAudio = async (audioBlob: Blob) => {
    updateStatus('processing')
    console.log('1. Processing audio blob, size:', audioBlob.size)

    try {
      console.log('2. Calling Whisper transcription...')
      const result = await transcribeAudio(audioBlob)
      console.log('3. Whisper result:', result)

      if (!result.text?.trim()) {
        console.log('3a. Empty transcription, returning to idle')
        updateStatus('idle')
        wakeWordRef.current?.start()
        return
      }

      setTranscript(result.text)
      messagesRef.current.push({ role: 'user', content: result.text })

      updateStatus('thinking')
      console.log('4. Calling Ollama with messages:', messagesRef.current)

      let fullResponse = ''
      for await (const chunk of streamChat(messagesRef.current)) {
        fullResponse += chunk
        setResponse(fullResponse)
      }
      console.log('5. Ollama response:', fullResponse.slice(0, 100) + '...')

      if (!fullResponse.trim()) {
        console.log('5a. Empty LLM response')
        updateStatus('idle')
        wakeWordRef.current?.start()
        return
      }

      messagesRef.current.push({ role: 'assistant', content: fullResponse })

      updateStatus('speaking')
      console.log('6. Calling ElevenLabs TTS...')

      const audioBuffer = await synthesizeSpeech(fullResponse)
      console.log('7. Got audio buffer, size:', audioBuffer.byteLength)

      await playAudioWithLipSync(audioBuffer)
      console.log('8. Playback complete')

      updateStatus('idle')
      wakeWordRef.current?.start()
    } catch (err) {
      console.error('Process error at step:', err)
      setError(err instanceof Error ? err.message : 'Processing failed')
      updateStatus('error')

      setTimeout(() => {
        updateStatus('idle')
        setError('')
        wakeWordRef.current?.start()
      }, 3000)
    }
  }

  const playAudioWithLipSync = async (audioBuffer: ArrayBuffer): Promise<void> => {
    audioContextRef.current = new AudioContext()
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 256
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

    const decoded = await audioContextRef.current.decodeAudioData(audioBuffer.slice(0))

    sourceRef.current = audioContextRef.current.createBufferSource()
    sourceRef.current.buffer = decoded
    sourceRef.current.connect(analyserRef.current)
    analyserRef.current.connect(audioContextRef.current.destination)

    isPlayingRef.current = true

    return new Promise((resolve) => {
      sourceRef.current!.onended = () => {
        isPlayingRef.current = false
        animControllerRef.current?.setMouthOpen(0)
        audioContextRef.current?.close()
        resolve()
      }
      sourceRef.current!.start(0)
    })
  }

  const triggerManually = () => {
    if (status === 'idle') {
      handleWakeWord()
    }
  }

  const statusColors: Record<Status, string> = {
    initializing: '#888',
    idle: '#4ade80',
    listening: '#22c55e',
    processing: '#f59e0b',
    thinking: '#8b5cf6',
    speaking: '#ec4899',
    error: '#ef4444',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.7)',
          padding: '16px',
          borderRadius: '8px',
          maxWidth: '400px',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: statusColors[status],
              marginRight: '8px',
            }}
          />
          <strong>{status.toUpperCase()}</strong>
          {status === 'idle' && <span style={{ marginLeft: '8px', opacity: 0.7 }}>Say "Angela"</span>}
        </div>

        {transcript && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>You:</div>
            <div>{transcript}</div>
          </div>
        )}

        {response && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ opacity: 0.7, fontSize: '12px' }}>Angela:</div>
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>{response}</div>
          </div>
        )}

        {error && <div style={{ color: '#ef4444' }}>{error}</div>}

        <button
          onClick={triggerManually}
          disabled={status !== 'idle'}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: status === 'idle' ? '#8b5cf6' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'idle' ? 'pointer' : 'not-allowed',
          }}
        >
          Trigger Manually
        </button>
      </div>
    </div>
  )
}
