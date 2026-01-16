// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: <DashboardPage />,
  },
]
