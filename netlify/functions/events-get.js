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

// лёгкая нормализация кода: убираем пробелы, переводим в верхний регистр
const normCode = (v) => String(v || '').trim().toUpperCase();

export async function handler(event) {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

    const url = new URL(event.rawUrl);
    const raw = url.searchParams.get('code');
    const code = normCode(raw);
    if (!code) return json(400, { error: 'code is required' });

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1) пробуем по колонке code
    let { data, error } = await sb
      .from('events')
      .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, created_at')
      .eq('code', code)
      .maybeSingle();

    if (error && !isMissingColumnError(error)) {
      // это не «нет такой колонки», а реальная ошибка
      return json(500, { error: error.message });
    }

    // 2) если не нашли — пробуем по join_code (если колонка есть)
    if (!data) {
      const res2 = await sb
        .from('events')
        .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, created_at')
        .eq('join_code', code)
        .maybeSingle();
      // если join_code колонки нет — res2.error будет «missing column», игнорируем
      if (!res2.error) ({ data } = res2);
      else if (!isMissingColumnError(res2.error)) {
        return json(500, { error: res2.error.message });
      }
    }

    if (!data) return json(404, { error: 'Event not found' });

    return json(200, data);
  } catch (e) {
    console.error('events-get failed', e);
    return json(500, { error: e.message || String(e) });
  }
}

// распознаём «колонка отсутствует» от PostgREST/PG
function isMissingColumnError(err) {
  const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
  return msg.includes('column') && (msg.includes('does not exist') || msg.includes('unknown'));
}
