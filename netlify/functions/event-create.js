// netlify/functions/event-create.js
import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

export async function handler(event) {
  try {
    const b = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};

    const payload = {
      title: (b.title || '').trim(),
      date: b.date || null,
      time: b.time || null,
      address: b.address?.trim() || null,
      dress_code: b.dress_code?.trim() || null,
      what_to_bring: b.what_to_bring?.trim() || null,
      comment: b.comment?.trim() || null,
      code: null,
      join_code: null,
    };

    if (!payload.title || !payload.date || !payload.time) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();

    // 1) Анти-дубль: ищем «такое же» событие, созданное совсем недавно
    const since = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    let q = supa
      .from('events')
      .select('id, code, join_code, title, date, time, address, created_at')
      .eq('title', payload.title)
      .eq('date', payload.date)
      .eq('time', payload.time)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);

    if (payload.address) q = q.eq('address', payload.address);

    const { data: candidates } = await q;
    if (Array.isArray(candidates) && candidates.length) {
      return json(200, { success: true, event: candidates[0], deduped: true });
    }

    // 2) Создаём новое (единожды)
    const code =
      (typeof generateJoinCode === 'function' && generateJoinCode()) ||
      String(Math.floor(100000 + Math.random() * 900000));
    payload.code = code;
    payload.join_code = code;

    // на всякий случай выкидываем лишние ключи
    const insertable = {
      title: payload.title,
      date: payload.date,
      time: payload.time,
      address: payload.address,
      dress_code: payload.dress_code,
      what_to_bring: payload.what_to_bring,
      comment: payload.comment,
      code: payload.code,
      join_code: payload.join_code,
    };

    const { data, error } = await supa
      .from('events')
      .insert(insertable)
      .select('id, code, join_code')
      .single();

    if (error) throw error;
    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
