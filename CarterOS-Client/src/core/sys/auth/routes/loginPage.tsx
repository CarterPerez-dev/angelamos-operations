// ===========================
// ©AngelaMos | 2025
// loginPage.tsx
// ===========================

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { APP, ROUTES } from '@/config'
import { useAuthStore } from '@/core/state'
import { useLogin } from '@/core/sys/auth/hooks'
import { useAuthUIStore } from '@/core/sys/auth/stores'
import { Button } from '@/design/components/button'
import { Input } from '@/design/components/input'
import styles from './loginPage.module.scss'

export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { loginEmail, setLoginEmail } = useAuthUIStore()
  const { mutate: login, isPending } = useLogin()

  const [password, setPassword] = useState('')

  if (isAuthenticated) {
    return <Navigate to={ROUTES.ROOT} replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ username: loginEmail, password })
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <img src={APP.LOGO} alt={APP.NAME} className={styles.logo} />
          <h1>{APP.NAME}</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export const Component = LoginPage
Component.displayName = 'LoginPage'
