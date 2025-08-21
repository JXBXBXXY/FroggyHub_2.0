// netlify/functions/event-one-v2.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const params = event.queryStringParameters || {};
  const code = params.code ? String(params.code).toUpperCase() : null;
  const id = params.id ? Number(params.id) : null;
  if (!code && !id) return err('id or code required', 400);

  try {
    const sb = getServiceClient();
    let query = sb.from('events').select('id, code, title, date, time, address, dress, bring, notes, host_user_id, created_at');
    if (code) query = query.eq('code', code); else query = query.eq('id', id);
    const { data: evt, error } = await query.single();
    if (error || !evt) return err('Not found', 404);

    const { data: wishlist = [] } = await sb
      .from('wishlist_items')
      .select('id, title, url, claimed_by')
      .eq('event_id', evt.id)
      .order('id');

    return ok({ event: evt, wishlist });
  } catch (e) {
    return err(e.message || 'Failed', 500);
  }
}
