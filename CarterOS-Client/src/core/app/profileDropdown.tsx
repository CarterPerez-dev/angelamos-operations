// ===========================
// ©AngelaMos | 2026
// profileDropdown.tsx
// ===========================

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  GiChart,
  GiSparkles,
  GiTrophy,
  GiCalendar,
  GiBookshelf,
  GiChecklist,
  GiBriefcase,
  GiShare,
  GiFox,
  GiBrain,
  GiFactory,
  GiExitDoor,
} from 'react-icons/gi'
import { GrDocker } from 'react-icons/gr'
import { USER } from '@/config'
import { useLogout } from '@/core/sys/auth/hooks'
import styles from './profileDropdown.module.scss'

interface ProfileDropdownProps {
  onClose: () => void
}

const NAV_SECTIONS = [
  {
    label: 'Social Media',
    items: [
      { to: '/analytics/data-input', label: 'Analytics', icon: GiChart },
      { to: '/analytics/insights', label: 'Insights', icon: GiSparkles },
      { to: '/challenge/tracker', label: 'Challenge', icon: GiTrophy },
    ],
  },
  {
    label: 'Life Manager',
    items: [
      { to: '/life/planner', label: 'Planner', icon: GiCalendar },
      { to: '/life/notes', label: 'Notes', icon: GiBookshelf },
      { to: '/life/checklist', label: 'Checklist', icon: GiChecklist },
      { to: '/life/jobs', label: 'Job Tracker', icon: GiBriefcase },
    ],
  },
  {
    label: 'Dev Workspace',
    items: [
      { to: '/dev-workspace/docker-manager', label: 'Docker Manager', icon: GrDocker },
    ],
  },
  {
    label: 'Business Hub',
    items: [
      { to: '/dashboard', label: 'Hub', icon: GiFactory },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/angela', label: 'Angela', icon: GiShare },
      { to: '/moss', label: 'Moss', icon: GiFox },
      { to: '/horus', label: 'Horus', icon: GiBrain },
    ],
  },
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

      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className={styles.divider} />
          <span className={styles.sectionLabel}>{section.label}</span>
          <nav className={styles.links}>
            {section.items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={styles.link} onClick={onClose}>
                <Icon />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      ))}

      <div className={styles.divider} />

      <button className={styles.logoutButton} onClick={handleLogout}>
        <GiExitDoor />
        <span>Sign out</span>
      </button>
    </div>
  )
}
