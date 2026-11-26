import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingScreen from './LoadingScreen.jsx';

export default function ProtectedRoute({ adminOnly = false }) {
  const { loading, profileLoading, session, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || profileLoading) return <LoadingScreen label="Checking your session…" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
