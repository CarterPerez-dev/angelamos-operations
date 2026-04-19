// ===================
// © AngelaMos | 2025
// storageInfoCard.tsx
// ===================

import { CiHardDrive } from 'react-icons/ci'
import { GiTrashCan } from 'react-icons/gi'
import { formatBytes } from '../types/docker.enums'
import type { StorageInfo } from '../types/docker.types'
import styles from './storageInfoCard.module.scss'

interface StorageInfoCardProps {
  info: StorageInfo
  onPrune: () => void
  isPruning?: boolean
}

export function StorageInfoCard({
  info,
  onPrune,
  isPruning = false,
}: StorageInfoCardProps) {
  const reclaimablePercent =
    info.total_size > 0 ? (info.reclaimable / info.total_size) * 100 : 0

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <CiHardDrive className={styles.headerIcon} />
          <h3 className={styles.title}>Storage</h3>
        </div>
        <button
          type="button"
          onClick={onPrune}
          disabled={isPruning || info.reclaimable === 0}
          className={styles.pruneBtn}
        >
          <GiTrashCan /> Prune
        </button>
      </div>

      <div className={styles.totalSize}>
        <span className={styles.label}>Total Size</span>
        <span className={styles.value}>{formatBytes(info.total_size)}</span>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Images</span>
          <span className={styles.breakdownValue}>
            {formatBytes(info.images_size)}
          </span>
        </div>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Containers</span>
          <span className={styles.breakdownValue}>
            {formatBytes(info.containers_size)}
          </span>
        </div>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Volumes</span>
          <span className={styles.breakdownValue}>
            {formatBytes(info.volumes_size)}
          </span>
        </div>
        <div className={styles.breakdownItem}>
          <span className={styles.breakdownLabel}>Build Cache</span>
          <span className={styles.breakdownValue}>
            {formatBytes(info.build_cache_size)}
          </span>
        </div>
      </div>

      <div className={styles.reclaimable}>
        <div className={styles.reclaimableHeader}>
          <span className={styles.reclaimableLabel}>Reclaimable</span>
          <span className={styles.reclaimableValue}>
            {formatBytes(info.reclaimable)}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(reclaimablePercent, 100)}%` }}
          />
        </div>
        <span className={styles.reclaimablePercent}>
          {reclaimablePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
