import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

    const body = JSON.parse(event.body || '{}');

    // обязательные поля
    for (const k of ['title', 'date', 'time']) {
      if (!body[k]) return json(400, { success: false, error: `Missing field: ${k}` });
    }

    // только разрешённые поля
    const ALLOWED = ['title','date','time','address','dress_code','what_to_bring','comment','host_user_id'];
    const payload = {};
    for (const k of ALLOWED) if (body[k] !== undefined) payload[k] = body[k];

    // защита от опечатки type→time
    if ('type' in payload) delete payload.type;

    // служебные поля
    payload.join_code = generateJoinCode();
    if ('host_user_id' in payload) payload.host_user_id = Number(payload.host_user_id) || null;

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('events')
      .insert(payload)
      .select('id, join_code')
      .single();

    if (error) throw error;
    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
