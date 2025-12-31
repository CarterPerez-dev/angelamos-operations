// ===================
// © AngelaMos | 2025
// index.tsx
// ===================

import type { RouteObject } from 'react-router-dom'
import { TikTokWorkflowPage } from '../pages/tiktokWorkflowPage'

export const videoCreatorRoutes: RouteObject[] = [
  {
    path: 'tiktok',
    children: [
      {
        path: 'new',
        element: <TikTokWorkflowPage />,
      },
      {
        path: 'session/:sessionId',
        element: <TikTokWorkflowPage />,
      },
    ],
  },
]
