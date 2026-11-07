import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../../components/ui';
import { useAuth } from './AuthProvider';

/** Requires a signed-in user. */
export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Requires the user to belong to at least one restaurant; otherwise sends them to onboarding. */
export function RequireRestaurant() {
  const { memberships, loading } = useAuth();
  if (loading) return <Spinner />;
  if (memberships.length === 0) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Owner or manager only. Staff roles are sent back to the overview. */
export function RequireManager() {
  const { memberships } = useAuth();
  const role = memberships[0]?.role;
  if (role !== 'owner' && role !== 'manager') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** Requires a super admin. (Used from Phase 7.) */
export function RequireSuperAdmin() {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
