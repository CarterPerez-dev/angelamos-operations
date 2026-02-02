// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { DataInputPage } from '../pages/dataInputPage'
import { InsightsPage } from '../../insights/pages'

export const analyticsRoutes: RouteObject[] = [
  {
    path: 'analytics/data-input',
    element: <DataInputPage />,
  },
  {
    path: 'analytics/insights',
    element: <InsightsPage />,
  },
]
