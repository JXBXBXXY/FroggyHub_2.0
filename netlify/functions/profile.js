import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './_lib/supabase.js';

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  try {
    const auth = event.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return json(401, { success: false, error: 'No token' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return json(500, { success: false, error: 'JWT_SECRET missing' });

    const payload = jwt.verify(token, secret); // { sub: <user_id>, nickname: ... }
    const userId = Number(payload.sub);

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from('users')
      .select('id, nickname, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data) return json(404, { success: false, error: 'User not found' });

    return json(200, { success: true, user: data });
  } catch (e) {
    console.error('profile error', e);
    return json(500, { success: false, error: String(e.message || e) });
  }
}
