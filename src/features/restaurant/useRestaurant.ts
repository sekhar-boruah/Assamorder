import { useAuth } from '../auth/AuthProvider';

/** The restaurant the signed-in user is working in (first membership for now). Only use inside RequireRestaurant. */
export function useRestaurant() {
  const { memberships } = useAuth();
  const current = memberships[0];
  return {
    restaurant: current.restaurant,
    role: current.role,
    canManage: current.role === 'owner' || current.role === 'manager',
  };
}
