import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LangTabs } from '../components/LangTabs';
import { Button, Card, ErrorNote, Field, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { resizeToWebp } from '../lib/image';
import { displayName, emptyI18n, fromJson, paiseToRupees, rupeesToPaise, toI18n } from '../lib/menu';
import { assetUrl, removeAsset, uploadRestaurantImage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { I18n, Lang } from '../types/db';

interface Opt { key: string; id?: string; names: I18n; price: string; is_available: boolean }
let seq = 0;
const nextKey = () => `opt${++seq}`;

function buildOpts(list: Opt[], what: string): { rows: unknown[]; error?: string; min?: number } {
  const rows: unknown[] = [];
  let min: number | undefined;
  for (const o of list) {
    const paise = rupeesToPaise(o.price);
    if (!o.names.en.trim()) return { rows, error: `Every ${what} needs an English name.` };
    if (paise === null) return { rows, error: `Enter a valid price for each ${what}.` };
    min = min === undefined ? paise : Math.min(min, paise);
    rows.push({ id: o.id ?? null, names: o.names, price_paise: paise, is_available: o.is_available });
  }
  return { rows, min };
}

function OptionList({ items, onChange, lang, what, pricePlaceholder }: { items: Opt[]; onChange: (l: Opt[]) => void; lang: Lang; what: string; pricePlaceholder: string }) {
  const update = (key: string, patch: Partial<Opt>) => onChange(items.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  const box = 'h-11 rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20';
  return (
    <div className="space-y-3">
      {items.map((o) => (
        <div key={o.key} className="space-y-2 rounded-xl border border-stone-200 p-3">
          <input aria-label={`${what} name`} placeholder={`${what} name (${lang === 'en' ? 'English, required' : lang === 'as' ? 'Assamese' : 'Hindi'})`} value={o.names[lang]} maxLength={60} onChange={(e) => update(o.key, { names: { ...o.names, [lang]: e.target.value } })} className={`${box} w-full`} />
          <div className="flex items-center gap-3">
            <input aria-label={`${what} price`} inputMode="decimal" placeholder={pricePlaceholder} value={o.price} onChange={(e) => update(o.key, { price: e.target.value })} className={`${box} w-32`} />
            <label className="flex items-center gap-1.5 text-sm text-stone-600">
              <input type="checkbox" className="h-4 w-4 accent-amber-700" checked={o.is_available} onChange={(e) => update(o.key, { is_available: e.target.checked })} />
              Available
            </label>
            <button type="button" className="ml-auto text-sm font-semibold text-red-700" onClick={() => onChange(items.filter((x) => x.key !== o.key))}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ItemEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { restaurant } = useRestaurant();

  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [categoryId, setCategoryId] = useState(search.get('category') ?? '');
  const [names, setNames] = useState<I18n>(emptyI18n());
  const [descs, setDescs] = useState<I18n>(emptyI18n());
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const originalImage = useRef<string | null>(null);
  const [variants, setVariants] = useState<Opt[]>([]);
  const [addons, setAddons] = useState<Opt[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const rid = restaurant.id;
      const [c, ct] = await Promise.all([
        supabase.from('categories').select('id, sort_order').eq('restaurant_id', rid).order('sort_order'),
        supabase.from('category_translations').select('category_id, lang, name').eq('restaurant_id', rid),
      ]);
      if (off) return;
      if (c.error || ct.error) {
        setError('Could not load categories.');
        setLoading(false);
        return;
      }
      const list = (c.data ?? []).map((r) => ({
        id: r.id as string,
        name: displayName(toI18n(((ct.data ?? []) as { lang: string; category_id: string }[]).filter((t) => t.category_id === r.id), 'name')),
      }));
      setCats(list);
      if (isNew) {
        setCategoryId((prev) => prev || list[0]?.id || '');
        setLoading(false);
        return;
      }
      const [it, tr, va, ad] = await Promise.all([
        supabase.from('menu_items').select('category_id, price_paise, is_veg, is_available, image_path').eq('id', id).eq('restaurant_id', rid).maybeSingle(),
        supabase.from('menu_item_translations').select('lang, name, description').eq('item_id', id),
        supabase.from('item_variants').select('id, names, price_paise, is_available').eq('item_id', id).order('sort_order'),
        supabase.from('item_addons').select('id, names, price_paise, is_available').eq('item_id', id).order('sort_order'),
      ]);
      if (off) return;
      if (it.error || !it.data) {
        setError('Item not found.');
        setLoading(false);
        return;
      }
      const trRows = (tr.data ?? []) as { lang: string }[];
      setCategoryId(it.data.category_id);
      setPrice(paiseToRupees(it.data.price_paise));
      setIsVeg(it.data.is_veg);
      setIsAvailable(it.data.is_available);
      setImagePath(it.data.image_path);
      originalImage.current = it.data.image_path;
      setNames(toI18n(trRows, 'name'));
      setDescs(toI18n(trRows, 'description'));
      const toOpt = (r: { id: string; names: unknown; price_paise: number; is_available: boolean }): Opt => ({
        key: nextKey(), id: r.id, names: fromJson(r.names), price: paiseToRupees(r.price_paise), is_available: r.is_available,
      });
      setVariants((va.data ?? []).map(toOpt));
      setAddons((ad.data ?? []).map(toOpt));
      setLoading(false);
    })();
    return () => {
      off = true;
    };
  }, [id, isNew, restaurant.id]);

  async function onImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeToWebp(file, 800, 0.8);
      const path = await uploadRestaurantImage(restaurant.id, 'item', blob);
      const previous = imagePath;
      setImagePath(path);
      if (previous && previous !== originalImage.current) await removeAsset(previous);
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!categoryId) return setError('Choose a category.');
    if (!names.en.trim()) {
      setLang('en');
      return setError('Enter the English name.');
    }
    const v = buildOpts(variants, 'size');
    if (v.error) return setError(v.error);
    const a = buildOpts(addons, 'add-on');
    if (a.error) return setError(a.error);
    const base = variants.length > 0 ? v.min : rupeesToPaise(price);
    if (base === null || base === undefined) return setError('Enter a valid price (for example 120 or 99.50).');

    setSaving(true);
    const { error: err } = await supabase.rpc('save_menu_item', {
      p_restaurant_id: restaurant.id,
      p_item: {
        id: isNew ? null : id,
        category_id: categoryId,
        price_paise: base,
        is_veg: isVeg,
        is_available: isAvailable,
        image_path: imagePath,
        names,
        descriptions: descs,
        variants: v.rows,
        addons: a.rows,
      },
    });
    setSaving(false);
    if (err) return setError(friendlyError(err.message));
    if (originalImage.current && originalImage.current !== imagePath) await removeAsset(originalImage.current);
    navigate('/dashboard/menu');
  }

  async function onDelete() {
    if (isNew || !window.confirm('Delete this item? This cannot be undone.')) return;
    const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
    if (err) return setError(friendlyError(err.message));
    if (originalImage.current) await removeAsset(originalImage.current);
    navigate('/dashboard/menu');
  }

  if (loading) return <Spinner />;
  if (cats.length === 0) {
    return (
      <Card>
        <p className="font-semibold">Create a category first</p>
        <p className="mt-1 text-sm text-stone-600">Items live inside categories such as Starters or Drinks.</p>
        <Link to="/dashboard/menu/category/new" className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline">Add a category</Link>
      </Card>
    );
  }

  const img = assetUrl(imagePath);
  const selectClass = 'h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20';
  const htmlLang = lang === 'as' ? 'as' : lang === 'hi' ? 'hi' : 'en';

  return (
    <>
      <Link to="/dashboard/menu" className="text-sm font-medium text-stone-600 hover:underline">&larr; Back to menu</Link>
      <h1 className="text-2xl font-bold tracking-tight">{isNew ? 'New item' : 'Edit item'}</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <Card title="Name and description">
          <LangTabs value={lang} onChange={setLang} filled={names} />
          <div className="space-y-4">
            <Field label={lang === 'en' ? 'Name (required)' : 'Name'} lang={htmlLang} value={names[lang]} maxLength={100} onChange={(e) => setNames({ ...names, [lang]: e.target.value })} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Description</span>
              <textarea lang={htmlLang} value={descs[lang]} maxLength={500} onChange={(e) => setDescs({ ...descs, [lang]: e.target.value })} className="min-h-24 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20" />
            </label>
          </div>
          <p className="mt-3 text-xs text-stone-500">Customers see their chosen language, and English if a translation is missing.</p>
        </Card>

        <Card title="Basics">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Category</span>
              <select className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="flex gap-2" role="radiogroup" aria-label="Food type">
              {[true, false].map((veg) => (
                <button key={String(veg)} type="button" role="radio" aria-checked={isVeg === veg} onClick={() => setIsVeg(veg)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium ${isVeg === veg ? (veg ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-red-700 bg-red-50 text-red-800') : 'border-stone-300 text-stone-600'}`}>
                  {veg ? 'Vegetarian' : 'Non-vegetarian'}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-amber-700" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
              Available to order
            </label>
          </div>
        </Card>

        <Card title="Price">
          {variants.length === 0 ? (
            <Field label={'Price (\u20B9)'} inputMode="decimal" placeholder="e.g. 120" value={price} onChange={(e) => setPrice(e.target.value)} />
          ) : (
            <p className="text-sm text-stone-600">Customers pick a size, so the price comes from the sizes below.</p>
          )}
        </Card>

        <Card title="Sizes (optional)">
          <p className="mb-3 text-sm text-stone-600">Use this for Half / Full or Small / Large. Each size has its own full price.</p>
          <OptionList items={variants} onChange={setVariants} lang={lang} what="size" pricePlaceholder="Price" />
          <Button type="button" variant="ghost" className="mt-3" disabled={variants.length >= 10} onClick={() => setVariants([...variants, { key: nextKey(), names: emptyI18n(), price: '', is_available: true }])}>+ Add size</Button>
        </Card>

        <Card title="Add-ons (optional)">
          <p className="mb-3 text-sm text-stone-600">Extras customers can add, like extra cheese. The price is added to the item price.</p>
          <OptionList items={addons} onChange={setAddons} lang={lang} what="add-on" pricePlaceholder="Extra price" />
          <Button type="button" variant="ghost" className="mt-3" disabled={addons.length >= 20} onClick={() => setAddons([...addons, { key: nextKey(), names: emptyI18n(), price: '', is_available: true }])}>+ Add add-on</Button>
        </Card>

        <Card title="Photo">
          {img && <img src={img} alt="" className="mb-3 h-40 w-40 rounded-xl object-cover" />}
          <input type="file" accept="image/*" disabled={uploading} onChange={(e) => void onImage(e)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-4 file:py-2.5 file:font-semibold file:text-stone-700" />
          {uploading && <p className="mt-1 text-xs text-stone-500">Uploading...</p>}
          {imagePath && <button type="button" className="mt-2 text-sm font-semibold text-red-700" onClick={() => setImagePath(null)}>Remove photo</button>}
        </Card>

        <ErrorNote message={error} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} disabled={uploading}>Save item</Button>
          {!isNew && <Button type="button" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => void onDelete()}>Delete item</Button>}
        </div>
      </form>
    </>
  );
}
