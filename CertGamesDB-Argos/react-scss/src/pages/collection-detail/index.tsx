// ===================
// AngelaMos | 2026
// collection-detail/index.tsx
// ===================

import { useParams } from 'react-router-dom'
import { LuDatabase, LuKey, LuFileJson, LuLayers } from 'react-icons/lu'
import {
  useCollectionStats,
  useCollectionSchema,
  useCollectionIndexes,
  useCollectionDocuments,
} from '@/api'
import styles from './collection-detail.module.scss'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}): React.ReactElement {
  return (
    <div className={styles.statCard}>
      <Icon className={styles.statIcon} />
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  )
}

export function Component(): React.ReactElement {
  const { name } = useParams<{ name: string }>()
  const collectionName = name ?? ''

  const { data: stats, isLoading: statsLoading } = useCollectionStats(collectionName)
  const { data: schema, isLoading: schemaLoading } = useCollectionSchema(collectionName)
  const { data: indexes } = useCollectionIndexes(collectionName)
  const { data: documents } = useCollectionDocuments(collectionName, 5)

  if (statsLoading || schemaLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading collection...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <LuDatabase className={styles.headerIcon} />
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{collectionName}</h1>
          <p className={styles.subtitle}>{stats?.namespace}</p>
        </div>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <StatCard
            icon={LuFileJson}
            label="Documents"
            value={stats.count.toLocaleString()}
          />
          <StatCard
            icon={LuLayers}
            label="Data Size"
            value={formatBytes(stats.size)}
          />
          <StatCard
            icon={LuLayers}
            label="Storage"
            value={formatBytes(stats.storage_size)}
          />
          <StatCard
            icon={LuKey}
            label="Index Size"
            value={formatBytes(stats.total_index_size)}
          />
        </div>
      )}

      <div className={styles.sections}>
        {schema && schema.fields.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Schema ({schema.sample_size} sampled)</h2>
            <div className={styles.schemaTable}>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Types</th>
                    <th>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.fields.map((field) => (
                    <tr key={field.name}>
                      <td className={styles.fieldName}>{field.name}</td>
                      <td className={styles.fieldTypes}>
                        {field.types.map((t) => (
                          <span key={t} className={styles.typeBadge}>{t}</span>
                        ))}
                      </td>
                      <td className={styles.coverage}>{(field.coverage * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {indexes && indexes.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Indexes ({indexes.length})</h2>
            <div className={styles.indexList}>
              {indexes.map((index) => (
                <div key={index.name} className={styles.indexCard}>
                  <div className={styles.indexHeader}>
                    <span className={styles.indexName}>{index.name}</span>
                    <div className={styles.indexFlags}>
                      {index.unique && <span className={styles.flag}>unique</span>}
                      {index.sparse && <span className={styles.flag}>sparse</span>}
                    </div>
                  </div>
                  <div className={styles.indexKeys}>
                    {Object.entries(index.keys).map(([key, dir]) => (
                      <span key={key} className={styles.keyBadge}>
                        {key}: {dir === 1 ? 'asc' : 'desc'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {documents && documents.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sample Documents</h2>
            <div className={styles.documents}>
              {documents.map((doc, i) => (
                <pre key={i} className={styles.document}>
                  {JSON.stringify(doc, null, 2)}
                </pre>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

Component.displayName = 'CollectionDetail'
