// ===========================
// ©AngelaMos | 2025
// header.tsx
// ===========================

import { Link, useLocation } from 'react-router-dom'
import {
  GiBrain,
  GiCalendar,
  GiChart,
  GiHouse,
  GiMagnifyingGlass,
  GiRingingBell,
  GiSpeedometer,
  GiBookshelf,
  GiShare,
} from 'react-icons/gi'
import { APP, USER } from '@/config'
import { useShellUIStore } from '@/core/state'
import { ProfileDropdown } from './profileDropdown'
import styles from './header.module.scss'

export function Header() {
  const location = useLocation()
  const { profileDropdownOpen, toggleProfileDropdown, closeProfileDropdown } =
    useShellUIStore()

  const pathSegments = location.pathname.split('/').filter(Boolean)

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          <img src={APP.LOGO} alt={APP.NAME} />
        </Link>

        <span className={styles.separator}>/</span>

        <span className={styles.brand}>{USER.NAME}</span>

        {pathSegments.length > 0 && (
          <>
            <span className={styles.separator}>/</span>
            <nav className={styles.breadcrumb}>
              {pathSegments.map((segment, index) => (
                <span key={segment}>
                  {index > 0 && <span className={styles.separator}>/</span>}
                  <span className={styles.segment}>{segment}</span>
                </span>
              ))}
            </nav>
          </>
        )}
      </div>

      <div className={styles.right}>
        <nav className={styles.nav}>
          <Link to="/challenge/tracker" className={styles.navLink}>
            <GiHouse />
            <span>Dashboard</span>
          </Link>
          <Link to="/content-studio/scheduler/calendar" className={styles.navLink}>
            <GiCalendar />
            <span>Calendar</span>
          </Link>
          <Link to="/content-studio/scheduler/analytics" className={styles.navLink}>
            <GiChart />
            <span>Analytics</span>
          </Link>
          <Link to="/content-studio/tiktok/new" className={styles.navLink}>
            <GiBrain />
            <span>Create</span>
          </Link>
        </nav>

        <div className={styles.actions}>
          <button className={styles.iconButton} title="Notifications">
            <GiRingingBell />
          </button>
          <button className={styles.iconButton} title="Quick Nav">
            <GiSpeedometer />
          </button>
          <button className={styles.iconButton} title="Search">
            <GiMagnifyingGlass />
          </button>
        </div>

        <div className={styles.profile}>
          <button
            className={styles.avatarButton}
            onClick={toggleProfileDropdown}
          >
            <img src={USER.AVATAR} alt={USER.NAME} />
          </button>

          {profileDropdownOpen && (
            <ProfileDropdown onClose={closeProfileDropdown} />
          )}
        </div>
      </div>
    </header>
  )
}
