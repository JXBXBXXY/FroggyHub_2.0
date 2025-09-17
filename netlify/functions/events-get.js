// netlify/functions/events-get.js
import { createClient } from '@supabase/supabase-js';

const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});

const json = (status, body) => ({
  statusCode: status,
  headers: cors(),
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

    const url = new URL(event.rawUrl);
    const code = (url.searchParams.get('code') || '').trim();
    if (!code) return json(400, { error: 'code is required' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await sb
      .from('events')
      .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, created_at')
      .or(`code.eq.${code},join_code.eq.${code}`)
      .maybeSingle();

    if (error) return json(500, { error: error.message });
    if (!data) return json(404, { error: 'Event not found' });

    return json(200, data);
  } catch (e) {
    console.error('events-get failed', e);
    return json(500, { error: e.message || String(e) });
  }
}
