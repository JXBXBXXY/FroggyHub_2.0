// netlify/functions/wishlist-claim-v2.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { item_id, nickname } = JSON.parse(event.body || '{}');
    if (!item_id) return err('item_id required', 400);
    const sb = getServiceClient();
    const { data, error } = await sb
      .from('wishlist_items')
      .update({ claimed_by: nickname || null })
      .eq('id', item_id)
      .select('id, title, url, claimed_by')
      .single();
    if (error || !data) return err('Item not found', 404);
    return ok({ item: data });
  } catch (e) {
    return err(e.message || 'Failed to claim', 500);
  }
}
