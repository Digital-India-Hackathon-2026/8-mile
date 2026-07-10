import { useAuth } from '../lib/auth.jsx';
import { Navigate } from 'react-router-dom';
import SavedVisitedMap from '../components/SavedVisitedMap.jsx';
import './Journey.css';

export default function Journey() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/signin" state={{ from: '/journey' }} replace />;

  return (
    <div className="journey-shell">
      <div className="journey-inner">
        <SavedVisitedMap />
      </div>
    </div>
  );
}
