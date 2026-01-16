// ===================
// © AngelaMos | 2025
// LifeManagerHub.tsx
// ===================

import { Link } from 'react-router-dom'
import styles from './lifeManagerHub.module.scss'

interface FacetCard {
  title: string
  description: string
  path: string
  icon: string
  enabled: boolean
}

interface JobBoard {
  name: string
  url: string
}

const jobBoards: JobBoard[] = [
  { name: 'Wellfound', url: 'https://wellfound.com/jobs/home' },
  { name: 'Work at a Startup', url: 'https://www.workatastartup.com/companies?demographic=any&hasEquity=any&hasSalary=any&industry=any&interviewProcess=any&jobType=fulltime&layout=list-compact&role=eng&sortBy=created_desc&tab=any&usVisaNotRequired=any' },
  { name: 'Indeed', url: 'https://www.indeed.com/' },
]

const facets: FacetCard[] = [
  {
    title: 'Planner',
    description: 'Daily and weekly planning to stay organized and focused',
    path: '/life/planner',
    icon: '/',
    enabled: true,
  },
  {
    title: 'Job Tracker',
    description: 'Track applications, interviews, and manage your job hunt',
    path: '/life/jobs',
    icon: '~',
    enabled: true,
  },
  {
    title: 'Notes',
    description: 'Quick notes, ideas, and reference material',
    path: '/life/notes',
    icon: '#',
    enabled: true,
  },
  {
    title: 'Journal',
    description: 'Reflect, document thoughts, and track personal growth',
    path: '/life/journal',
    icon: '>',
    enabled: false,
  },
  {
    title: 'Habits',
    description: 'Build and maintain habits with streaks and tracking',
    path: '/life/habits',
    icon: '+',
    enabled: false,
  },
  {
    title: 'Gym',
    description: 'Workout plans, progress tracking, and fitness goals',
    path: '/life/gym',
    icon: '^',
    enabled: false,
  },
]

export function LifeManagerHub() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Life Manager</h1>
        <p className={styles.subtitle}>
          Tools for organizing your personal and professional life
        </p>
      </header>

      <div className={styles.grid}>
        {facets.map((facet) =>
          facet.enabled ? (
            <Link
              key={facet.title}
              to={facet.path}
              className={styles.card}
            >
              <div className={styles.cardIcon}>{facet.icon}</div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{facet.title}</h2>
                <p className={styles.cardDescription}>{facet.description}</p>
              </div>
            </Link>
          ) : (
            <div
              key={facet.title}
              className={`${styles.card} ${styles.cardDisabled}`}
            >
              <div className={styles.cardIcon}>{facet.icon}</div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{facet.title}</h2>
                <p className={styles.cardDescription}>{facet.description}</p>
                <span className={styles.cardBadge}>Coming Soon</span>
              </div>
            </div>
          )
        )}
      </div>

      <section className={styles.jobBoardsSection}>
        <h2 className={styles.sectionTitle}>Job Boards</h2>
        <div className={styles.jobBoardsList}>
          {jobBoards.map((board) => (
            <a
              key={board.name}
              href={board.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.jobBoardLink}
            >
              {board.name}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
