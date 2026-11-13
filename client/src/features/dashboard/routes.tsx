import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
const DashboardPage = lazy(() => import('./pages'));
const dashboardRoutes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: <DashboardPage />
  }
];
export default dashboardRoutes;