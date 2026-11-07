import { useCallback, useEffect, useState } from 'react';
import { Button, Card, ErrorNote, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { formatPrice } from '../lib/menu';
import { pick } from '../lib/publicApi';
import { supabase } from '../lib/supabase';
import type { I18n, OrderStatus } from '../types/db';

interface ItemRow {
  order_id: string; item_names: Partial<I18n>; variant_names: Partial<I18n> | null;
  addons: { names: Partial<I18n> }[]; quantity: number; line_total_paise: number; instructions: string | null;
}
interface OrderRow {
  id: string; order_number: number; order_type: 'dine_in' | 'takeaway'; table_label: string | null;
  customer_name: string | null; customer_phone: string | null; notes: string | null; status: OrderStatus;
  total_paise: number; payment_method: 'cash' | 'upi'; payment_status: 'unpaid' | 'paid';
  cancel_reason: string | null; created_at: string; items: ItemRow[];
}

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  accepted: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'completed', label: 'Complete' },
};
const TONE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900', accepted: 'bg-sky-100 text-sky-900', preparing: 'bg-indigo-100 text-indigo-900',
  ready: 'bg-emerald-100 text-emerald-900', completed: 'bg-stone-200 text-stone-700', cancelled: 'bg-red-100 text-red-800',
};
const ACTIVE: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];

function ago(iso: string): string {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ${m % 60} min ago`;
}

export default function Orders() {
  const { restaurant, role } = useRestaurant();
  const canPay = role === 'owner' || role === 'manager' || role === 'counter';
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const o = await supabase
      .from('orders')
      .select('id, order_number, order_type, table_label, customer_name, customer_phone, notes, status, total_paise, payment_method, payment_status, cancel_reason, created_at')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200);
    if (o.error) {
      setError('Could not load orders. Check your connection.');
      setLoading(false);
      return;
    }
    const ids = (o.data ?? []).map((x) => x.id as string);
    const it = ids.length
      ? await supabase.from('order_items').select('order_id, item_names, variant_names, addons, quantity, line_total_paise, instructions').in('order_id', ids).order('id')
      : { data: [], error: null };
    if (it.error) {
      setError('Could not load order items.');
      setLoading(false);
      return;
    }
    const byOrder = new Map<string, ItemRow[]>();
    for (const row of (it.data ?? []) as ItemRow[]) byOrder.set(row.order_id, [...(byOrder.get(row.order_id) ?? []), row]);
    setOrders((o.data ?? []).map((x) => ({ ...(x as Omit<OrderRow, 'items'>), items: byOrder.get(x.id as string) ?? [] })));
    setError(null);
    setUpdated(new Date());
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [load]);

  async function act(orderId: string, job: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusyId(orderId);
    setError(null);
    const { error: err } = await job();
    setBusyId(null);
    if (err) setError(friendlyError(err.message));
    await load();
  }

  const setStatus = (id: string, status: OrderStatus, note?: string) =>
    act(id, () => supabase.rpc('update_order_status', { p_order_id: id, p_status: status, p_note: note ?? null }));
  const markPaid = (id: string, method: 'cash' | 'upi') => act(id, () => supabase.rpc('mark_order_paid', { p_order_id: id, p_method: method }));

  function reject(o: OrderRow) {
    const reason = window.prompt(`Reject order #${o.order_number}? Optional reason for the customer:`, '');
    if (reason === null) return;
    void setStatus(o.id, 'cancelled', reason);
  }

  if (loading) return <Spinner />;
  const shown = orders.filter((o) => (tab === 'active' ? ACTIVE.includes(o.status) : !ACTIVE.includes(o.status)));
  const activeCount = orders.filter((o) => ACTIVE.includes(o.status)).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <Button variant="ghost" onClick={() => void load()}>Refresh</Button>
      </div>
      <p className="text-xs text-stone-500">Updates every 10 seconds{updated ? ` \u00B7 last checked ${updated.toLocaleTimeString()}` : ''}. Live alerts with sound come next.</p>
      <ErrorNote message={error} />

      <div role="tablist" className="flex gap-1 rounded-xl bg-stone-100 p-1">
        {(['active', 'done'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === k ? 'bg-white shadow-sm' : 'text-stone-600'}`}>
            {k === 'active' ? `Active (${activeCount})` : 'Completed / cancelled'}
          </button>
        ))}
      </div>

      {shown.length === 0 && <Card><p className="text-sm text-stone-600">{tab === 'active' ? 'No active orders right now.' : 'Nothing here yet (last 48 hours).'}</p></Card>}

      {shown.map((o) => {
        const next = NEXT[o.status];
        const busy = busyId === o.id;
        return (
          <Card key={o.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xl font-bold">#{o.order_number} <span className="text-base font-medium text-stone-500">{o.order_type === 'dine_in' ? o.table_label : 'Takeaway'}</span></p>
                <p className="text-sm text-stone-500">{ago(o.created_at)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${TONE[o.status]}`}>{o.status}</span>
            </div>

            <ul className="mt-3 space-y-1.5 text-sm">
              {o.items.map((it, i) => (
                <li key={i}>
                  <span className="font-semibold">{it.quantity} &times; {pick(it.item_names, 'en')}</span>
                  {it.variant_names && <span> ({pick(it.variant_names, 'en')})</span>}
                  {it.addons.length > 0 && <span className="text-stone-600"> + {it.addons.map((a) => pick(a.names, 'en')).join(', ')}</span>}
                  {it.instructions && <p className="text-amber-800">Note: {it.instructions}</p>}
                </li>
              ))}
            </ul>
            {o.notes && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Order note: {o.notes}</p>}
            {o.order_type === 'takeaway' && (
              <p className="mt-2 text-sm text-stone-600">{o.customer_name} &middot; <a className="font-medium underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a></p>
            )}
            {o.status === 'cancelled' && o.cancel_reason && <p className="mt-2 text-sm text-red-700">Reason: {o.cancel_reason}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
              <p className="text-sm">
                <span className="text-base font-bold">{formatPrice(o.total_paise)}</span>{' '}
                <span className={o.payment_status === 'paid' ? 'font-semibold text-emerald-700' : 'text-stone-500'}>
                  {o.payment_status === 'paid' ? 'Paid' : `Unpaid (customer chose ${o.payment_method === 'upi' ? 'UPI' : 'cash'})`}
                </span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === 'pending' && (
                <>
                  <Button disabled={busy} onClick={() => void setStatus(o.id, 'accepted')}>Accept</Button>
                  <Button variant="ghost" disabled={busy} className="text-red-700 hover:bg-red-50" onClick={() => reject(o)}>Reject</Button>
                </>
              )}
              {next && <Button disabled={busy} onClick={() => void setStatus(o.id, next.to)}>{next.label}</Button>}
              {(o.status === 'accepted' || o.status === 'preparing') && (
                <Button variant="ghost" disabled={busy} className="text-red-700 hover:bg-red-50" onClick={() => reject(o)}>Cancel</Button>
              )}
              {canPay && o.payment_status === 'unpaid' && o.status !== 'cancelled' && (
                <>
                  <Button variant="ghost" disabled={busy} onClick={() => void markPaid(o.id, 'cash')}>Paid: cash</Button>
                  <Button variant="ghost" disabled={busy} onClick={() => void markPaid(o.id, 'upi')}>Paid: UPI</Button>
                </>
              )}
            </div>
          </Card>
        );
      })}
    </>
  );
}
