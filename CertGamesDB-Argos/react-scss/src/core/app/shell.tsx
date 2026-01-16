// ===================
// AngelaMos | 2026
// shell.tsx
// ===================

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  LuDatabase,
  LuHardDrive,
  LuChevronLeft,
  LuChevronRight,
  LuMenu,
  LuGauge,
  LuSearch,
  LuSettings,
  LuExternalLink,
} from 'react-icons/lu'
import { SiMongodb } from 'react-icons/si'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useUIStore } from '@/core/lib'
import { useWebSocket } from '@/api'
import styles from './shell.module.scss'

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard', icon: LuGauge },
  { path: ROUTES.COLLECTIONS, label: 'Collections', icon: LuDatabase },
  { path: ROUTES.BACKUPS, label: 'Backups', icon: LuHardDrive },
  { path: ROUTES.SLOW_QUERIES, label: 'Slow Queries', icon: LuSearch },
  { path: ROUTES.SETTINGS, label: 'Settings', icon: LuSettings },
]

function ShellErrorFallback({ error }: { error: Error }): React.ReactElement {
  return (
    <div className={styles.error}>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
    </div>
  )
}

function ShellLoading(): React.ReactElement {
  return <div className={styles.loading}>Loading...</div>
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith(ROUTES.COLLECTIONS) && pathname !== ROUTES.COLLECTIONS) {
    return 'Collection Details'
  }
  const item = NAV_ITEMS.find((i) => i.path === pathname)
  return item?.label ?? 'Dashboard'
}

export function Shell(): React.ReactElement {
  const location = useLocation()
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } =
    useUIStore()
  const { isConnected } = useWebSocket()

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} ${sidebarCollapsed ? styles.collapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>MongoDB Dashboard</span>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <LuChevronRight /> : <LuChevronLeft />}
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => sidebarOpen && toggleSidebar()}
            >
              <item.icon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}

          <a
            href="http://localhost:1469"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            <SiMongodb className={styles.navIcon} />
            <span className={styles.navLabel}>Mongo Express</span>
            <LuExternalLink className={styles.externalIcon} />
          </a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.connectionStatus}>
            <span
              className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}
            />
            <span className={styles.statusText}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
          aria-label="Close sidebar"
        />
      )}

      <div
        className={`${styles.main} ${sidebarCollapsed ? styles.collapsed : ''}`}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <LuMenu />
            </button>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.wsStatus}>
              <span
                className={`${styles.wsDot} ${isConnected ? styles.live : ''}`}
              />
              {isConnected ? 'Live' : 'Polling'}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <ErrorBoundary FallbackComponent={ShellErrorFallback}>
            <Suspense fallback={<ShellLoading />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
