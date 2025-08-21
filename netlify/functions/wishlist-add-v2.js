// netlify/functions/wishlist-add-v2.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err, requireAuth } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const auth = await requireAuth(event);
  if (!auth?.user?.sub) return err('Unauthorized', 401);

  try {
    const { event_id, id, title, url } = JSON.parse(event.body || '{}');
    if (!event_id || !title) return err('Missing fields', 400);

    const sb = getServiceClient();
    const { data: evt, error: e1 } = await sb.from('events').select('id, host_user_id').eq('id', event_id).single();
    if (e1 || !evt) return err('Event not found', 404);
    if (evt.host_user_id !== auth.user.sub) return err('Forbidden', 403);

    let item;
    if (id) {
      const { data, error } = await sb
        .from('wishlist_items')
        .update({ title, url: url || null })
        .eq('id', id)
        .eq('event_id', event_id)
        .select('id, title, url, claimed_by')
        .single();
      if (error) throw error;
      item = data;
    } else {
      const { data, error } = await sb
        .from('wishlist_items')
        .insert({ event_id, title, url: url || null })
        .select('id, title, url, claimed_by')
        .single();
      if (error) throw error;
      item = data;
    }

    return ok({ item });
  } catch (e) {
    return err(e.message || 'Failed to save item', 500);
  }
}
