import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

const ALLOWED = ['title','date','time','address','dress_code','what_to_bring','comment'];

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // отфильтровали только существующие поля и чуть подчистили строки
    const base = Object.fromEntries(
      Object.entries(body)
        .filter(([k, v]) => ALLOWED.includes(k) && v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    );

    const payload = {
      ...base,
      join_code: body.join_code || generateJoinCode(),
      // host_user_id можно подставлять из JWT позже
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
