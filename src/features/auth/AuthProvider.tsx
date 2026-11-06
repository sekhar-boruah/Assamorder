import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Membership, MemberRole, RestaurantSummary } from '../../types/db';

interface AuthState {
  session: Session | null;
  loading: boolean;
  memberships: Membership[];
  isSuperAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface RawMembership {
  role: MemberRole;
  restaurants: RestaurantSummary | RestaurantSummary[] | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadAccess = useCallback(async (s: Session | null) => {
    if (!s) {
      setMemberships([]);
      setIsSuperAdmin(false);
      return;
    }
    const [m, a] = await Promise.all([
      supabase.from('restaurant_members').select('role, restaurants(id, slug, name, status)').eq('user_id', s.user.id),
      supabase.rpc('is_super_admin'),
    ]);
    const rows = (m.data ?? []) as unknown as RawMembership[];
    const list: Membership[] = [];
    for (const row of rows) {
      const r = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
      if (r) list.push({ role: row.role, restaurant: r });
    }
    setMemberships(list);
    setIsSuperAdmin(a.data === true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialised(true);
    });
    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!initialised) return;
    let cancelled = false;
    setAccessLoading(true);
    loadAccess(session).finally(() => {
      if (!cancelled) setAccessLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialised, userId, loadAccess]);

  const refresh = useCallback(() => loadAccess(session), [loadAccess, session]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, loading: !initialised || accessLoading, memberships, isSuperAdmin, refresh, signOut }),
    [session, initialised, accessLoading, memberships, isSuperAdmin, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
