import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ErrorNote, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { composeCardPng, publicBaseUrl, qrDataUrl, saveBlob, takeawayUrl, tableUrl } from '../lib/qr';
import { supabase } from '../lib/supabase';

interface TableRow { id: string; label: string; token: string; is_active: boolean; sort_order: number }

function QrThumb({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    void qrDataUrl(url, 240).then((s) => !off && setSrc(s));
    return () => {
      off = true;
    };
  }, [url]);
  return src ? <img src={src} alt="QR code" className="h-24 w-24 shrink-0" /> : <div className="h-24 w-24 shrink-0 animate-pulse rounded bg-stone-100" />;
}

export default function Tables() {
  const { restaurant } = useRestaurant();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [color, setColor] = useState('#B45309');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState('5');
  const [named, setNamed] = useState('');

  const load = useCallback(async () => {
    const [t, b] = await Promise.all([
      supabase.from('restaurant_tables').select('id, label, token, is_active, sort_order').eq('restaurant_id', restaurant.id).order('sort_order').order('created_at'),
      supabase.from('restaurant_branding').select('primary_color').eq('restaurant_id', restaurant.id).maybeSingle(),
    ]);
    if (t.error) setError('Could not load your tables.');
    else setTables(t.data as TableRow[]);
    if (b.data?.primary_color) setColor(b.data.primary_color);
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(job: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true);
    setError(null);
    const { error: err } = await job();
    setBusy(false);
    if (err) setError(friendlyError(err.message));
    await load();
  }

  const nextOrder = () => tables.reduce((m, x) => Math.max(m, x.sort_order), 0) + 1;

  async function addMany() {
    const n = Math.floor(Number(count));
    if (!Number.isFinite(n) || n < 1 || n > 50) return setError('Enter a number from 1 to 50.');
    const highest = tables.reduce((m, x) => {
      const hit = /^Table (\d+)$/.exec(x.label);
      return hit ? Math.max(m, Number(hit[1])) : m;
    }, 0);
    const base = nextOrder();
    const rows = Array.from({ length: n }, (_, i) => ({ restaurant_id: restaurant.id, label: `Table ${highest + i + 1}`, sort_order: base + i }));
    await run(() => supabase.from('restaurant_tables').insert(rows));
  }

  async function addNamed() {
    const label = named.trim();
    if (!label) return setError('Enter a table name, for example Garden 1.');
    await run(() => supabase.from('restaurant_tables').insert({ restaurant_id: restaurant.id, label, sort_order: nextOrder() }));
    setNamed('');
  }

  async function regenerate(t: TableRow) {
    if (!window.confirm(`Create a new QR code for ${t.label}? The printed one will stop working immediately.`)) return;
    await run(() => supabase.rpc('regenerate_table_token', { p_table_id: t.id }));
  }

  async function remove(t: TableRow) {
    if (!window.confirm(`Delete ${t.label}? Its QR code will stop working.`)) return;
    await run(() => supabase.from('restaurant_tables').delete().eq('id', t.id));
  }

  async function download(name: string, label: string, url: string, file: string) {
    try {
      saveBlob(await composeCardPng({ name, heading: 'Scan to order', label, url, color }), file);
    } catch {
      setError('Could not create the image on this device.');
    }
  }

  if (loading) return <Spinner />;

  const input = 'h-11 rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20';

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tables and QR codes</h1>
        <Link to="/dashboard/tables/print" className="inline-flex h-11 items-center rounded-xl border border-stone-300 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-100">Print all</Link>
      </div>
      <ErrorNote message={error} />
      <p className="text-sm text-stone-500">QR codes open <span className="font-medium">{publicBaseUrl()}</span>. If you will use a different web address, set it before printing.</p>

      <Card title="Takeaway QR (no table)">
        <div className="flex items-center gap-4">
          <QrThumb url={takeawayUrl(restaurant.slug)} />
          <div className="min-w-0">
            <p className="text-sm text-stone-600">Put this at the counter, on bills or on social media. It opens your menu.</p>
            <Button variant="ghost" className="mt-2 px-0" onClick={() => void download(restaurant.name, 'Takeaway', takeawayUrl(restaurant.slug), `${restaurant.slug}-takeaway.png`)}>Download image</Button>
          </div>
        </div>
      </Card>

      <Card title="Add tables">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">How many tables</span>
            <input inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className={`${input} w-24`} />
          </label>
          <Button disabled={busy} onClick={() => void addMany()}>Add tables</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Or add one with a name</span>
            <input value={named} maxLength={30} onChange={(e) => setNamed(e.target.value)} placeholder="Garden 1" className={`${input} w-full`} />
          </label>
          <Button variant="ghost" disabled={busy} onClick={() => void addNamed()}>Add</Button>
        </div>
      </Card>

      {tables.length === 0 ? (
        <Card><p className="text-sm text-stone-600">No tables yet. Add your tables above to get a QR code for each one.</p></Card>
      ) : (
        <div className="space-y-3">
          {tables.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start gap-4">
                <QrThumb url={tableUrl(t.token)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    key={t.label}
                    defaultValue={t.label}
                    maxLength={30}
                    aria-label="Table name"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== t.label) void run(() => supabase.from('restaurant_tables').update({ label: v }).eq('id', t.id));
                      else e.target.value = t.label;
                    }}
                    className={`${input} w-full font-semibold`}
                  />
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input type="checkbox" className="h-4 w-4 accent-amber-700" checked={t.is_active} disabled={busy}
                      onChange={(e) => void run(() => supabase.from('restaurant_tables').update({ is_active: e.target.checked }).eq('id', t.id))} />
                    Active (customers can scan it)
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                    <button className="text-amber-700" onClick={() => void download(restaurant.name, t.label, tableUrl(t.token), `${restaurant.slug}-${t.label}.png`)}>Download</button>
                    <button className="text-stone-600" onClick={() => void regenerate(t)}>New QR</button>
                    <button className="text-red-700" onClick={() => void remove(t)}>Delete</button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
