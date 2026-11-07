import type { I18n, Lang } from '../types/db';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'hi', label: 'हिन्दी' },
];

export const emptyI18n = (): I18n => ({ en: '', as: '', hi: '' });

export function toI18n(rows: { lang: string; [k: string]: unknown }[], field: string): I18n {
  const out = emptyI18n();
  for (const r of rows) {
    if (r.lang === 'en' || r.lang === 'as' || r.lang === 'hi') {
      const v = r[field];
      out[r.lang] = typeof v === 'string' ? v : '';
    }
  }
  return out;
}

export function fromJson(j: unknown): I18n {
  const out = emptyI18n();
  if (j && typeof j === 'object') {
    for (const l of ['en', 'as', 'hi'] as const) {
      const v = (j as Record<string, unknown>)[l];
      if (typeof v === 'string') out[l] = v;
    }
  }
  return out;
}

export const displayName = (n: I18n): string => n.en || n.as || n.hi || 'Untitled';

/** "120", "99.50" -> paise. Returns null for anything else. */
export function rupeesToPaise(input: string): number | null {
  const t = input.trim();
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(parseFloat(t) * 100);
}

export const paiseToRupees = (p: number): string => (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2));

export const formatPrice = (p: number): string =>
  '\u20B9' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
