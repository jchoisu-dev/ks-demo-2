import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const CompanyPage = lazy(() => import('./pages/Company'));
const TaxPage = lazy(() => import('./pages/Tax'));
const ShiftsPage = lazy(() => import('./shifts/page/Shifts'));
const WorkHoursPage = lazy(() => import('./pages/WorkHours'));
const CurrenciesPage = lazy(() => import('./pages/Currencies'));
const settingsRoutes: RouteObject[] = [
  {
    path: '/settings/company',
    element: <CompanyPage />
  },
  {
    path: '/settings/shifts',
    element: <ShiftsPage />
  },
  {
    path: '/settings/work-hours',
    element: <WorkHoursPage />
  },
  {
    path: '/settings/tax',
    element: <TaxPage />
  },
  {
    path: '/settings/currencies',
    element: <CurrenciesPage />
  }
];
export default settingsRoutes;