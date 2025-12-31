// ===========================
// ©AngelaMos | 2025
// profileDropdown.tsx
// ===========================

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  GiAbstract010,
  GiBrain,
  GiFactory,
  GiHeartBeats,
  GiExitDoor,
  GiVideoCamera,
  GiBookshelf,
  GiShare,
  GiCalendar,
  GiChart,
  GiTrophy,
  GiAlarmClock,
} from 'react-icons/gi'
import { USER } from '@/config'
import { useLogout } from '@/core/sys/auth/hooks'
import styles from './profileDropdown.module.scss'

interface ProfileDropdownProps {
  onClose: () => void
}

const ASPECT_LINKS = [
  { to: '/challenge/tracker', label: 'Challenge', icon: GiTrophy },
  { to: '/content-studio', label: 'Content Studio', icon: GiVideoCamera },
  { to: '/business-hub', label: 'Business Hub', icon: GiFactory },
  { to: '/life-manager', label: 'Life Manager', icon: GiHeartBeats },
  { to: '/dev-workspace', label: 'Dev Workspace', icon: GiAbstract010 },
  { to: '/horus', label: 'Horus', icon: GiBrain },
]

const SCHEDULER_LINKS = [
  { to: '/content-studio/scheduler/calendar', label: 'Calendar', icon: GiCalendar },
  { to: '/content-studio/scheduler/schedule', label: 'Schedule', icon: GiAlarmClock },
  { to: '/content-studio/scheduler/library', label: 'Library', icon: GiBookshelf },
  { to: '/content-studio/scheduler/accounts', label: 'Accounts', icon: GiShare },
  { to: '/content-studio/scheduler/analytics', label: 'Analytics', icon: GiChart },
]

export function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { mutate: logout } = useLogout()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      <div className={styles.header}>
        <img src={USER.AVATAR} alt={USER.NAME} className={styles.avatar} />
        <span className={styles.name}>{USER.NAME}</span>
      </div>

      <div className={styles.divider} />

      <nav className={styles.links}>
        {ASPECT_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={styles.link} onClick={onClose}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.divider} />

      <div className={styles.sectionLabel}>Scheduler</div>
      <nav className={styles.links}>
        {SCHEDULER_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={styles.link} onClick={onClose}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.divider} />

      <button className={styles.logoutButton} onClick={handleLogout}>
        <GiExitDoor />
        <span>Sign out</span>
      </button>
    </div>
  )
}
