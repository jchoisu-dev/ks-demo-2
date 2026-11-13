import { lazy } from 'react';
import { createHashRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import AdminRoute from "./AdminRoute";
const Main = lazy(() => import('@/app/layouts/main'));
const NotFound = () => {
  const { t } = useTranslation();
  return <>{t('common.notFound')}</>;
};
import authRoutes from '@/features/auth/routes';
import employeesRoutes from '@/features/employees/routes';
import attendanceRoutes from '@/features/attendance/routes';
import settingsRoutes from '@/features/settings/routes';
import dashboardRoutes from '@/features/dashboard/routes';
import payrollRoutes from '@/features/payroll/routes';
import holidayRoutes from '@/features/holidays/routes';
import logsRoutes from '@/features/logs/routes';
import usersRoutes from '@/features/users/routes';
import leaveRoutes from '@/features/leave/routes';
import StaffRoute from './StaffRoute';
const router = createHashRouter([
  {
    element: <GuestRoute />,
    children: authRoutes
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <StaffRoute />,
        children: [
          {
            path: '/',
            element: <Main />,
            children: [
              ...dashboardRoutes,
              ...employeesRoutes,
              ...attendanceRoutes,
              ...leaveRoutes,
              ...payrollRoutes,
              {
                element: <AdminRoute />,
                children: [
                  ...holidayRoutes,
                  ...settingsRoutes,
                  ...usersRoutes,
                  ...logsRoutes
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
export default router;