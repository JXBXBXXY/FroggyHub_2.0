// netlify/functions/events-create.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err, requireAuth } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const auth = await requireAuth(event);
  if (!auth || !auth.user?.sub) return err('Unauthorized', 401);

  try {
    const payload = JSON.parse(event.body || '{}');
    const { title, date, time, address, dress, bring, notes, wishlist = [] } = payload;
    if (!title || !date || !time) return err('Missing required fields', 400);

    const sb = getServiceClient();

    // сгенерировать уникальный 6-символьный код
    let code;
    for (let i = 0; i < 6; i++) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: exists } = await sb.from('events').select('id').eq('code', code).maybeSingle();
      if (!exists) break;
    }

    // создать событие
    const { data: evt, error: e1 } = await sb
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
    if (e1) throw e1;

    // вишлист (bulk insert, если есть)
    if (Array.isArray(wishlist) && wishlist.length) {
      const rows = wishlist.map(w => ({
        event_id: evt.id,
        title: w?.title || null,
        url: w?.url || null
      }));
      const { error: e2 } = await sb.from('wishlist_items').insert(rows);
      if (e2) throw e2;
    }

    return ok({ ok: true, code: evt.code, eventId: evt.id, event: evt }, 201);
  } catch (e) {
    return err(e.message || 'Failed to create event', 500);
  }
}
