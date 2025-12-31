// ===========================
// ©AngelaMos | 2025
// index.tsx
// ===========================

import { Navigate, type RouteObject } from 'react-router-dom'
import {
  CalendarPage,
  LibraryPage,
  SchedulePage,
  AccountsPage,
  AnalyticsPage,
} from '../pages'

export const schedulerRoutes: RouteObject[] = [
  {
    path: 'scheduler',
    children: [
      {
        index: true,
        element: <Navigate to="calendar" replace />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
      },
      {
        path: 'schedule',
        element: <SchedulePage />,
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
    ],
  },
]
