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

function makeCode() {
  try {
    const c = typeof generateJoinCode === 'function' ? generateJoinCode() : null;
    if (isNonEmpty(c)) return String(c);
  } catch {}
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getHostUserId(event) {
  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const num = Number(decoded?.sub);
    return Number.isFinite(num) ? num : null;
  } catch { return null; }
}

async function insertEventWithRetries(supa, insertable, { maxAttempts = 5 } = {}) {
  let lastErr = null;
  for (let i = 0; i < maxAttempts; i++) {
    const attempt = { ...insertable };
    if (i > 0) {
      const newCode = makeCode();
      attempt.code = newCode;
      if ('join_code' in attempt) attempt.join_code = newCode;
    }
    const { data, error } = await supa.from('events').insert(attempt).select('id, code, join_code').single();
    if (!error) return { data };
    const duplicate =
      error?.code === '23505' ||
      (typeof error?.message === 'string' && /duplicate key value/i.test(error.message));
    if (!duplicate) return { error };
    lastErr = error;
  }
  return { error: lastErr || new Error('Could not insert event after retries') };
}

/** ---- handler ---- */
export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

    let b = {};
    try { b = JSON.parse(event.body || '{}'); }
    catch { return json(400, { success: false, error: 'Invalid JSON' }); }

    // >>> принимаем опционально wishlist: [{title, url}]
    const wishlist = Array.isArray(b.wishlist) ? b.wishlist : [];

    const payload = {
      title: normalizeStr(b.title),
      date: b.date || null,
      time: b.time || null,
      address: normalizeStr(b.address),
      dress_code: normalizeStr(b.dress_code),
      what_to_bring: normalizeStr(b.what_to_bring),
      comment: normalizeStr(b.comment),
      code: null,
      join_code: null,
    };

    if (!isNonEmpty(payload.title) || !isNonEmpty(String(payload.date || '')) || !isNonEmpty(String(payload.time || ''))) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();
    const hostUserId = getHostUserId(event);

    // анти-дубль
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
      return json(200, { success: true, event: candidates[0], deduped: true });
    }

    // создание
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
      join_code: payload.join_code,   // если у тебя этой колонки нет — просто удали строку
      host_user_id: hostUserId,
    };

    const { data: ev, error } = await insertEventWithRetries(supa, insertable, { maxAttempts: 5 });
    if (error) return json(500, { success: false, error: error.message || String(error) });

    // >>> если пришёл вишлист — кладём его в wishlist_items
    if (wishlist.length) {
      const rows = wishlist
        .map(it => ({
          event_id: ev.id,
          title: normalizeStr(it?.title),
          url: normalizeStr(it?.url),
        }))
        .filter(r => isNonEmpty(r.title));
      if (rows.length) {
        const { error: wlErr } = await supa.from('wishlist_items').insert(rows);
        if (wlErr) {
          // не валим запрос из-за этого, просто сообщим
          console.warn('wishlist insert error:', wlErr);
        }
      }
    }

    return json(200, { success: true, event: ev });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
