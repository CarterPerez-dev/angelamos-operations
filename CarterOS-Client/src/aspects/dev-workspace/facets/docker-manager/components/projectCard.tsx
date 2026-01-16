// ===================
// © AngelaMos | 2025
// projectCard.tsx
// ===================

import { useState } from 'react'
import { GiPauseButton, GiRecycle, GiShield, GiShieldDisabled } from 'react-icons/gi'
import { CiPlay1 } from 'react-icons/ci'
import { HiOutlinePencil, HiOutlineEye, HiOutlineEyeOff, HiCheck, HiX } from 'react-icons/hi'
import type { Project } from '../types/docker.types'
import { ProjectStatus, Environment } from '../types/docker.types'
import { ENVIRONMENT_LABELS, STATUS_COLORS } from '../types/docker.enums'
import styles from './projectCard.module.scss'

interface ProjectCardProps {
  project: Project
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onToggleProtection: (id: string, isProtected: boolean) => void
  onRename: (id: string, oldName: string, newName: string) => void
  onToggleHidden: (id: string, hidden: boolean) => void
  isLoading?: boolean
}

export function ProjectCard({
  project,
  onStart,
  onStop,
  onRestart,
  onToggleProtection,
  onRename,
  onToggleHidden,
  isLoading = false,
}: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.display_name ?? project.name)

  const isRunning = project.status === ProjectStatus.RUNNING
  const isStopped = project.status === ProjectStatus.STOPPED

  const statusColor = STATUS_COLORS[project.status]
  const displayName = project.display_name ?? project.name

  const handleSaveRename = () => {
    if (editName.trim() && editName !== displayName) {
      onRename(project.id, displayName, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setEditName(displayName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  return (
    <div className={`${styles.card} ${project.hidden ? styles.hidden : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {isEditing ? (
            <div className={styles.editName}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.nameInput}
                autoFocus
              />
              <button type="button" onClick={handleSaveRename} className={styles.btnIcon}>
                <HiCheck />
              </button>
              <button type="button" onClick={handleCancelRename} className={styles.btnIcon}>
                <HiX />
              </button>
            </div>
          ) : (
            <div className={styles.nameWithEdit}>
              <h3 className={styles.name}>{displayName}</h3>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={styles.btnPen}
                title="Rename project"
              >
                <HiOutlinePencil />
              </button>
            </div>
          )}
          <div className={styles.badges}>
            {project.environment !== Environment.UNKNOWN && (
              <span className={styles.envBadge}>
                {ENVIRONMENT_LABELS[project.environment]}
              </span>
            )}
            {project.protected && (
              <span className={styles.protectedBadge}>
                <GiShield /> Protected
              </span>
            )}
          </div>
        </div>
        <div
          className={styles.status}
          style={{ color: statusColor }}
        >
          <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
          {project.status}
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Path:</span>
          <span className={styles.value}>{project.path}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Compose:</span>
          <span className={styles.value}>{project.compose_file}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Containers:</span>
          <span className={styles.value}>
            {project.containers.length} ({project.containers.filter((c) => c.state === 'running').length} running)
          </span>
        </div>
      </div>

      {project.containers.length > 0 && (
        <div className={styles.containers}>
          {project.containers.map((container) => (
            <div key={container.id} className={styles.container}>
              <span className={styles.containerName}>{container.service_name}</span>
              <span className={styles.containerState}>{container.state}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onStart(project.id)}
          disabled={isLoading || isRunning}
          className={styles.btnStart}
        >
          <CiPlay1 /> Start
        </button>
        <button
          type="button"
          onClick={() => onStop(project.id)}
          disabled={isLoading || isStopped || project.protected}
          className={styles.btnStop}
        >
          <GiPauseButton /> Stop
        </button>
        <button
          type="button"
          onClick={() => onRestart(project.id)}
          disabled={isLoading || isStopped}
          className={styles.btnRestart}
        >
          <GiRecycle /> Restart
        </button>
        <button
          type="button"
          onClick={() => onToggleProtection(project.id, !project.protected)}
          disabled={isLoading}
          className={styles.btnProtect}
        >
          {project.protected ? <GiShieldDisabled /> : <GiShield />}
          {project.protected ? 'Unprotect' : 'Protect'}
        </button>
        <button
          type="button"
          onClick={() => onToggleHidden(project.id, !project.hidden)}
          disabled={isLoading}
          className={styles.btnHide}
        >
          {project.hidden ? <HiOutlineEye /> : <HiOutlineEyeOff />}
          {project.hidden ? 'Show' : 'Hide'}
        </button>
      </div>
    </div>
  )
}
