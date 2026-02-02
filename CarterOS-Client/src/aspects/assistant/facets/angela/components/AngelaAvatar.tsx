/**
 * Angela AI Assistant - Avatar Component
 */

import { useCallback, useRef, useEffect } from 'react'
import styles from './AngelaAvatar.module.scss'

interface AngelaAvatarProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void
}

export function AngelaAvatar({ onCanvasReady }: AngelaAvatarProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (canvasRef.current && !isInitialized.current) {
      isInitialized.current = true
      onCanvasReady(canvasRef.current)
    }
  }, [onCanvasReady])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
