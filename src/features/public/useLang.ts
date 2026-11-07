import { useCallback, useState } from 'react';
import type { Lang } from '../../types/db';

const KEY = 'ao_lang';

/** Customer language: remembered choice, else the restaurant default, else English. */
export function useLang(fallback?: Lang) {
  const [choice, setChoice] = useState<Lang | null>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === 'en' || v === 'as' || v === 'hi' ? v : null;
    } catch {
      return null;
    }
  });
  const setLang = useCallback((l: Lang) => {
    setChoice(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* storage can be unavailable; the choice still works for this visit */
    }
  }, []);
  return { lang: choice ?? fallback ?? 'en', setLang };
}

export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#111111' : '#ffffff';
}
