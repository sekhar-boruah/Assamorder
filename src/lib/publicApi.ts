import { supabase } from './supabase';
import type { I18n, Lang, OpeningHours } from '../types/db';

export interface PublicRestaurant {
  id: string;
  slug: string;
  name: string;
  available: boolean;
  branding: {
    logo_path: string | null; cover_path: string | null; primary_color: string; secondary_color: string;
    description: string | null; address: string | null; contact_phone: string | null;
  };
  settings: {
    default_language: Lang; accepts_dine_in: boolean; accepts_takeaway: boolean;
    gst_mode: 'inclusive' | 'separate'; gst_percent: number; opening_hours: OpeningHours;
  };
}
export interface PublicOption { id: string; names: Partial<I18n>; price_paise: number; is_available: boolean }
export interface PublicItem {
  id: string; price_paise: number; is_veg: boolean; is_available: boolean; image_path: string | null;
  names: Partial<I18n>; descriptions: Partial<I18n>; variants: PublicOption[]; addons: PublicOption[];
}
export interface PublicCategory { id: string; names: Partial<I18n>; items: PublicItem[] }
export interface PublicMenu { categories: PublicCategory[] }

export async function getRestaurant(slug: string): Promise<PublicRestaurant | null> {
  const { data, error } = await supabase.rpc('get_public_restaurant', { p_slug: slug });
  if (error) throw error;
  return (data as PublicRestaurant | null) ?? null;
}

export async function getMenu(slug: string): Promise<PublicMenu | null> {
  const { data, error } = await supabase.rpc('get_public_menu', { p_slug: slug });
  if (error) throw error;
  return (data as PublicMenu | null) ?? null;
}

export async function resolveTable(token: string): Promise<{ slug: string; label: string } | null> {
  const { data, error } = await supabase.rpc('resolve_table', { p_token: token });
  if (error) throw error;
  return (data as { slug: string; label: string } | null) ?? null;
}

/** Text in the chosen language, falling back to English, then to anything available. */
export function pick(names: Partial<I18n> | null | undefined, lang: Lang): string {
  if (!names) return '';
  return names[lang] || names.en || names.as || names.hi || '';
}
