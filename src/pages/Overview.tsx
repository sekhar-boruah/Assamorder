import { useEffect, useState } from 'react';
import { Card, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { supabase } from '../lib/supabase';
import type { RestaurantStatus } from '../types/db';

const STATUS_COPY: Record<RestaurantStatus, { label: string; tone: string; message: string }> = {
  pending: { label: 'Pending approval', tone: 'bg-amber-100 text-amber-800', message: 'Your restaurant is awaiting approval. We will activate it shortly.' },
  active: { label: 'Active', tone: 'bg-emerald-100 text-emerald-800', message: 'Your restaurant is live.' },
  suspended: { label: 'Suspended', tone: 'bg-red-100 text-red-800', message: 'Your restaurant is suspended. Please contact support.' },
  deactivated: { label: 'Deactivated', tone: 'bg-stone-200 text-stone-700', message: 'This restaurant has been deactivated.' },
};

export default function Overview() {
  const { restaurant, canManage } = useRestaurant();
  const [trialEnds, setTrialEnds] = useState<Date | null>(null);
  const [loading, setLoading] = useState(canManage);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setTrialEnds(data?.status === 'trial' ? new Date(data.trial_ends_at) : null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant.id, canManage]);

  if (loading) return <Spinner />;
  const status = STATUS_COPY[restaurant.status];
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <Card>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
        <p className="mt-3 text-stone-700">{status.message}</p>
        {daysLeft !== null && <p className="mt-2 text-sm text-stone-500">Free trial: {daysLeft} day{daysLeft === 1 ? '' : 's'} left</p>}
        <a href={`/r/${restaurant.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline">
          Open your public page (/r/{restaurant.slug})
        </a>
      </Card>
    </>
  );
}
