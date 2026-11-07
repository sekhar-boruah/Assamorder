import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { qrDataUrl, takeawayUrl, tableUrl } from '../lib/qr';
import { supabase } from '../lib/supabase';

interface Card { key: string; label: string; src: string }

export default function TablesPrint() {
  const { restaurant } = useRestaurant();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('restaurant_tables').select('id, label, token').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order').order('created_at');
      if (err) return !off && setError('Could not load your tables.');
      const list = [{ key: 'takeaway', label: 'Takeaway', url: takeawayUrl(restaurant.slug) }, ...(data ?? []).map((t) => ({ key: t.id as string, label: t.label as string, url: tableUrl(t.token as string) }))];
      const out = await Promise.all(list.map(async (c) => ({ key: c.key, label: c.label, src: await qrDataUrl(c.url, 600) })));
      if (!off) setCards(out);
    })().catch(() => !off && setError('Could not create the QR codes.'));
    return () => {
      off = true;
    };
  }, [restaurant.id, restaurant.slug]);

  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!cards) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link to="/dashboard/tables" className="text-sm font-medium text-stone-600 hover:underline">&larr; Back</Link>
        <Button onClick={() => window.print()}>Print or save as PDF</Button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {cards.map((c) => (
          <div key={c.key} className="break-inside-avoid rounded-2xl border-2 border-stone-300 p-5 text-center">
            <p className="text-xl font-bold">{restaurant.name}</p>
            <p className="mt-1 text-stone-600">Scan to order</p>
            <img src={c.src} alt="" className="mx-auto mt-3 w-full max-w-[260px]" />
            <p className="mt-2 text-3xl font-bold">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
