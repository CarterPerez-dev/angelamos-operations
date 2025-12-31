// ===================
// © AngelaMos | 2025
// routers.tsx
// ===================

import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { ROUTES } from '@/config'
import { ProtectedRoute } from './protected-route'
import { Shell } from './shell'
import { videoCreatorRoutes } from '@/aspects/content-studio/facets/video-creator/routes'
import { schedulerRoutes } from '@/aspects/content-studio/facets/scheduler/routes'
import { trackerRoutes } from '@/aspects/challenge/facets/tracker/routes'

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
            element: <Navigate to="/challenge/tracker" replace />,
          },
          {
            path: 'content-studio',
            children: [
              {
                index: true,
                element: <Navigate to="scheduler/calendar" replace />,
              },
              ...videoCreatorRoutes,
              ...schedulerRoutes,
            ],
          },
          {
            path: 'challenge',
            children: [...trackerRoutes],
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
