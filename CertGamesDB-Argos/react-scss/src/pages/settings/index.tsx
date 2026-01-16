// ===================
// AngelaMos | 2026
// settings/index.tsx
// ===================

import { useState } from 'react'
import { LuDatabase, LuActivity, LuSave } from 'react-icons/lu'
import { useProfilingStatus, useSetProfiling, useMetrics } from '@/api'
import styles from './settings.module.scss'

const PROFILING_LEVELS = [
  { value: 0, label: 'Off', description: 'No profiling' },
  { value: 1, label: 'Slow Only', description: 'Profile queries slower than threshold' },
  { value: 2, label: 'All', description: 'Profile all operations' },
]

export function Component(): React.ReactElement {
  const { data: profiling, isLoading: profilingLoading } = useProfilingStatus()
  const { data: metrics } = useMetrics()
  const setProfiling = useSetProfiling()

  const [level, setLevel] = useState<number | null>(null)
  const [slowMs, setSlowMs] = useState<string>('')

  const currentLevel = level ?? profiling?.level ?? 0
  const currentSlowMs = slowMs || String(profiling?.slow_ms ?? 100)

  const handleSave = () => {
    setProfiling.mutate({
      level: currentLevel,
      slow_ms: parseInt(currentSlowMs, 10) || 100,
    })
  }

  const hasChanges =
    (level !== null && level !== profiling?.level) ||
    (slowMs !== '' && parseInt(slowMs, 10) !== profiling?.slow_ms)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure MongoDB dashboard settings</p>
        </div>

        {metrics && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <LuDatabase className={styles.sectionIcon} />
              Database Info
            </h2>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Host</span>
                <span className={styles.infoValue}>{metrics.server.host}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Version</span>
                <span className={styles.infoValue}>MongoDB {metrics.server.version}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Database</span>
                <span className={styles.infoValue}>{metrics.database.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Collections</span>
                <span className={styles.infoValue}>{metrics.database.collections}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Documents</span>
                <span className={styles.infoValue}>{metrics.database.documents.toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <LuActivity className={styles.sectionIcon} />
            Query Profiling
          </h2>

          {profilingLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <div className={styles.profilingCard}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profiling Level</label>
                <div className={styles.levelOptions}>
                  {PROFILING_LEVELS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.levelBtn} ${currentLevel === opt.value ? styles.active : ''}`}
                      onClick={() => setLevel(opt.value)}
                    >
                      <span className={styles.levelValue}>{opt.value}</span>
                      <span className={styles.levelLabel}>{opt.label}</span>
                      <span className={styles.levelDesc}>{opt.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="slowMs">
                  Slow Query Threshold (ms)
                </label>
                <input
                  id="slowMs"
                  type="number"
                  className={styles.input}
                  value={currentSlowMs}
                  onChange={(e) => setSlowMs(e.target.value)}
                  min={0}
                  max={10000}
                  disabled={currentLevel === 0}
                />
                <span className={styles.hint}>
                  Queries taking longer than this will be logged
                </span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!hasChanges || setProfiling.isPending}
                >
                  <LuSave className={styles.btnIcon} />
                  {setProfiling.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

Component.displayName = 'Settings'
