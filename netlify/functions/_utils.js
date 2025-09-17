import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// ---- ENV ----
const {
  SUPABASE_URL,
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // правильное имя ключа
  SUPABASE_SERVICE_KEY,      // твой старый вариант
  SUPABASE_KEY,              // на всякий
  JWT_SECRET,
  CORS_ORIGIN,
} = process.env;

// Возьмём URL из любого из двух имён
const RESOLVED_URL = SUPABASE_URL || PUBLIC_SUPABASE_URL || '';

// Возьмём service-role ключ из любого подходящего имени
const RESOLVED_SERVICE_KEY =
  SUPABASE_SERVICE_ROLE_KEY ||
  SUPABASE_SERVICE_KEY ||
  SUPABASE_KEY ||
  '';

// --- ленивое создание клиента (чтобы не падать при импорте) ---
let _client = null;
export function getServiceClient() {
  if (_client) return _client;
  if (!RESOLVED_URL) throw new Error('SUPABASE_URL (or PUBLIC_SUPABASE_URL) is required');
  if (!RESOLVED_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) is required');

  _client = createClient(RESOLVED_URL, RESOLVED_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'froggyhub/netlify-fns' } },
  });
  return _client;
}

// Сохраняем старый экспорт имени db для обратной совместимости
export const db = getServiceClient();

// ---- CORS / ответы ----
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
};

export const ok = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });

export const bad = (status, error) =>
  new Response(JSON.stringify({ success: false, error, status }), {
    status: status || 500,
    headers: corsHeaders,
  });

export const preflight = (req) => {
  if (req.method === 'OPTIONS') return ok({ success: true });
  return null;
};

// ---- Auth helper ----
export function authUser(request) {
  try {
    const auth = request.headers.get('authorization') || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    if (!JWT_SECRET) return null;
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.sub, nickname: payload.nickname };
  } catch {
    return null;
  }
}

// ---- Код приглашения ----
export const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
export const generateJoinCode = genCode; // alias
