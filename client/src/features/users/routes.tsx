import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
const UsersPage = lazy(() => import('./pages/Users'));
const usersRoutes: RouteObject[] = [
  {
    path: '/settings/users',
    element: <UsersPage />
  }
];
export default usersRoutes;
