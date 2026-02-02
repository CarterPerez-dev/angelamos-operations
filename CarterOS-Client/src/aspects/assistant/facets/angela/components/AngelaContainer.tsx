/**
 * Angela AI Assistant - Main Container Component
 */

import { useEffect, useCallback } from 'react'
import { useAngela } from '../hooks'
import { AngelaAvatar } from './AngelaAvatar'
import { StatusIndicator } from './StatusIndicator'
import { AngelaState } from '../types'
import styles from './AngelaContainer.module.scss'

export function AngelaContainer(): React.ReactElement | null {
  const angela = useAngela()

  useEffect(() => {
    angela.initialize()
    return angela.cleanup
  }, [])

  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement) => {
      angela.initializeViewer(canvas)
    },
    [angela.initializeViewer]
  )

  const handleClick = useCallback(() => {
    if (angela.status === AngelaState.IDLE) {
      angela.setExpanded(!angela.isExpanded)
    } else if (angela.status === AngelaState.SPEAKING) {
      angela.stopAndReset()
    }
  }, [angela])

  const handleDoubleClick = useCallback(() => {
    if (angela.status === AngelaState.IDLE) {
      angela.triggerManually()
    }
  }, [angela])

  if (!angela.isEnabled) {
    return null
  }

  return (
    <div
      className={styles.container}
      data-expanded={angela.isExpanded}
      data-status={angela.status}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className={styles.avatarWrapper}>
        <AngelaAvatar onCanvasReady={handleCanvasReady} />
      </div>

      <div className={styles.statusBar}>
        <StatusIndicator status={angela.status} audioLevel={angela.audioLevel} />
      </div>

      {angela.isExpanded && angela.transcript && (
        <div className={styles.transcript}>
          <span className={styles.label}>You:</span>
          <span className={styles.text}>{angela.transcript}</span>
        </div>
      )}

      {angela.isExpanded && angela.response && (
        <div className={styles.response}>
          <span className={styles.label}>Angela:</span>
          <span className={styles.text}>{angela.response}</span>
        </div>
      )}

      {angela.error && <div className={styles.error}>{angela.error}</div>}
    </div>
  )
}
