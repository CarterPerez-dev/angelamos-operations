// ===================
// © AngelaMos | 2025
// portCheckerCard.tsx
// ===================

import { useState } from 'react'
import { HiOutlineSearch } from 'react-icons/hi'
import { useCheckPort } from '../hooks'
import styles from './portCheckerCard.module.scss'

export function PortCheckerCard() {
  const [inputValue, setInputValue] = useState('')
  const [portToCheck, setPortToCheck] = useState<number | null>(null)

  const { data: portCheck, isLoading, error } = useCheckPort(portToCheck)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const port = parseInt(inputValue, 10)
    if (port > 0 && port <= 65535) {
      setPortToCheck(port)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Port Checker</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Port..."
          min={1}
          max={65535}
          className={styles.input}
        />
        <button type="submit" className={styles.btn} disabled={isLoading}>
          <HiOutlineSearch />
        </button>
      </form>

      {isLoading && <div className={styles.status}>Checking...</div>}

      {error && <div className={styles.error}>Error checking port</div>}

      {portCheck && !isLoading && (
        <div className={styles.result}>
          <div className={styles.portRow}>
            <span className={styles.portLabel}>Port {portCheck.port}</span>
            <span
              className={portCheck.available ? styles.available : styles.inUse}
            >
              {portCheck.available ? 'Available' : 'In Use'}
            </span>
          </div>
          {!portCheck.available && portCheck.process && (
            <div className={styles.processInfo}>
              <span className={styles.processLabel}>Process:</span>
              <span className={styles.processValue}>{portCheck.process}</span>
              {portCheck.pid && (
                <>
                  <span className={styles.processLabel}>PID:</span>
                  <span className={styles.processValue}>{portCheck.pid}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
