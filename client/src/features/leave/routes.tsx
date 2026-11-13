import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const LeavePage = lazy(() => import('./pages/Leave'));
const leaveRoutes: RouteObject[] = [
  {
    path: '/attendance/leave',
    element: <LeavePage />
  }
];
export default leaveRoutes;
