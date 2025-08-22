import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // пропускаем только реально используемые/существующие поля
    const allowed = ['title', 'date', 'time', 'address', 'dress_code', 'what_to_bring'];
    const base = Object.fromEntries(
      Object.entries(body).filter(([k, v]) => allowed.includes(k) && v !== undefined && v !== '')
    );

    const payload = {
      ...base,
      join_code: body.join_code || generateJoinCode(),
      // host_user_id можно добавить позже из JWT, если нужно
    };

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
