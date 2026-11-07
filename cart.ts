import { useCallback, useEffect, useState } from 'react';
import type { I18n } from '../types/db';
import type { PublicItem, PublicMenu, PublicRestaurant } from './publicApi';

export interface CartLine {
  id: string;
  itemId: string;
  variantId: string | null;
  addonIds: string[];
  qty: number;
  instructions: string;
}
interface CartState { lines: CartLine[]; key: string }

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 3) | 8).toString(16);
      });

const storageKey = (slug: string) => `ao_cart_${slug}`;

function read(slug: string): CartState {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (raw) {
      const p = JSON.parse(raw) as CartState;
      if (Array.isArray(p.lines) && typeof p.key === 'string') return p;
    }
  } catch {
    /* ignore unreadable storage */
  }
  return { lines: [], key: uid() };
}

/** Cart kept on this phone. `key` is the order's idempotency key: it stays the same across retries. */
export function useCart(slug: string) {
  const [state, setState] = useState<CartState>(() => read(slug));
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(state));
    } catch {
      /* the cart still works for this visit */
    }
  }, [slug, state]);

  const add = useCallback((line: Omit<CartLine, 'id'>) => {
    setState((s) => {
      const ids = [...line.addonIds].sort();
      const same = s.lines.find((l) => l.itemId === line.itemId && l.variantId === line.variantId && l.instructions === line.instructions && [...l.addonIds].sort().join() === ids.join());
      if (same) return { ...s, lines: s.lines.map((l) => (l === same ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l)) };
      return { ...s, lines: [...s.lines, { ...line, addonIds: ids, id: uid() }] };
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setState((s) => ({ ...s, lines: qty <= 0 ? s.lines.filter((l) => l.id !== id) : s.lines.map((l) => (l.id === id ? { ...l, qty: Math.min(20, qty) } : l)) }));
  }, []);
  const remove = useCallback((id: string) => setState((s) => ({ ...s, lines: s.lines.filter((l) => l.id !== id) })), []);
  const setInstructions = useCallback((id: string, instructions: string) => setState((s) => ({ ...s, lines: s.lines.map((l) => (l.id === id ? { ...l, instructions: instructions.slice(0, 200) } : l)) })), []);
  const clear = useCallback(() => setState({ lines: [], key: uid() }), []);

  return { lines: state.lines, key: state.key, add, setQty, remove, setInstructions, clear };
}

export interface PricedLine {
  line: CartLine;
  item: PublicItem | null;
  variantNames: Partial<I18n> | null;
  addons: { names: Partial<I18n>; price: number }[];
  unit: number;
  lineTotal: number;
  valid: boolean;
}

/** Prices a cart from the current menu. The server re-prices everything again when the order is placed. */
export function priceLines(menu: PublicMenu | null, lines: CartLine[]): PricedLine[] {
  const items = new Map<string, PublicItem>();
  for (const c of menu?.categories ?? []) for (const i of c.items) items.set(i.id, i);
  return lines.map((line) => {
    const item = items.get(line.itemId) ?? null;
    if (!item || !item.is_available) return { line, item, variantNames: null, addons: [], unit: 0, lineTotal: 0, valid: false };
    let valid = true;
    let unit = item.price_paise;
    let variantNames: Partial<I18n> | null = null;
    if (item.variants.length > 0) {
      const v = item.variants.find((x) => x.id === line.variantId);
      if (!v || !v.is_available) valid = false;
      else {
        unit = v.price_paise;
        variantNames = v.names;
      }
    } else if (line.variantId) valid = false;
    const addons = line.addonIds.map((id) => {
      const a = item.addons.find((x) => x.id === id);
      if (!a || !a.is_available) valid = false;
      return { names: a?.names ?? {}, price: a?.price_paise ?? 0 };
    });
    const lineTotal = (unit + addons.reduce((s, a) => s + a.price, 0)) * line.qty;
    return { line, item, variantNames, addons, unit, lineTotal, valid };
  });
}

export function cartTotals(priced: PricedLine[], settings: PublicRestaurant['settings']) {
  const subtotal = priced.reduce((s, p) => s + (p.valid ? p.lineTotal : 0), 0);
  const pct100 = Math.round(Number(settings.gst_percent) * 100);
  const tax = settings.gst_mode === 'separate' ? Math.floor((subtotal * pct100 + 5000) / 10000) : 0;
  return { subtotal, tax, total: subtotal + tax };
}
