// ===========================
// ©AngelaMos | 2025
// unauthorizedPage.tsx
// ===========================

import { Link } from 'react-router-dom'
import { GiLockedChest } from 'react-icons/gi'
import { APP, ROUTES } from '@/config'
import { Button } from '@/design/components/button'
import styles from './unauthorizedPage.module.scss'

export function UnauthorizedPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <GiLockedChest />
        </div>

        <h1>Access Denied</h1>
        <p>You don't have permission to view this page.</p>

        <div className={styles.actions}>
          <Link to={ROUTES.ROOT}>
            <Button variant="secondary">Go to {APP.NAME}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export const Component = UnauthorizedPage
Component.displayName = 'UnauthorizedPage'
