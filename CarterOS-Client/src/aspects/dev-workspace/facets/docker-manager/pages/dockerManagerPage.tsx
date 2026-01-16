// ===================
// © AngelaMos | 2025
// dockerManagerPage.tsx
// ===================

import { useState } from 'react'
import { ProjectCard, SystemInfoCard, StorageInfoCard, PortCheckerCard } from '../components'
import {
  useDockerProjects,
  useDockerSystemInfo,
  useDockerStorageInfo,
  useStartProject,
  useStopProject,
  useRestartProject,
  useSetProjectProtection,
  useSetProjectDisplayName,
  useSetProjectHidden,
  usePruneSystem,
} from '../hooks'
import { ProtectionReason, ProjectStatus } from '../types/docker.types'
import styles from './dockerManagerPage.module.scss'

export function DockerManagerPage() {
  const [showOnlyRunning, setShowOnlyRunning] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useDockerProjects()
  const { data: systemInfo, isLoading: systemLoading } = useDockerSystemInfo()
  const { data: storageInfo, isLoading: storageLoading } = useDockerStorageInfo()

  const startProject = useStartProject()
  const stopProject = useStopProject()
  const restartProject = useRestartProject()
  const setProtection = useSetProjectProtection()
  const setDisplayName = useSetProjectDisplayName()
  const setHidden = useSetProjectHidden()
  const pruneSystem = usePruneSystem()

  const handleStart = (id: string) => {
    startProject.mutate(id)
  }

  const handleStop = (id: string) => {
    stopProject.mutate({ id })
  }

  const handleRestart = (id: string) => {
    restartProject.mutate(id)
  }

  const handleToggleProtection = (id: string, isProtected: boolean) => {
    setProtection.mutate({
      id,
      request: {
        protected: isProtected,
        reason: isProtected ? ProtectionReason.USER_MARKED : undefined,
      },
    })
  }

  const handlePrune = () => {
    pruneSystem.mutate({
      images: true,
      volumes: false,
      build_cache: true,
    })
  }

  const handleRename = (id: string, oldName: string, newName: string) => {
    setDisplayName.mutate({
      id,
      oldName,
      request: { display_name: newName },
    })
  }

  const handleToggleHidden = (id: string, hidden: boolean) => {
    setHidden.mutate({
      id,
      request: { hidden },
    })
  }

  if (projectsError) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Error loading Docker projects</h2>
          <p>{projectsError.message}</p>
          <p className={styles.errorHint}>
            Make sure the Docker API is running on port 7771
          </p>
        </div>
      </div>
    )
  }

  const filteredProjects = projects?.filter((project) => {
    if (!showHidden && project.hidden) {
      return false
    }
    if (showOnlyRunning) {
      return project.status === ProjectStatus.RUNNING || project.status === ProjectStatus.PARTIAL
    }
    return true
  })

  const hiddenCount = projects?.filter((p) => p.hidden).length || 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Docker Manager</h1>
          <p className={styles.subtitle}>Manage your Docker projects and containers</p>
        </div>
        <div className={styles.headerControls}>
          <PortCheckerCard />
          <div className={styles.filters}>
            <label className={styles.filterToggle}>
              <input
                type="checkbox"
                checked={showOnlyRunning}
                onChange={(e) => setShowOnlyRunning(e.target.checked)}
              />
              <span>Show only running</span>
            </label>
            <label className={styles.filterToggle}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              <span>Show hidden ({hiddenCount})</span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        {systemLoading ? (
          <div className={styles.loadingCard}>Loading system info...</div>
        ) : systemInfo ? (
          <SystemInfoCard info={systemInfo} />
        ) : null}

        {storageLoading ? (
          <div className={styles.loadingCard}>Loading storage info...</div>
        ) : storageInfo ? (
          <StorageInfoCard
            info={storageInfo}
            onPrune={handlePrune}
            isPruning={pruneSystem.isPending}
          />
        ) : null}
      </div>

      <div className={styles.main}>
        {projectsLoading ? (
          <div className={styles.loading}>Loading projects...</div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <div className={styles.projectsGrid}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
                onToggleProtection={handleToggleProtection}
                onRename={handleRename}
                onToggleHidden={handleToggleHidden}
                isLoading={
                  startProject.isPending ||
                  stopProject.isPending ||
                  restartProject.isPending ||
                  setProtection.isPending ||
                  setDisplayName.isPending ||
                  setHidden.isPending
                }
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>{showOnlyRunning ? 'No running projects' : 'No Docker projects found'}</p>
            <p className={styles.emptyHint}>
              {showOnlyRunning
                ? 'Start a project to see it here'
                : 'Projects with docker-compose.yml files will appear here automatically'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
