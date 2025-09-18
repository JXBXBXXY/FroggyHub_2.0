// netlify/functions/event-create.js
import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';
import jwt from 'jsonwebtoken';

/** ---- helpers ---- */
const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});
const json = (status, body) => ({ statusCode: status, headers: cors(), body: JSON.stringify(body) });

const normalizeStr = (v) => (typeof v === 'string' ? v.trim() : v ?? null);
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

/** 6-значный код */
function makeCode() {
  try {
    const c = typeof generateJoinCode === 'function' ? generateJoinCode() : null;
    if (isNonEmpty(c)) return String(c);
  } catch {}
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** host_user_id из JWT (если есть) */
function getHostUserId(event) {
  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const num = Number(decoded?.sub);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

/** идемпотентная вставка события с ретраями на коллизию кода */
async function insertEventWithRetries(supa, insertable, { maxAttempts = 5 } = {}) {
  let lastErr = null;
  for (let i = 0; i < maxAttempts; i++) {
    const attempt = { ...insertable };
    if (i > 0) {
      const newCode = makeCode();
      attempt.code = newCode;
      if ('join_code' in attempt) attempt.join_code = newCode;
    }

    const { data, error } = await supa
      .from('events')
      .insert(attempt)
      .select('id, code, join_code')
      .single();

    if (!error) return { data };
    const duplicate =
      error?.code === '23505' ||
      (typeof error?.message === 'string' && /duplicate key value/i.test(error.message));
    if (!duplicate) return { error };
    lastErr = error;
  }
  return { error: lastErr || new Error('Could not insert event after retries') };
}

/** мягкая вставка массива в wishlist_items */
async function insertWishlistIfAny(supa, eventId, wishlist) {
  try {
    if (!eventId) return;
    const list = Array.isArray(wishlist) ? wishlist : [];
    const rows = list
      .map((i) => ({
        event_id: eventId,
        title: normalizeStr(i?.title) || null,
        url: normalizeStr(i?.url) || null,
      }))
      .filter((r) => isNonEmpty(r.title));

    if (rows.length === 0) return;

    const { error } = await supa.from('wishlist_items').insert(rows);
    // если таблицы нет — просто не падаем
    if (error && !String(error.message || '').toLowerCase().includes('relation "wishlist_items" does not exist')) {
      throw error;
    }
  } catch {
    /* проглотим — создание события важнее */
  }
}

/** ---- handler ---- */
export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

    let b = {};
    try { b = JSON.parse(event.body || '{}'); }
    catch { return json(400, { success: false, error: 'Invalid JSON' }); }

    // поля события
    const payload = {
      title: normalizeStr(b.title),
      date: b.date || null,
      time: b.time || null,
      address: normalizeStr(b.address),
      dress_code: normalizeStr(b.dress_code),
      what_to_bring: normalizeStr(b.what_to_bring),
      comment: normalizeStr(b.comment),
      wishlist: Array.isArray(b.wishlist) ? b.wishlist : [], // <<<<< ВАЖНО
      code: null,
      join_code: null,
    };

    if (!isNonEmpty(payload.title) || !isNonEmpty(String(payload.date || '')) || !isNonEmpty(String(payload.time || ''))) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();
    const hostUserId = getHostUserId(event);

    // анти-дубль за последние 3 минуты
    const sinceIso = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    let q = supa
      .from('events')
      .select('id, code, join_code, title, date, time, address, created_at, host_user_id')
      .eq('title', payload.title)
      .eq('date', payload.date)
      .eq('time', payload.time)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1);

    if (payload.address) q = q.eq('address', payload.address);
    if (hostUserId != null) q = q.eq('host_user_id', hostUserId);

    const { data: candidates, error: candErr } = await q;
    if (candErr) return json(500, { success: false, error: candErr.message });
    if (Array.isArray(candidates) && candidates.length > 0) {
      // если нашли «почти дубль», возвращаем его (вишлист НЕ дублируем)
      return json(200, { success: true, event: candidates[0], deduped: true });
    }

    // создаём новое событие
    const code = makeCode();
    payload.code = code;
    payload.join_code = code;

    const insertable = {
      title: payload.title,
      date: payload.date,
      time: payload.time,
      address: payload.address,
      dress_code: payload.dress_code,
      what_to_bring: payload.what_to_bring,
      comment: payload.comment,
      code: payload.code,
      join_code: payload.join_code, // если у тебя нет этой колонки — можно удалить строку
      host_user_id: hostUserId,
    };

    const { data: created, error } = await insertEventWithRetries(supa, insertable, { maxAttempts: 5 });
    if (error) return json(500, { success: false, error: error.message || String(error) });

    // <<< ДОБАВЛЕНО: положим пункты вишлиста
    await insertWishlistIfAny(supa, created.id, payload.wishlist);

    return json(200, { success: true, event: created });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
