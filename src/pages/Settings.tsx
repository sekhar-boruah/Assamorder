import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { supabase } from '../lib/supabase';
import type { OpeningHours, RestaurantSettings } from '../types/db';

const DAYS: [string, string][] = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
];

function normalizeHours(saved: OpeningHours | null): OpeningHours {
  const out: OpeningHours = {};
  for (const [key] of DAYS) {
    out[key] = saved?.[key] ?? { closed: false, open: '09:00', close: '22:00' };
  }
  return out;
}

export default function Settings() {
  const { restaurant } = useRestaurant();
  const [s, setS] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let off = false;
    supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .single()
      .then(({ data, error: err }) => {
        if (off) return;
        if (err || !data) setError('Could not load settings.');
        else setS({ ...(data as RestaurantSettings), opening_hours: normalizeHours((data as RestaurantSettings).opening_hours) });
        setLoading(false);
      });
    return () => {
      off = true;
    };
  }, [restaurant.id]);

  if (loading) return <Spinner />;
  if (!s) return <ErrorNote message={error ?? 'Settings not found.'} />;

  const set = (patch: Partial<RestaurantSettings>) => {
    setSaved(false);
    setS({ ...s, ...patch });
  };
  const setDay = (day: string, patch: Partial<OpeningHours[string]>) =>
    set({ opening_hours: { ...s.opening_hours, [day]: { ...s.opening_hours[day], ...patch } } });

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    if (!s.accepts_dine_in && !s.accepts_takeaway) {
      setError('Turn on at least one ordering method.');
      return;
    }
    if (s.gst_percent < 0 || s.gst_percent > 28 || Number.isNaN(s.gst_percent)) {
      setError('GST must be between 0 and 28.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: err } = await supabase
      .from('restaurant_settings')
      .update({
        default_language: s.default_language,
        gst_mode: s.gst_mode,
        gst_percent: s.gst_percent,
        opening_hours: s.opening_hours,
        accepts_dine_in: s.accepts_dine_in,
        accepts_takeaway: s.accepts_takeaway,
      })
      .eq('restaurant_id', restaurant.id);
    setSaving(false);
    if (err) setError(err.message);
    else setSaved(true);
  }

  const selectClass = 'h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20';

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <form onSubmit={onSave} className="space-y-5">
        <Card title="Ordering">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-amber-700" checked={s.accepts_dine_in} onChange={(e) => set({ accepts_dine_in: e.target.checked })} />
              Accept dine-in orders (table QR codes)
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-amber-700" checked={s.accepts_takeaway} onChange={(e) => set({ accepts_takeaway: e.target.checked })} />
              Accept takeaway orders
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Default menu language</span>
              <select className={selectClass} value={s.default_language} onChange={(e) => set({ default_language: e.target.value as RestaurantSettings['default_language'] })}>
                <option value="en">English</option>
                <option value="as">Assamese</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
          </div>
        </Card>

        <Card title="GST">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Prices are</span>
              <select className={selectClass} value={s.gst_mode} onChange={(e) => set({ gst_mode: e.target.value as 'inclusive' | 'separate' })}>
                <option value="inclusive">Inclusive of GST</option>
                <option value="separate">GST added separately</option>
              </select>
            </label>
            <Field
              label="GST %"
              type="number"
              inputMode="decimal"
              min={0}
              max={28}
              step="0.5"
              value={Number.isNaN(s.gst_percent) ? '' : s.gst_percent}
              onChange={(e) => set({ gst_percent: e.target.value === '' ? NaN : Number(e.target.value) })}
            />
          </div>
        </Card>

        <Card title="Opening hours">
          <div className="space-y-3">
            {DAYS.map(([key, label]) => {
              const d = s.opening_hours[key];
              return (
                <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="w-24 text-sm font-medium">{label}</span>
                  <label className="flex items-center gap-2 text-sm text-stone-600">
                    <input type="checkbox" className="h-5 w-5 accent-amber-700" checked={d.closed} onChange={(e) => setDay(key, { closed: e.target.checked })} />
                    Closed
                  </label>
                  {!d.closed && (
                    <>
                      <input type="time" aria-label={`${label} opens`} value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="h-10 rounded-lg border border-stone-300 px-2" />
                      <span className="text-stone-400">to</span>
                      <input type="time" aria-label={`${label} closes`} value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="h-10 rounded-lg border border-stone-300 px-2" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-stone-500">If closing time is earlier than opening time, it means after midnight.</p>
        </Card>

        <ErrorNote message={error} />
        {saved && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</p>}
        <Button type="submit" loading={saving} className="w-full sm:w-auto">Save settings</Button>
      </form>
    </>
  );
}
