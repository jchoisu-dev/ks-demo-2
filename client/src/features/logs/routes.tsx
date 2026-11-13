import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const LogsPage = lazy(() => import('./pages/Logs'));
const logsRoutes: RouteObject[] = [
  {
    path: '/logs',
    element: <LogsPage />
  }
];
export default logsRoutes;
