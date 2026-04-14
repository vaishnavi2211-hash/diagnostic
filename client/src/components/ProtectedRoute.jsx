import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SkeletonPage } from './Skeleton.jsx';

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <SkeletonPage />;
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'lab' ? '/lab' : '/patient'} replace />;
  }
  return children;
}
