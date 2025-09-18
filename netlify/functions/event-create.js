// netlify/functions/event-create.js
import { supabaseAdmin } from './_lib/supabase.js';
import { generateJoinCode } from './_utils.js';
import jwt from 'jsonwebtoken';

/* ---------- helpers ---------- */
const cors = () => ({
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
});
const json = (status, body) => ({ statusCode: status, headers: cors(), body: JSON.stringify(body) });

const normalizeStr = (v) => (typeof v === 'string' ? v.trim() : v ?? null);
const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const isSixDigits = (v) => /^\d{6}$/.test(String(v || '').trim());

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
    const { data, error } = await supa
      .from('events')
      .insert(attempt)
      .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, created_at')
      .single();

    if (!error) return { data };

    const duplicate =
      error?.code === '23505' ||
      (typeof error?.message === 'string' && /duplicate key value/i.test(error.message));
    if (!duplicate) return { error };

    lastErr = error; // пробуем ещё раз с новым кодом
  }
  return { error: lastErr || new Error('Could not insert event after retries') };
}

/* ---------- handler ---------- */
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
    };

    if (!isNonEmpty(payload.title) || !isNonEmpty(String(payload.date || '')) || !isNonEmpty(String(payload.time || ''))) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();
    const hostUserId = getHostUserId(event);

    // ---- (0) если клиент прислал код — пытаемся его использовать
    const clientCode = isSixDigits(b.code) ? String(b.code).trim() : null;

    // если такой код уже есть — возвращаем это событие (идемпотентность)
    if (clientCode) {
      const { data: byCode, error: byCodeErr } = await supa
        .from('events')
        .select('id, code, join_code, title, date, time, address, dress_code, what_to_bring, comment, created_at')
        .eq('code', clientCode)
        .maybeSingle();

      if (byCodeErr) return json(500, { success: false, error: byCodeErr.message });
      if (byCode) return json(200, { success: true, event: byCode, deduped: true });
    }

    // ---- (1) анти-дубль по title/date/time за последние 3 минуты (и опц. по адресу/host_user_id)
    const sinceIso = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    let q = supa.from('events')
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

    // ---- (2) создаём событие: код = clientCode || сгенерированный
    const codeToUse = clientCode || makeCode();
    const insertable = {
      title: payload.title,
      date: payload.date,
      time: payload.time,
      address: payload.address,
      dress_code: payload.dress_code,
      what_to_bring: payload.what_to_bring,
      comment: payload.comment,
      code: codeToUse,
      join_code: codeToUse,   // оставлено для обратной совместимости, если у тебя есть эта колонка
      host_user_id: hostUserId,
    };

    const { data, error } = await insertEventWithRetries(supa, insertable, { maxAttempts: 5 });
    if (error) return json(500, { success: false, error: error.message || String(error) });

    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
