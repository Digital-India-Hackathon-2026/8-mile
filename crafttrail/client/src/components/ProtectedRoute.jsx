import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // Render nothing rather than bouncing a signed-in user to /signin
  // in the moment before /me resolves.
  if (loading) return null;
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/home" replace />;
  return children;
}
