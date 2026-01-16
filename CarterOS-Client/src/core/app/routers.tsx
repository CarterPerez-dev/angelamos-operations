// ===================
// © AngelaMos | 2025
// routers.tsx
// ===================

import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { ROUTES } from '@/config'
import { ProtectedRoute } from './protected-route'
import { Shell } from './shell'
import { trackerRoutes } from '@/aspects/challenge/facets/tracker/routes'
import { plannerRoutes } from '@/aspects/life-manager/facets/planner/routes'
import { jobTrackerRoutes } from '@/aspects/life-manager/facets/career/job-app-tracker/routes'
import { LifeManagerHub } from '@/aspects/life-manager/shared/ui'
import { dashboardRoutes } from '@/aspects/ops/facets/dashboard/routes'
import { dockerManagerRoutes } from '@/aspects/dev-workspace/facets/docker-manager/routes'

const routes: RouteObject[] = [
  {
    path: '/',
    lazy: () => import('@/core/sys/auth/routes/loginPage'),
  },
  {
    path: ROUTES.LOGIN,
    lazy: () => import('@/core/sys/auth/routes/loginPage'),
  },
  {
    path: ROUTES.UNAUTHORIZED,
    lazy: () => import('@/core/sys/auth/routes/unauthorizedPage'),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Shell />,
        children: [
          {
            path: ROUTES.ROOT,
            element: <Navigate to="/dashboard" replace />,
          },
          ...dashboardRoutes,
          {
            path: 'challenge',
            children: [...trackerRoutes],
          },
          {
            path: 'life',
            children: [
              {
                index: true,
                element: <LifeManagerHub />,
              },
              ...plannerRoutes,
              ...jobTrackerRoutes,
            ],
          },
          {
            path: 'dev-workspace',
            children: [...dockerManagerRoutes],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/core/sys/auth/routes/loginPage'),
  },
]

export const router = createBrowserRouter(routes)
