import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import type { MemberRole } from '../types/db';

interface MemberRow {
  user_id: string;
  role: MemberRole;
  name: string;
  email: string;
}
interface InviteRow {
  id: string;
  email: string;
  role: MemberRole;
}

const ROLE_LABEL: Record<MemberRole, string> = {
  owner: 'Owner',
  manager: 'Manager',
  counter: 'Counter staff',
  kitchen: 'Kitchen',
};

export default function Team() {
  const { restaurant, role: myRole } = useRestaurant();
  const { session } = useAuth();
  const myId = session?.user.id;
  const isOwner = myRole === 'owner';
  const assignable: MemberRole[] = isOwner ? ['manager', 'counter', 'kitchen'] : ['counter', 'kitchen'];

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('counter');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, i] = await Promise.all([
      supabase.from('restaurant_members').select('user_id, role').eq('restaurant_id', restaurant.id).order('created_at'),
      supabase.from('staff_invites').select('id, email, role').eq('restaurant_id', restaurant.id).order('created_at'),
    ]);
    if (m.error || i.error) {
      setError('Could not load your team.');
      setLoading(false);
      return;
    }
    const ids = (m.data ?? []).map((r) => r.user_id as string);
    const p = ids.length ? await supabase.from('profiles').select('id, full_name, email').in('id', ids) : { data: [] };
    const profiles = new Map((p.data ?? []).map((x) => [x.id as string, x as { full_name: string; email: string | null }]));
    setMembers(
      (m.data ?? []).map((r) => ({
        user_id: r.user_id as string,
        role: r.role as MemberRole,
        name: profiles.get(r.user_id as string)?.full_name || 'Unnamed',
        email: profiles.get(r.user_id as string)?.email ?? '',
      })),
    );
    setInvites((i.data ?? []) as InviteRow[]);
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>, success?: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } = await action();
    setBusy(false);
    if (err) {
      setError(friendlyError(err.message));
      return false;
    }
    if (success) setNotice(success);
    await load();
    return true;
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error: err } = await supabase.rpc('invite_staff', { p_restaurant_id: restaurant.id, p_email: email, p_role: newRole });
    setBusy(false);
    if (err) {
      setError(friendlyError(err.message));
      return;
    }
    setNotice(
      data === 'added'
        ? 'Added to your team. They will see the restaurant next time they sign in.'
        : 'Invitation saved. Ask them to create an AssamOrder account with this exact email.',
    );
    setEmail('');
    await load();
  }

  // Owner is fixed; managers can only be changed by the owner.
  const canEdit = (target: MemberRole) => target !== 'owner' && (isOwner || target !== 'manager');

  if (loading) return <Spinner />;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Team</h1>

      <Card title="Invite staff">
        <form onSubmit={onInvite} className="space-y-4">
          <Field label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Role</span>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as MemberRole)}
              className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
            >
              {assignable.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </label>
          <ErrorNote message={error} />
          {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
          <Button type="submit" loading={busy}>Send invite</Button>
        </form>
      </Card>

      <Card title={`Members (${members.length})`}>
        <ul className="divide-y divide-stone-100">
          {members.map((m) => {
            const editable = m.user_id !== myId && canEdit(m.role);
            return (
              <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.name}{m.user_id === myId ? ' (you)' : ''}</p>
                  <p className="truncate text-sm text-stone-500">{m.email}</p>
                </div>
                {editable ? (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Role for ${m.name}`}
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        void run(() => supabase.rpc('set_member_role', { p_restaurant_id: restaurant.id, p_user_id: m.user_id, p_role: e.target.value }), 'Role updated.')
                      }
                      className="h-10 rounded-lg border border-stone-300 bg-white px-2 text-sm"
                    >
                      {[...new Set<MemberRole>([...assignable, m.role])].map((r) => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      className="h-10 px-3 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm(`Remove ${m.name} from your team? They will lose access immediately.`)) {
                          void run(() => supabase.rpc('remove_member', { p_restaurant_id: restaurant.id, p_user_id: m.user_id }), 'Member removed.');
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{ROLE_LABEL[m.role]}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {invites.length > 0 && (
        <Card title="Pending invitations">
          <ul className="divide-y divide-stone-100">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-sm text-stone-500">{ROLE_LABEL[inv.role]} - waiting for sign up</p>
                </div>
                {(isOwner || inv.role !== 'manager') && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    className="h-10 px-3 text-red-700 hover:bg-red-50"
                    onClick={() => void run(() => supabase.rpc('cancel_invite', { p_invite_id: inv.id }), 'Invitation cancelled.')}
                  >
                    Cancel
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
