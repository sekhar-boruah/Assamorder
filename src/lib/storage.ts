import { supabase } from './supabase';

const BUCKET = 'restaurant-assets';

export function assetUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Files live under <restaurant_id>/ so storage policies can enforce tenant isolation. */
export async function uploadRestaurantImage(restaurantId: string, kind: 'logo' | 'cover' | 'item', blob: Blob): Promise<string> {
  const path = `${restaurantId}/${kind}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
  });
  if (error) throw error;
  return path;
}

export async function removeAsset(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
