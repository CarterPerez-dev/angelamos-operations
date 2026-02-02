/**
 * Angela AI Assistant - Status Indicator Component
 */

import { AngelaState } from '../types'
import styles from './StatusIndicator.module.scss'

interface StatusIndicatorProps {
  status: AngelaState
  audioLevel: number
}

const STATUS_TEXT: Record<AngelaState, string> = {
  [AngelaState.IDLE]: 'Say "Angela"',
  [AngelaState.LISTENING]: 'Listening...',
  [AngelaState.PROCESSING]: 'Processing...',
  [AngelaState.THINKING]: 'Thinking...',
  [AngelaState.SPEAKING]: 'Speaking...',
  [AngelaState.ERROR]: 'Error',
}

export function StatusIndicator({ status, audioLevel }: StatusIndicatorProps): React.ReactElement {
  return (
    <div className={styles.container} data-status={status}>
      <div className={styles.indicator} data-status={status}>
        {status === AngelaState.LISTENING && (
          <div
            className={styles.audioLevel}
            style={{ transform: `scaleY(${0.3 + audioLevel * 0.7})` }}
          />
        )}
      </div>
      <span className={styles.text}>{STATUS_TEXT[status]}</span>
    </div>
  )
}
