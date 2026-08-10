import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

export function ProtectedRoute() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
