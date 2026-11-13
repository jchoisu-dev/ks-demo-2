import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const Main = lazy(() => import('./page'));
const holidaysRoutes: RouteObject[] = [
  {
    path: '/settings/holidays/list',
    element: <Main />
  }
];
export default holidaysRoutes;