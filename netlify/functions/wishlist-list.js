// netlify/functions/wishlist-list.js
import { createClient } from '@supabase/supabase-js';

const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});
const json = (s, b) => ({ statusCode: s, headers: cors(), body: JSON.stringify(b) });

export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

    const url = new URL(event.rawUrl);
    const code = (url.searchParams.get('code') || '').trim();
    if (!code) return json(400, { error: 'code is required' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // находим событие
    let ev = null;
    let r1 = await sb.from('events').select('id, code').eq('code', code).maybeSingle();
    if (r1.error) return json(500, { error: r1.error.message });
    ev = r1.data;

    if (!ev) {
      // пробуем join_code, если есть такая колонка
      const r2 = await sb.from('events').select('id, join_code').eq('join_code', code).maybeSingle();
      if (!r2.error) ev = r2.data;
      else {
        const msg = String(r2.error.message || '').toLowerCase();
        const missingCol = msg.includes('column') && (msg.includes('does not exist') || msg.includes('unknown'));
        if (!missingCol) return json(500, { error: r2.error.message });
      }
    }
    if (!ev) return json(404, { error: 'Event not found' });

    const { data: items, error } = await sb
      .from('wishlist_items')
      .select('id, title, url, claimed_by')
      .eq('event_id', ev.id)
      .order('id', { ascending: true });

    if (error) return json(500, { error: error.message });
    return json(200, { items: items || [] });
  } catch (e) {
    console.error('wishlist-list failed', e);
    return json(500, { error: e.message || String(e) });
  }
}
