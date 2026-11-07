import { supabase } from './supabase';
import type { StrKey } from './i18n';
import type { I18n, Lang, OrderStatus } from '../types/db';

export interface PlacedOrder { tracking_token: string; order_number: number; total_paise: number; status: OrderStatus; replayed: boolean }

export interface OrderStatusData {
  order_number: number;
  status: OrderStatus;
  order_type: 'dine_in' | 'takeaway';
  table_label: string | null;
  subtotal_paise: number;
  tax_paise: number;
  total_paise: number;
  gst_mode: 'inclusive' | 'separate';
  payment_method: 'cash' | 'upi';
  payment_status: 'unpaid' | 'paid';
  amount_due_paise: number;
  created_at: string;
  cancel_reason: string | null;
  restaurant: { name: string; slug: string; upi_id: string | null; default_language: Lang };
  items: {
    item_names: Partial<I18n>; variant_names: Partial<I18n> | null; addons: { names: Partial<I18n>; price_paise: number }[];
    quantity: number; line_total_paise: number; instructions: string | null;
  }[];
  events: { status: OrderStatus; at: string }[];
}

export class OrderError extends Error {}

export async function placeOrder(slug: string, payload: Record<string, unknown>): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc('place_order', { p_slug: slug, p_order: payload });
  if (error) throw new OrderError(error.message);
  return data as PlacedOrder;
}

export async function getOrderStatus(token: string): Promise<OrderStatusData | null> {
  const { data, error } = await supabase.rpc('get_order_status', { p_token: token });
  if (error) throw error;
  return (data as OrderStatusData | null) ?? null;
}

export async function cancelMyOrder(token: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_order', { p_token: token });
  if (error) throw new OrderError(error.message);
}

export function errKey(message: string): StrKey {
  const m = message || '';
  if (m.includes('price_changed')) return 'err_price_changed';
  if (/item_unavailable|variant_required|invalid_variant|invalid_addon/.test(m)) return 'err_item_unavailable';
  if (m.includes('restaurant_unavailable')) return 'err_restaurant_unavailable';
  if (m.includes('invalid_phone')) return 'err_invalid_phone';
  if (m.includes('name_required')) return 'err_name_required';
  if (m.includes('too_many_orders')) return 'err_too_many_orders';
  if (m.includes('invalid_table')) return 'err_invalid_table';
  if (m.includes('order_type_not_accepted')) return 'err_order_type';
  if (m.includes('payment_method_not_accepted')) return 'err_payment';
  if (m.includes('cannot_cancel')) return 'err_cannot_cancel';
  return 'err_generic';
}

// "My order" shortcut on the menu page (last order placed on this phone, valid 6 hours).
const SIX_HOURS = 6 * 60 * 60 * 1000;
export function saveLastOrder(slug: string, token: string) {
  try {
    localStorage.setItem(`ao_last_order_${slug}`, JSON.stringify({ token, at: Date.now() }));
  } catch { /* optional convenience */ }
}
export function loadLastOrder(slug: string): string | null {
  try {
    const raw = localStorage.getItem(`ao_last_order_${slug}`);
    if (!raw) return null;
    const p = JSON.parse(raw) as { token: string; at: number };
    return Date.now() - p.at < SIX_HOURS ? p.token : null;
  } catch {
    return null;
  }
}

// Table binding from a scanned QR code. Expires so a QR scanned today cannot be reused remotely tomorrow.
const THREE_HOURS = 3 * 60 * 60 * 1000;
export function saveTable(slug: string, token: string, label: string) {
  try {
    localStorage.setItem(`ao_table_${slug}`, JSON.stringify({ token, label, at: Date.now() }));
  } catch { /* optional */ }
}
export function loadTable(slug: string): { token: string; label: string } | null {
  try {
    const raw = localStorage.getItem(`ao_table_${slug}`);
    if (!raw) return null;
    const p = JSON.parse(raw) as { token: string; label: string; at: number };
    return Date.now() - p.at < THREE_HOURS ? { token: p.token, label: p.label } : null;
  } catch {
    return null;
  }
}
