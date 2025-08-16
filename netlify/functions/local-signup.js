// Netlify v2 function
import bcrypt from 'bcryptjs';
import { getClient } from './_db.js';
import { json, preflight } from './_http.js';

export default async function handler(request) {
  if (request.method === 'OPTIONS') return preflight();
  if (request.method !== 'POST') return json({ success:false, error:'Method not allowed' }, 405);

  let payload;
  try { payload = await request.json(); }
  catch { return json({ success:false, error:'Invalid JSON body' }, 400); }

  const { nickname, password, email } = payload || {};
  if (!nickname || !password) return json({ success:false, error:'Missing nickname or password' }, 400);

  const client = getClient();
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await client.query(
      `INSERT INTO public.users_local (nickname, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, nickname, email, created_at`,
      [nickname, email || null, passwordHash]
    );
    return json({ success:true, user: rows[0] }, 201);
  } catch (e) {
    if (e?.code === '23505') return json({ success:false, error:'Nickname already exists' }, 409);
    console.error('local-signup error:', e);
    return json({ success:false, error: e?.message || 'Internal error' }, 500);
  } finally {
    await client.end();
  }
}
