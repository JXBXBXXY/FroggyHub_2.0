import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './_lib/supabase.js';

const json = (s, b) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(b),
});

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {};
    const id = params.id ? Number(params.id) : null;
    const code = params.code ? String(params.code) : null;
    if (!id && !code) return json(400, { success: false, error: 'Provide id or code' });

    // запрашиваем событие
    const supa = supabaseAdmin();
    let q = supa
      .from('events')
      .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, host_user_id, wishlist_items(*)')
      .limit(1);

    if (id) q = q.eq('id', id); else q = q.eq('code', code);

    const { data, error } = await q.single();
    if (error) throw error;

    // кто запрашивает?
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    let requesterId = null;
    if (token && process.env.JWT_SECRET) {
      try { requesterId = Number(jwt.verify(token, process.env.JWT_SECRET).sub) || null; } catch {}
    }

    const isOwner = data.host_user_id && requesterId && Number(data.host_user_id) === requesterId;

    // если не владелец — удаляем чувствительные поля
    if (!isOwner) {
      delete data.code;
      delete data.join_code;
    }

    return json(200, {
      success: true,
      event: {
        id: data.id,
        code: data.code,
        join_code: data.join_code,
        title: data.title,
        date: data.date,
        time: data.time,
        address: data.address,
        dress_code: data.dress_code,
        what_to_bring: data.what_to_bring,
        comment: data.comment,
        host_user_id: data.host_user_id,
        wishlist: data.wishlist || data.wishlist_items || [],
      },
    });
  } catch (e) {
    console.error('event-one error', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
