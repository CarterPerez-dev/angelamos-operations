// ===================
// AngelaMos | 2026
// slow-queries/index.tsx
// ===================

import { useState } from 'react'
import { LuClock, LuLightbulb, LuDatabase, LuCopy, LuCheck } from 'react-icons/lu'
import { useSlowQueries, useSlowQueryAnalysis, useProfilingStatus } from '@/api'
import styles from './slow-queries.module.scss'

function formatDate(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" className={styles.copyBtn} onClick={handleCopy}>
      {copied ? <LuCheck /> : <LuCopy />}
    </button>
  )
}

export function Component(): React.ReactElement {
  const [minMillis] = useState(100)
  const { data: report, isLoading: queriesLoading } = useSlowQueries(minMillis, 50)
  const { data: analysis, isLoading: analysisLoading } = useSlowQueryAnalysis(minMillis, 100)
  const { data: profiling } = useProfilingStatus()

  if (queriesLoading || analysisLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading slow queries...</div>
      </div>
    )
  }

  const queries = report?.queries ?? []
  const suggestions = analysis?.suggestions ?? []
  const topCollections = analysis?.top_collections ?? []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Slow Queries</h1>
          <p className={styles.subtitle}>
            {queries.length} queries over {report?.slow_ms_threshold ?? minMillis}ms
          </p>
        </div>
        {profiling && (
          <div className={styles.profilingBadge}>
            <span className={styles.profilingLabel}>Profiling Level</span>
            <span className={styles.profilingValue}>{profiling.level}</span>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <LuLightbulb className={styles.sectionIcon} />
            Index Suggestions
          </h2>
          <div className={styles.suggestions}>
            {suggestions.map((suggestion, i) => (
              <div key={i} className={styles.suggestionCard}>
                <div className={styles.suggestionHeader}>
                  <span className={styles.suggestionCollection}>{suggestion.collection}</span>
                  <span className={styles.occurrences}>{suggestion.occurrences} occurrences</span>
                </div>
                <p className={styles.reason}>{suggestion.reason}</p>
                <div className={styles.indexCommand}>
                  <code>
                    db.{suggestion.collection}.createIndex({'{'}{' '}
                    {suggestion.suggested_index.map((f) => `"${f}": 1`).join(', ')}{' '}
                    {'}'})
                  </code>
                  <CopyButton
                    text={`db.${suggestion.collection}.createIndex({ ${suggestion.suggested_index.map((f) => `"${f}": 1`).join(', ')} })`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topCollections.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <LuDatabase className={styles.sectionIcon} />
            Top Slow Collections
          </h2>
          <div className={styles.collectionsGrid}>
            {topCollections.map((col) => (
              <div key={col.namespace} className={styles.collectionCard}>
                <span className={styles.collectionName}>{col.namespace}</span>
                <div className={styles.collectionStats}>
                  <span>{col.count} queries</span>
                  <span>avg {col.avg_millis.toFixed(0)}ms</span>
                  <span>max {col.max_millis}ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <LuClock className={styles.sectionIcon} />
          Recent Slow Queries
        </h2>
        {queries.length === 0 ? (
          <div className={styles.empty}>
            <p>No slow queries found</p>
            <span>Queries taking longer than {report?.slow_ms_threshold ?? minMillis}ms will appear here</span>
          </div>
        ) : (
          <div className={styles.queriesTable}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Operation</th>
                  <th>Namespace</th>
                  <th>Duration</th>
                  <th>Docs Examined</th>
                  <th>Plan</th>
                </tr>
              </thead>
              <tbody>
                {queries.map((query, i) => (
                  <tr key={i}>
                    <td className={styles.time}>{formatDate(query.timestamp)}</td>
                    <td className={styles.op}>{query.op}</td>
                    <td className={styles.namespace}>{query.namespace}</td>
                    <td className={styles.duration}>{query.millis}ms</td>
                    <td className={styles.docs}>{query.docs_examined.toLocaleString()}</td>
                    <td className={styles.plan}>{query.plan_summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

Component.displayName = 'SlowQueries'
