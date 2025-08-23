import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET } = process.env;

export const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const ok = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    },
  });

export const bad = (status, error) => ok({ success: false, error, status });

export const preflight = (req) => {
  if (req.method === 'OPTIONS')
    return ok({ success: true });
  return null;
};

export function authUser(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.sub, nickname: payload.nickname };
  } catch (e) { return null; }
}

export const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
export const generateJoinCode = genCode;
