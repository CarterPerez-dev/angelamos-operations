// ===================
// © AngelaMos | 2026
// StatusOverlay.tsx
// ===================

import { useState } from 'react'
import type { AngelaStatus } from '../../types'
import styles from './StatusOverlay.module.scss'

interface StatusOverlayProps {
  status: AngelaStatus
  transcript: string
  response: string
  error: string
  onTrigger: () => void
  onStop: () => void
  onMute: () => void
}

const STATUS_LABELS: Record<AngelaStatus, string> = {
  initializing: 'Starting...',
  idle: 'Ready',
  listening: 'Listening',
  processing: 'Processing',
  thinking: 'Thinking',
  speaking: 'Speaking',
  error: 'Error',
}

export function StatusOverlay({
  status,
  transcript,
  response,
  error,
  onTrigger,
  onStop,
  onMute,
}: StatusOverlayProps) {
  const [minimized, setMinimized] = useState(false)
  const [hidden, setHidden] = useState(false)

  if (hidden) {
    return (
      <button
        type="button"
        className={styles.showButton}
        onClick={() => setHidden(false)}
        title="Show Angela status"
      >
        <span className={styles.showDot} />
      </button>
    )
  }

  const isActive =
    status === 'listening' ||
    status === 'processing' ||
    status === 'thinking' ||
    status === 'speaking'
  const canTrigger = status === 'idle'

  return (
    <div className={`${styles.overlay} ${minimized ? styles.minimized : ''}`}>
      <div className={styles.header}>
        <button
          type="button"
          className={`${styles.statusButton} ${canTrigger ? styles.clickable : ''}`}
          onClick={canTrigger ? onTrigger : undefined}
          disabled={!canTrigger}
          title={canTrigger ? 'Click to activate' : undefined}
        >
          <span
            className={`${styles.statusDot} ${styles[status]} ${isActive ? styles.pulse : ''}`}
          />
          <span className={styles.statusLabel}>{STATUS_LABELS[status]}</span>
        </button>

        <div className={styles.controls}>
          {status === 'speaking' && (
            <button
              type="button"
              className={`${styles.controlButton} ${styles.muteButton}`}
              onClick={onMute}
              title="Mute (skip audio)"
            >
              🔇
            </button>
          )}
          {isActive && (
            <button
              type="button"
              className={`${styles.controlButton} ${styles.stopButton}`}
              onClick={onStop}
              title="Stop everything"
            >
              ■
            </button>
          )}
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setMinimized(!minimized)}
            title={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? '+' : '−'}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            onClick={() => setHidden(true)}
            title="Hide"
          >
            ×
          </button>
        </div>
      </div>

      {!minimized && (
        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}

          {transcript && (
            <div className={styles.message}>
              <span className={styles.messageLabel}>You</span>
              <p className={styles.messageText}>{transcript}</p>
            </div>
          )}

          {(status === 'thinking' || status === 'processing') && !response && (
            <div className={styles.message}>
              <span className={styles.messageLabel}>Angela</span>
              <div className={styles.thinking}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {response && (
            <div className={styles.message}>
              <span className={styles.messageLabel}>Angela</span>
              <p className={styles.messageText}>{response}</p>
            </div>
          )}

          {status === 'idle' && !transcript && !response && (
            <p className={styles.hint}>
              Say "Angela" or click the status to begin
            </p>
          )}
        </div>
      )}
    </div>
  )
}
