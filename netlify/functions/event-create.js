import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js'; // есть в репо

const json = (status, body) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method Not Allowed' });
  }

  // безопасный парсинг JSON
  let body = {};
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { success: false, error: 'Invalid JSON' }); }

  // валидация обязательных полей
  const title = (body.title || '').trim();
  const date  = body.date;
  const time  = body.time;
  if (!title || !date || !time) {
    return json(400, { success: false, error: 'title, date and time are required' });
  }

  // нормализованный payload
  const payload = {
    title,
    date,
    time,
    address: body.address?.trim() || null,
    dress_code: body.dress_code ?? body.dressCode ?? null,
    what_to_bring: body.what_to_bring ?? body.whatToBring ?? null,
    comment: body.comment ?? null,
    type: body.type ?? 'party',
    host_user_id: body.host_user_id ?? body.hostUserId ?? null,
    join_code:
      (typeof generateJoinCode === 'function'
        ? generateJoinCode()
        : String(Math.floor(100000 + Math.random() * 900000))),
  };

  try {
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('events')
      .insert(payload)
      .select('id, join_code')
      .single();

    if (error) throw error;
    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e, { payload });
    return json(500, { success: false, error: e.message || String(e) });
  }
}
