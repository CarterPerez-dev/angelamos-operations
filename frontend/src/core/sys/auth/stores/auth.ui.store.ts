// ===================
// © AngelaMos | 2025
// auth.ui.store.ts
// ===================

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/config'

interface AuthUIState {
  loginEmail: string
  setLoginEmail: (email: string) => void
  clearLoginEmail: () => void
}

export const useAuthUIStore = create<AuthUIState>()(
  devtools(
    persist(
      (set) => ({
        loginEmail: '',

        setLoginEmail: (email) =>
          set({ loginEmail: email }, false, 'authUI/setLoginEmail'),

        clearLoginEmail: () =>
          set({ loginEmail: '' }, false, 'authUI/clearLoginEmail'),
      }),
      {
        name: STORAGE_KEYS.AUTH_UI,
      }
    ),
    { name: 'AuthUIStore' }
  )
)

export const useLoginEmail = (): string => useAuthUIStore((s) => s.loginEmail)
