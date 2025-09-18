// netlify/functions/event-create.js
import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';
import jwt from 'jsonwebtoken';

const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});

const json = (status, body) => ({ statusCode: status, headers: cors(), body: JSON.stringify(body) });

const normalizeStr = (v) => (typeof v === 'string' ? v.trim() : v ?? null);
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

// 6-значный код
function makeCode() {
  try {
    const c = typeof generateJoinCode === 'function' ? generateJoinCode() : null;
    if (isNonEmpty(c)) return String(c);
  } catch {}
  return String(Math.floor(100000 + Math.random() * 900000));
}

// host_user_id из JWT (если есть)
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

// идемпотентная вставка события с ретраями на коллизию кода
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
      error?.code === '23505' || (typeof error?.message === 'string' && /duplicate key value/i.test(error.message));
    if (!duplicate) return { error };
    lastErr = error;
  }
  return { error: lastErr || new Error('Could not insert event after retries') };
}

export async function handler(event) {
  try {
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

    let b = {};
    try { b = JSON.parse(event.body || '{}'); }
    catch { return json(400, { success: false, error: 'Invalid JSON' }); }

    const payload = {
      title: normalizeStr(b.title),
      date: b.date || null,
      time: b.time || null,
      address: normalizeStr(b.address),
      dress_code: normalizeStr(b.dress_code),
      what_to_bring: normalizeStr(b.what_to_bring),
      comment: normalizeStr(b.comment),
      // массив вишлиста из фронта (опционально)
      wishlist: Array.isArray(b.wishlist) ? b.wishlist
        .map(i => ({ title: normalizeStr(i?.title) || null, url: normalizeStr(i?.url) }))
        .filter(i => i.title) : [],
    };

    if (!isNonEmpty(payload.title) || !isNonEmpty(String(payload.date || '')) || !isNonEmpty(String(payload.time || ''))) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();
    const hostUserId = getHostUserId(event);

    // Анти-дубль (последние 3 минуты)
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

    // создаём событие
    const code = makeCode();
    const insertable = {
      title: payload.title,
      date: payload.date,
      time: payload.time,
      address: payload.address,
      dress_code: payload.dress_code,
      what_to_bring: payload.what_to_bring,
      comment: payload.comment,
      code,
      join_code: code,         // оставлено для обратной совместимости
      host_user_id: hostUserId,
    };

    const { data, error } = await insertEventWithRetries(supa, insertable, { maxAttempts: 5 });
    if (error) return json(500, { success: false, error: error.message || String(error) });

    // если передали wishlist — сохраним его в wishlist_items
    try {
      if (payload.wishlist.length > 0) {
        const rows = payload.wishlist.map(it => ({
          event_id: data.id,
          title: it.title,
          url: it.url || null,
          claimed_by: null,
        }));
        // если таблицы нет — просто проигнорируем
        const ins = await supa.from('wishlist_items').insert(rows);
        if (ins.error && !isMissingTable(ins.error)) {
          console.warn('wishlist insert error:', ins.error);
        }
      }
    } catch (e) {
      console.warn('wishlist insert exception:', e);
    }

    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}

function isMissingTable(err) {
  const m = (err?.message || '').toLowerCase();
  return m.includes('relation') && (m.includes('does not exist') || m.includes('not found'));
}
