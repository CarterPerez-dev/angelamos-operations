// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { DockerManagerPage } from '../pages'

export const dockerManagerRoutes: RouteObject[] = [
  {
    path: 'docker-manager',
    element: <DockerManagerPage />,
  },
]
