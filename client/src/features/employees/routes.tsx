import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const List = lazy(() => import('./pages/List'));
const employeesRoutes: RouteObject[] = [
  {
    path: '/employee/list',
    element: <List />
  }
];
export default employeesRoutes;