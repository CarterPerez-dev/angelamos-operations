// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { TrackerPage } from '../pages/TrackerPage'

export const trackerRoutes: RouteObject[] = [
  {
    path: 'tracker',
    element: <TrackerPage />,
  },
]
