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

/** Безопасно генерирует 6-значный код (или из твоей утилиты), всегда строкой */
function makeCode() {
  try {
    const c = typeof generateJoinCode === 'function' ? generateJoinCode() : null;
    if (isNonEmpty(c)) return String(c);
  } catch {}
  return String(Math.floor(100000 + Math.random() * 900000)); // fallback 6 цифр
}

/** Понимаем host_user_id из JWT (если есть) */
function getHostUserId(event) {
  try {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || !process.env.JWT_SECRET) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // ожидаем numeric id; если там uuid/строка — возвращаем null, чтобы не ломать схему bigint
    const num = Number(decoded?.sub);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

/** Идетемпотентная вставка с ретраями на случай коллизии кода (unique violation) */
async function insertEventWithRetries(supa, insertable, { maxAttempts = 5 } = {}) {
  let lastErr = null;
  for (let i = 0; i < maxAttempts; i++) {
    const attempt = { ...insertable };
    // На всякий — регенерируем код при повторе
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
    // 23505 — duplicate key value violates unique constraint
    const duplicate =
      error?.code === '23505' ||
      (typeof error?.message === 'string' && /duplicate key value/i.test(error.message));
    if (!duplicate) return { error }; // это не коллизия — возвращаем ошибку сразу
    lastErr = error; // пробуем ещё раз с новым кодом
  }
  return { error: lastErr || new Error('Could not insert event after retries') };
}

/** ---- handler ---- */
export async function handler(event) {
  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

    // Парсим вход
    let b = {};
    try {
      b = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { success: false, error: 'Invalid JSON' });
    }

    // Нормализуем поля
    const payload = {
      title: normalizeStr(b.title),
      date: b.date || null, // допускаем строки формата YYYY-MM-DD
      time: b.time || null, // допускаем строки HH:mm
      address: normalizeStr(b.address),
      dress_code: normalizeStr(b.dress_code),
      what_to_bring: normalizeStr(b.what_to_bring),
      comment: normalizeStr(b.comment),
      code: null,
      join_code: null, // оставляем для совместимости со старой схемой
    };

    // Базовая валидация
    if (!isNonEmpty(payload.title) || !isNonEmpty(String(payload.date || '')) || !isNonEmpty(String(payload.time || ''))) {
      return json(400, { success: false, error: 'title, date, time are required' });
    }

    const supa = supabaseAdmin();
    const hostUserId = getHostUserId(event);

    // ---- (1) Анти-дубль: очень близкие по времени такие же события (чтобы форма не создавала по 2 раза) ----
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
      // Уже есть очень похожее «свежее» событие — возвращаем его
      return json(200, { success: true, event: candidates[0], deduped: true });
    }

    // ---- (2) Создание нового события (идемпотентно, учитывая возможную коллизию кода) ----
    const code = makeCode();
    payload.code = code;
    payload.join_code = code; // для обратной совместимости

    // Собираем то, что разрешено вставлять
    const insertable = {
      title: payload.title,
      date: payload.date,
      time: payload.time,
      address: payload.address,
      dress_code: payload.dress_code,
      what_to_bring: payload.what_to_bring,
      comment: payload.comment,
      code: payload.code,
      join_code: payload.join_code, // если в схеме нет join_code — см. комментарий ниже
      host_user_id: hostUserId,
    };

    /**
     * ВАЖНО:
     * Если в твоей текущей схеме НЕТ столбца join_code — просто удали строку join_code из insertable выше.
     * Я оставил поле для совместимости с твоей версией, где оно присутствовало.
     */

    const { data, error } = await insertEventWithRetries(supa, insertable, { maxAttempts: 5 });
    if (error) return json(500, { success: false, error: error.message || String(error) });

    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-create failed', e);
    return json(500, { success: false, error: e.message || String(e) });
  }
}
