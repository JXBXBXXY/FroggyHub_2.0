import { supabaseAdmin } from './_lib/supabase.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

export async function handler(event) {
  try {
    const body = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};
    const qs = event.queryStringParameters || {};

    // Принимаем code в любом виде
    const code = String(body.code ?? body.join_code ?? qs.code ?? '').trim();
    const nickname = String(body.nickname ?? body.name ?? '').trim();

    if (!code) return json(400, { success: false, error: 'Event code is required' });

    const supa = supabaseAdmin();

    // (необязательно) создаём/обновляем локального пользователя по никнейму
    if (nickname) {
      const { error: uErr } = await supa
        .from('users_local')
        .upsert({ nickname }, { onConflict: 'nickname' });
      if (uErr) console.warn('users_local upsert warning:', uErr);
    }

    // Ищем событие по code или join_code
    const { data: eventRow, error: eErr } = await supa
      .from('events')
      .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment')
      .or(`code.eq.${code},join_code.eq.${code}`)
      .single();

    if (eErr || !eventRow) return json(404, { success: false, error: 'Event not found' });

    // Здесь можно добавить запись участия в отдельную таблицу, если она есть.
    // Мы не делаем вставку, чтобы не ошибиться со схемой и не уронить функцию.

    return json(200, { success: true, event: eventRow });
  } catch (e) {
    console.error('event-join error', e);
    return json(500, { success: false, error: String(e.message || e) });
  }
}
