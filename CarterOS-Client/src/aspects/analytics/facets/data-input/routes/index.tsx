// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { DataInputPage } from '../pages/dataInputPage'

export const analyticsRoutes: RouteObject[] = [
  {
    path: 'analytics/data-input',
    element: <DataInputPage />,
  },
]
