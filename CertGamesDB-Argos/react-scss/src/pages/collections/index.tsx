// ===================
// AngelaMos | 2026
// collections/index.tsx
// ===================

import { Link } from 'react-router-dom'
import { LuDatabase, LuChevronRight } from 'react-icons/lu'
import { useCollections } from '@/api'
import { ROUTES } from '@/config'
import styles from './collections.module.scss'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatNumber(num: number): string {
  if (num < 1000) return String(num)
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

export function Component(): React.ReactElement {
  const { data, isLoading, error } = useCollections()

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading collections...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>Failed to load collections</div>
      </div>
    )
  }

  const collections = data?.collections ?? []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Collections</h1>
          <p className={styles.subtitle}>
            {data?.database} - {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className={styles.empty}>
          <LuDatabase className={styles.emptyIcon} />
          <p>No collections found</p>
          <span>This database has no collections</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {collections.map((collection) => (
            <Link
              key={collection.name}
              to={ROUTES.COLLECTION_DETAIL(collection.name)}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <LuDatabase className={styles.cardIcon} />
                <span className={styles.cardName}>{collection.name}</span>
                <LuChevronRight className={styles.chevron} />
              </div>
              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{formatNumber(collection.document_count)}</span>
                  <span className={styles.statLabel}>Documents</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{formatBytes(collection.size_bytes)}</span>
                  <span className={styles.statLabel}>Size</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{collection.index_count}</span>
                  <span className={styles.statLabel}>Indexes</span>
                </div>
              </div>
              {collection.avg_doc_size > 0 && (
                <div className={styles.cardFooter}>
                  <span>Avg doc: {formatBytes(collection.avg_doc_size)}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

Component.displayName = 'Collections'
