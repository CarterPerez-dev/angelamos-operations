// ===================
// AngelaMos | 2026
// routers.tsx
// ===================

import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { ROUTES } from '@/config'
import { Shell } from './shell'

const routes: RouteObject[] = [
  {
    element: <Shell />,
    children: [
      {
        path: ROUTES.DASHBOARD,
        lazy: () => import('@/pages/dashboard'),
      },
      {
        path: ROUTES.BACKUPS,
        lazy: () => import('@/pages/backups'),
      },
      {
        path: ROUTES.COLLECTIONS,
        lazy: () => import('@/pages/collections'),
      },
      {
        path: `${ROUTES.COLLECTIONS}/:name`,
        lazy: () => import('@/pages/collection-detail'),
      },
      {
        path: ROUTES.SLOW_QUERIES,
        lazy: () => import('@/pages/slow-queries'),
      },
      {
        path: ROUTES.SETTINGS,
        lazy: () => import('@/pages/settings'),
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/pages/dashboard'),
  },
]

export const router = createBrowserRouter(routes)
