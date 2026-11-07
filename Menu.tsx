import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, ErrorNote, Spinner } from '../components/ui';
import { useRestaurant } from '../features/restaurant/useRestaurant';
import { friendlyError } from '../lib/errors';
import { displayName, formatPrice, toI18n } from '../lib/menu';
import { assetUrl, removeAsset } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { I18n } from '../types/db';

interface Cat { id: string; sort_order: number; is_active: boolean; names: I18n }
interface Item { id: string; category_id: string; price_paise: number; is_veg: boolean; is_available: boolean; image_path: string | null; sort_order: number; names: I18n }

type Row = { lang: string; [k: string]: unknown };
function groupBy(rows: Row[], key: string): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = String(r[key]);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}

function VegMark({ veg }: { veg: boolean }) {
  const c = veg ? 'border-emerald-700' : 'border-red-700';
  return (
    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${c}`} title={veg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span className={`h-2 w-2 rounded-full ${veg ? 'bg-emerald-700' : 'bg-red-700'}`} />
    </span>
  );
}

export default function Menu() {
  const { restaurant } = useRestaurant();
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rid = restaurant.id;
    const [c, ct, i, it] = await Promise.all([
      supabase.from('categories').select('id, sort_order, is_active').eq('restaurant_id', rid).order('sort_order'),
      supabase.from('category_translations').select('category_id, lang, name').eq('restaurant_id', rid),
      supabase.from('menu_items').select('id, category_id, price_paise, is_veg, is_available, image_path, sort_order').eq('restaurant_id', rid).order('sort_order'),
      supabase.from('menu_item_translations').select('item_id, lang, name').eq('restaurant_id', rid),
    ]);
    if (c.error || ct.error || i.error || it.error) {
      setError('Could not load your menu.');
      setLoading(false);
      return;
    }
    const catNames = groupBy((ct.data ?? []) as Row[], 'category_id');
    const itemNames = groupBy((it.data ?? []) as Row[], 'item_id');
    setCats((c.data ?? []).map((r) => ({ id: r.id, sort_order: r.sort_order, is_active: r.is_active, names: toI18n(catNames.get(r.id) ?? [], 'name') })));
    setItems(
      (i.data ?? []).map((r) => ({
        id: r.id, category_id: r.category_id, price_paise: r.price_paise, is_veg: r.is_veg,
        is_available: r.is_available, image_path: r.image_path, sort_order: r.sort_order,
        names: toI18n(itemNames.get(r.id) ?? [], 'name'),
      })),
    );
    setLoading(false);
  }, [restaurant.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reorder(table: 'categories' | 'menu_items', list: { id: string; sort_order: number }[], index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    setBusy(true);
    setError(null);
    const jobs = next
      .map((row, idx) => (row.sort_order !== idx + 1 ? supabase.from(table).update({ sort_order: idx + 1 }).eq('id', row.id) : null))
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const results = await Promise.all(jobs);
    setBusy(false);
    if (results.some((r) => r.error)) setError('Could not change the order. Please try again.');
    await load();
  }

  async function toggleAvailable(item: Item) {
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, is_available: !item.is_available } : x)));
    const { error: err } = await supabase.rpc('set_item_availability', { p_item_id: item.id, p_available: !item.is_available });
    if (err) {
      setError(friendlyError(err.message));
      await load();
    }
  }

  async function deleteCategory(cat: Cat) {
    if (!window.confirm(`Delete the category "${displayName(cat.names)}"?`)) return;
    setError(null);
    const { error: err } = await supabase.from('categories').delete().eq('id', cat.id);
    if (err) setError(friendlyError(err.message));
    await load();
  }

  async function deleteItem(item: Item) {
    if (!window.confirm(`Delete "${displayName(item.names)}"? This cannot be undone.`)) return;
    setError(null);
    const { error: err } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (err) setError(friendlyError(err.message));
    else if (item.image_path) await removeAsset(item.image_path);
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
        <Link to="/dashboard/menu/category/new" className="inline-flex h-11 items-center rounded-xl bg-amber-700 px-5 text-sm font-semibold text-white hover:bg-amber-800">
          Add category
        </Link>
      </div>
      <ErrorNote message={error} />

      {cats.length === 0 ? (
        <Card>
          <p className="font-semibold">Start your menu</p>
          <p className="mt-1 text-sm text-stone-600">Create a category such as Starters or Drinks, then add your dishes to it.</p>
        </Card>
      ) : (
        cats.map((cat, ci) => {
          const catItems = items.filter((x) => x.category_id === cat.id);
          return (
            <Card key={cat.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{displayName(cat.names)}</h2>
                  {!cat.is_active && <span className="text-xs font-medium text-stone-500">Hidden from customers</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-9 px-3" disabled={busy || ci === 0} aria-label="Move category up" onClick={() => void reorder('categories', cats, ci, -1)}>&uarr;</Button>
                  <Button variant="ghost" className="h-9 px-3" disabled={busy || ci === cats.length - 1} aria-label="Move category down" onClick={() => void reorder('categories', cats, ci, 1)}>&darr;</Button>
                  <Link to={`/dashboard/menu/category/${cat.id}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">Edit</Link>
                  <Button variant="ghost" className="h-9 px-3 text-red-700 hover:bg-red-50" onClick={() => void deleteCategory(cat)}>Delete</Button>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-stone-100">
                {catItems.map((item, ii) => {
                  const img = assetUrl(item.image_path);
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                        {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-medium">
                          <VegMark veg={item.is_veg} />
                          <span className="truncate">{displayName(item.names)}</span>
                        </p>
                        <p className="text-sm text-stone-500">{formatPrice(item.price_paise)}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <label className="flex items-center gap-1.5 text-stone-600">
                            <input type="checkbox" className="h-4 w-4 accent-amber-700" checked={item.is_available} onChange={() => void toggleAvailable(item)} />
                            {item.is_available ? 'Available' : 'Sold out'}
                          </label>
                          <Link to={`/dashboard/menu/item/${item.id}`} className="font-semibold text-amber-700">Edit</Link>
                          <button className="font-semibold text-red-700" onClick={() => void deleteItem(item)}>Delete</button>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <button aria-label="Move item up" disabled={busy || ii === 0} onClick={() => void reorder('menu_items', catItems, ii, -1)} className="px-2 text-stone-500 disabled:opacity-30">&uarr;</button>
                        <button aria-label="Move item down" disabled={busy || ii === catItems.length - 1} onClick={() => void reorder('menu_items', catItems, ii, 1)} className="px-2 text-stone-500 disabled:opacity-30">&darr;</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {catItems.length === 0 && <p className="mt-3 text-sm text-stone-500">No items yet.</p>}
              <Link to={`/dashboard/menu/item/new?category=${cat.id}`} className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline">
                + Add item to this category
              </Link>
            </Card>
          );
        })
      )}
    </>
  );
}
