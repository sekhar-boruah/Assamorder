import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button, Card, ErrorNote, Field, Spinner, TextArea } from '../components/ui';
import { useAuth } from '../features/auth/AuthProvider';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { resizeToWebp } from '../lib/image';
import { assetUrl, removeAsset, uploadRestaurantImage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { Branding as BrandingRow } from '../types/db';

const msg = (err: unknown) => (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Something went wrong.');

export default function Branding() {
  const { restaurant } = useRestaurant();
  const { refresh } = useAuth();
  const [b, setB] = useState<BrandingRow | null>(null);
  const [name, setName] = useState(restaurant.name);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let off = false;
    supabase
      .from('restaurant_branding')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .single()
      .then(({ data, error: err }) => {
        if (off) return;
        if (err || !data) setError('Could not load branding.');
        else setB(data as BrandingRow);
        setLoading(false);
      });
    return () => {
      off = true;
    };
  }, [restaurant.id]);

  if (loading) return <Spinner />;
  if (!b) return <ErrorNote message={error ?? 'Branding not found.'} />;

  const set = (patch: Partial<BrandingRow>) => {
    setSaved(false);
    setB({ ...b, ...patch });
  };

  async function onImage(kind: 'logo' | 'cover', e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !b) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setUploading(kind);
    setError(null);
    try {
      const blob = await resizeToWebp(file, kind === 'logo' ? 512 : 1600);
      const path = await uploadRestaurantImage(restaurant.id, kind, blob);
      const column = kind === 'logo' ? 'logo_path' : 'cover_path';
      const old = b[column];
      const { error: err } = await supabase.from('restaurant_branding').update({ [column]: path }).eq('restaurant_id', restaurant.id);
      if (err) {
        await removeAsset(path);
        throw err;
      }
      if (old) await removeAsset(old);
      setB({ ...b, [column]: path });
    } catch (err) {
      setError(msg(err));
    } finally {
      setUploading(null);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!b) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Restaurant name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    if (trimmed !== restaurant.name) {
      const { error: e1 } = await supabase.from('restaurants').update({ name: trimmed }).eq('id', restaurant.id);
      if (e1) {
        setSaving(false);
        setError(msg(e1));
        return;
      }
    }
    const { error: e2 } = await supabase
      .from('restaurant_branding')
      .update({
        description: b.description?.trim() || null,
        address: b.address?.trim() || null,
        contact_phone: b.contact_phone?.trim() || null,
        primary_color: b.primary_color,
        secondary_color: b.secondary_color,
      })
      .eq('restaurant_id', restaurant.id);
    if (e2) {
      setSaving(false);
      setError(e2.message.includes('contact_phone') ? 'Enter a valid phone number.' : msg(e2));
      return;
    }
    await refresh();
    setSaving(false);
    setSaved(true);
  }

  const logo = assetUrl(b.logo_path);
  const cover = assetUrl(b.cover_path);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Branding</h1>

      <Card title="Preview">
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="h-28 bg-cover bg-center" style={{ backgroundColor: b.secondary_color, backgroundImage: cover ? `url(${cover})` : undefined }} />
          <div className="px-4 pb-4">
            <div
              className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white text-2xl font-bold text-white"
              style={{ backgroundColor: b.primary_color }}
            >
              {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : name.trim().charAt(0).toUpperCase() || 'A'}
            </div>
            <p className="mt-2 text-lg font-bold">{name || 'Restaurant name'}</p>
            {b.description && <p className="mt-1 text-sm text-stone-600">{b.description}</p>}
            <span className="mt-3 inline-block rounded-full px-4 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: b.primary_color }}>
              Order now
            </span>
          </div>
        </div>
      </Card>

      <Card title="Images">
        <div className="grid gap-4 sm:grid-cols-2">
          {(['logo', 'cover'] as const).map((kind) => (
            <label key={kind} className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">{kind === 'logo' ? 'Logo (square)' : 'Cover image (wide)'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading !== null}
                onChange={(e) => void onImage(kind, e)}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-4 file:py-2.5 file:font-semibold file:text-stone-700"
              />
              {uploading === kind && <span className="mt-1 block text-xs text-stone-500">Uploading...</span>}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">Images are resized automatically. Changes to images are saved immediately.</p>
      </Card>

      <form onSubmit={onSave} className="space-y-5">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Restaurant name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <TextArea label="Description" value={b.description ?? ''} onChange={(e) => set({ description: e.target.value })} maxLength={500} />
            <Field label="Address" value={b.address ?? ''} onChange={(e) => set({ address: e.target.value })} maxLength={200} />
            <Field label="Contact phone" type="tel" value={b.contact_phone ?? ''} onChange={(e) => set({ contact_phone: e.target.value })} />
          </div>
        </Card>

        <Card title="Colours">
          <div className="grid grid-cols-2 gap-4">
            {([['primary_color', 'Primary'], ['secondary_color', 'Secondary']] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
                <input type="color" value={b[key]} onChange={(e) => set({ [key]: e.target.value })} className="h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white p-1" />
              </label>
            ))}
          </div>
        </Card>

        <ErrorNote message={error} />
        {saved && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</p>}
        <Button type="submit" loading={saving} className="w-full sm:w-auto">Save changes</Button>
      </form>
    </>
  );
}
