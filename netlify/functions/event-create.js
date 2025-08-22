import { supabaseAdmin } from './_lib/supabase.js';
import * as utils from './_utils.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

// Если utils.generateJoinCode нет — используем локальный генератор (6-значный код)
const generateJoinCode =
  typeof utils.generateJoinCode === 'function'
    ? utils.generateJoinCode
    : () => String(Math.floor(100000 + Math.random() * 900000));

async function uniqueJoinCode(supa, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const code = generateJoinCode();
    const { data, error } = await supa
      .from('events')
      .select('id')
      .eq('join_code', code)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return code;
  }
  throw new Error('Failed to generate unique join code');
}

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Разрешённые поля
    const allowed = ['title', 'date', 'time', 'address', 'dress_code', 'what_to_bring', 'comment', 'host_user_id'];
    const payload = {};
    for (const k of allowed) if (body[k] != null) payload[k] = body[k];

    // Минимальная валидация
    if (!payload.title) return json(400, { success: false, error: 'title is required' });
    if (!payload.date)  return json(400, { success: false, error: 'date is required' });
    if (!payload.time)  return json(400, { success: false, error: 'time is required' });

    const supa = supabaseAdmin();
    payload.join_code = await uniqueJoinCode(supa);

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
