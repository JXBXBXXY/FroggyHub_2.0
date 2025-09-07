import jwt from 'jsonwebtoken';
import { supabase } from './_supabase.js';
import { getPidByUserUuid } from './_pid.js';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const auth = JSON.parse(event.headers['x-auth'] || '{}'); // вы так уже делаете
    if (!auth?.user?.sub) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    // 1) Маппим UUID пользователя → BIGINT pid
    const hostPid = await getPidByUserUuid(auth.user.sub);

    // 2) Достаём payload формы
    const payload = JSON.parse(event.body || '{}');

    // 3) Формируем запись для вставки (host_user_id — это pid!)
    const row = {
      title: payload.title ?? null,
      date: payload.date ?? null,
      time: payload.time ?? null,
      address: payload.address ?? null,
      notes: payload.notes ?? null,
      dress: payload.dress ?? null,
      bring: payload.bring ?? null,
      code: payload.code ?? null,
      host_user_id: hostPid, // <--- главное изменение
      // ... если есть ещё поля — добавьте сюда
    };

    const { data, error } = await supabase.from('events').insert(row).select().single();
    if (error) {
      return { statusCode: 400, body: `Insert failed: ${error.message}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, event: data }),
      headers: { 'content-type': 'application/json' }
    };
  } catch (err) {
    return { statusCode: 500, body: `Server error: ${err.message}` };
  }
}
