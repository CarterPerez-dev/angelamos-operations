// ===================
// © AngelaMos | 2025
// shell.ui.store.ts
// ===================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ShellUIState {
  profileDropdownOpen: boolean
  toggleProfileDropdown: () => void
  setProfileDropdownOpen: (open: boolean) => void
  closeProfileDropdown: () => void
}

export const useShellUIStore = create<ShellUIState>()(
  devtools(
    (set) => ({
      profileDropdownOpen: false,

      toggleProfileDropdown: () =>
        set(
          (state) => ({ profileDropdownOpen: !state.profileDropdownOpen }),
          false,
          'shell/toggleProfileDropdown'
        ),

      setProfileDropdownOpen: (open) =>
        set({ profileDropdownOpen: open }, false, 'shell/setProfileDropdownOpen'),

      closeProfileDropdown: () =>
        set({ profileDropdownOpen: false }, false, 'shell/closeProfileDropdown'),
    }),
    { name: 'ShellUIStore' }
  )
)

export const useProfileDropdownOpen = (): boolean =>
  useShellUIStore((s) => s.profileDropdownOpen)
