import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const LoginPage = lazy(() => import('./pages/Login.jsx'));

const authRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />

  },

];

export default authRoutes;