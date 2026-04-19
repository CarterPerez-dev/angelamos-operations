// ===================
// © AngelaMos | 2025
// systemInfoCard.tsx
// ===================

import { GiCpu, GiStack } from 'react-icons/gi'
import { HiOutlineComputerDesktop } from 'react-icons/hi2'
import type { SystemInfo } from '../types/docker.types'
import styles from './systemInfoCard.module.scss'

interface SystemInfoCardProps {
  info: SystemInfo
}

export function SystemInfoCard({ info }: SystemInfoCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <HiOutlineComputerDesktop className={styles.headerIcon} />
        <h3 className={styles.title}>Docker System</h3>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.label}>Version</span>
          <span className={styles.value}>{info.docker_version}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>API</span>
          <span className={styles.value}>{info.api_version}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>OS</span>
          <span className={styles.value}>{info.os}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Arch</span>
          <span className={styles.value}>{info.arch}</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <GiStack className={styles.sectionIcon} />
          <span className={styles.sectionTitle}>Containers</span>
        </div>
        <div className={styles.grid}>
          <div className={styles.stat}>
            <span className={styles.label}>Total</span>
            <span className={styles.value}>{info.containers}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Running</span>
            <span className={styles.valueHighlight}>
              {info.containers_running}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Paused</span>
            <span className={styles.value}>{info.containers_paused}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Stopped</span>
            <span className={styles.value}>{info.containers_stopped}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <GiCpu className={styles.sectionIcon} />
          <span className={styles.sectionTitle}>Images</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Total Images</span>
          <span className={styles.value}>{info.images}</span>
        </div>
      </div>
    </div>
  )
}
