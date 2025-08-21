// netlify/functions/event-create-v2.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err, requireAuth } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const auth = await requireAuth(event);
  if (!auth?.user?.sub) return err('Unauthorized', 401);

  try {
    const { title, date, time, address, dress, bring, notes } = JSON.parse(event.body || '{}');
    if (!title || !date || !time) return err('Missing required fields', 400);

    const sb = getServiceClient();

    let code;
    for (let i = 0; i < 10; i++) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: exists } = await sb.from('events').select('id').eq('code', code).maybeSingle();
      if (!exists) break;
    }

    const { data: evt, error } = await sb
      .from('events')
      .insert({
        code,
        host_user_id: auth.user.sub,
        title,
        date,
        time,
        address: address || null,
        dress: dress || null,
        bring: bring || null,
        notes: notes || null
      })
      .select('id, code, title, date, time, address, dress, bring, notes, host_user_id, created_at')
      .single();
    if (error) throw error;

    return ok({ event: evt }, 201);
  } catch (e) {
    return err(e.message || 'Failed to create event', 500);
  }
}
