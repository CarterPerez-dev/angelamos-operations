// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { JobTrackerPage } from './JobTrackerPage'

export const jobTrackerRoutes: RouteObject[] = [
  {
    path: 'jobs',
    element: <JobTrackerPage />,
  },
]

export { JobTrackerPage }
