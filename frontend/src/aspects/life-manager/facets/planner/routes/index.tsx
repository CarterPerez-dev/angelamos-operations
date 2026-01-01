// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'

export const plannerRoutes: RouteObject[] = [
  {
    path: 'planner',
    lazy: () => import('../pages/DayPlannerPage').then((m) => ({ Component: m.DayPlannerPage })),
  },
  {
    path: 'notes',
    lazy: () => import('../pages/NotesPage').then((m) => ({ Component: m.NotesPage })),
  },
]
