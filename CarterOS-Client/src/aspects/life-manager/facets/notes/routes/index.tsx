// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'

export const notesRoutes: RouteObject[] = [
  {
    path: 'notes',
    lazy: () =>
      import('../pages/NotesPage').then((m) => ({ Component: m.NotesPage })),
  },
]
