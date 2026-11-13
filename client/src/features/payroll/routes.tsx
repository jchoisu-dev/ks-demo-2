import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const PayrollPage = lazy(() => import('./pages'));
const payrollRoutes: RouteObject[] = [
  {
    path: '/payroll/overview',
    element: <PayrollPage />
  }
];
export default payrollRoutes;