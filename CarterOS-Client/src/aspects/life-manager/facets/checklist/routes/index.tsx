// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { ChecklistPage } from '../pages'

export const checklistRoutes: RouteObject[] = [
  {
    path: 'checklist',
    element: <ChecklistPage />,
  },
]
