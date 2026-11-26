import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'));
const DashboardPage = lazy(() => import('../pages/DashboardPage.jsx'));
const TasksPage = lazy(() => import('../pages/TasksPage.jsx'));
const HabitsPage = lazy(() => import('../pages/HabitsPage.jsx'));
const TimerPage = lazy(() => import('../pages/TimerPage.jsx'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage.jsx'));
const RewardsPage = lazy(() => import('../pages/RewardsPage.jsx'));
const ProfilePage = lazy(() => import('../pages/ProfilePage.jsx'));
const AdminPage = lazy(() => import('../pages/admin/AdminPage.jsx'));

const page = (element) => <Suspense fallback={<LoadingScreen label="Loading page…" />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: page(<DashboardPage />) },
          { path: 'tasks', element: page(<TasksPage />) },
          { path: 'habits', element: page(<HabitsPage />) },
          { path: 'timer', element: page(<TimerPage />) },
          { path: 'analytics', element: page(<AnalyticsPage />) },
          { path: 'rewards', element: page(<RewardsPage />) },
          { path: 'profile', element: page(<ProfilePage />) },
          {
            element: <ProtectedRoute adminOnly />,
            children: [
              { path: 'admin', element: page(<AdminPage />) },
            ],
          },
        ],
      },
    ],
  },
  { index: true, element: <LandingPage /> },
  { path: 'login', element: page(<LoginPage />) },
  { path: 'register', element: page(<RegisterPage />) },
  { path: 'forgot-password', element: page(<ForgotPasswordPage />) },
  { path: 'reset-password', element: page(<ResetPasswordPage />) },
  { path: '*', element: <NotFoundPage /> },
]);
