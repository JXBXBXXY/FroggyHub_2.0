// Netlify v2 function
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { json, preflight } from './_http.js';
import { signToken } from './_jwt.js';

const { Client } = pg;

export default async function handler(request) {
  if (request.method === 'OPTIONS') return preflight();
  if (request.method !== 'POST') return json({ success:false, error:'Method not allowed' }, 405);

  let payload;
  try { payload = await request.json(); }
  catch { return json({ success:false, error:'Invalid JSON body' }, 400); }

  const { nickname, password } = payload || {};
  if (!nickname || !password) return json({ success:false, error:'Missing nickname or password' }, 400);

  const conn = process.env.DATABASE_URL;
  if (!conn) return json({ success:false, error:'DATABASE_URL is not set' }, 500);

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows } = await client.query(
      'SELECT id, nickname, password_hash FROM public.users_local WHERE nickname=$1 LIMIT 1',
      [nickname]
    );
    const user = rows[0];
    if (!user) return json({ success:false, error:'User not found' }, 401);

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return json({ success:false, error:'Invalid password' }, 401);

    const token = signToken({ sub: user.id, nickname: user.nickname });
    return json({ success:true, token, user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    console.error('local-login error:', e);
    return json({ success:false, error: e?.message || 'Internal error' }, 500);
  } finally {
    await client.end();
  }
}
