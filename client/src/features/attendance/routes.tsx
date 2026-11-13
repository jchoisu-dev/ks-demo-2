import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
const Timesheet = lazy(() => import('./pages/Timesheet'));
const attendanceRoutes: RouteObject[] = [
  { path: '/attendance/timesheet', element: <Timesheet /> },
  { path: '/attendance/timesheet_v2', element: <Navigate to="/attendance/timesheet" replace /> }
];
export default attendanceRoutes;
