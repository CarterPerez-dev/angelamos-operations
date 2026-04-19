// ===================
// © AngelaMos | 2026
// useThreeScene.ts
// ===================

import { type VRM, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getAngelaConfig } from '../config'
import { AnimationController, AnimationManager } from '../lib/animation'
import { logger } from '../lib/debug'

interface UseThreeSceneResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  vrmRef: React.MutableRefObject<VRM | null>
  animControllerRef: React.MutableRefObject<AnimationController | null>
  animManagerRef: React.MutableRefObject<AnimationManager | null>
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  dataArrayRef: React.MutableRefObject<Uint8Array | null>
  isPlayingRef: React.MutableRefObject<boolean>
}

export function useThreeScene(): UseThreeSceneResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const vrmRef = useRef<VRM | null>(null)
  const animControllerRef = useRef<AnimationController | null>(null)
  const animManagerRef = useRef<AnimationManager | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const config = getAngelaConfig()
    const width = window.innerWidth
    const height = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const bgColor = new THREE.Color(config.scene.backgroundColor)
    scene.background = bgColor
    scene.fog = new THREE.FogExp2(bgColor.getHex(), 0.1)

    const grid = new THREE.GridHelper(200, 200, 0xffffff, 0xffffff)
    grid.position.y = 0
    grid.material.opacity = 0.15
    grid.material.transparent = true
    scene.add(grid)

    const starCount = 50
    const starPositions = new Float32Array(starCount * 3)
    const starPhases = new Float32Array(starCount)
    const starSpeeds = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 30
      starPositions[i * 3 + 1] = Math.random() * 15 + 2
      starPositions[i * 3 + 2] = -Math.random() * 20 - 5
      starPhases[i] = Math.random() * Math.PI * 2
      starSpeeds[i] = 0.3 + Math.random() * 0.4
    }

    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    )

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float phase;
        attribute float speed;
        varying float vOpacity;
        uniform float uTime;
        void main() {
          vOpacity = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * speed + phase));
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })

    starGeometry.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1))
    starGeometry.setAttribute('speed', new THREE.BufferAttribute(starSpeeds, 1))

    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const camera = new THREE.PerspectiveCamera(
      config.scene.cameraFov,
      width / height,
      0.1,
      100
    )
    camera.position.set(...config.scene.cameraPosition)

    const controls = new OrbitControls(camera, canvas)
    controls.target.set(...config.scene.cameraTarget)
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

    loader.load(config.vrm.modelPath, (gltf) => {
      const vrm = gltf.userData.vrm as VRM
      vrmRef.current = vrm

      vrm.scene.rotation.y = Math.PI
      scene.add(vrm.scene)

      animControllerRef.current = new AnimationController(vrm)
      animControllerRef.current.setState('idle')

      animManagerRef.current = new AnimationManager(vrm)
      animManagerRef.current.loadAllAnimations()

      const head = vrm.humanoid?.getNormalizedBoneNode('head')
      if (head) {
        const headPos = new THREE.Vector3()
        head.getWorldPosition(headPos)
        camera.position.set(0, headPos.y, 1.8)
        controls.target.set(0, headPos.y - 0.1, 0)
        controls.update()
      }

      logger.page.log('VRM loaded')
      logger.page.log(
        'Expressions:',
        Object.keys(vrm.expressionManager?.expressionMap || {})
      )
    })

    const clock = new THREE.Clock()
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      starMaterial.uniforms.uTime.value = elapsed

      controls.update()

      if (vrmRef.current) {
        vrmRef.current.update(delta)

        if (animManagerRef.current) {
          animManagerRef.current.update(delta)
        }

        if (animControllerRef.current) {
          animControllerRef.current.update(delta)

          if (
            isPlayingRef.current &&
            analyserRef.current &&
            dataArrayRef.current
          ) {
            analyserRef.current.getByteFrequencyData(
              dataArrayRef.current as Uint8Array<ArrayBuffer>
            )
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
      if (animManagerRef.current) {
        animManagerRef.current.dispose()
      }
      renderer.dispose()
      controls.dispose()
    }
  }, [])

  return {
    canvasRef,
    vrmRef,
    animControllerRef,
    animManagerRef,
    analyserRef,
    dataArrayRef,
    isPlayingRef,
  }
}
