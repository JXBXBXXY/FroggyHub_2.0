// netlify/functions/local-signup.js
import { getServiceClient } from './_supabase.js';
import bcrypt from 'bcryptjs';
import { ok, err } from './_auth.js';

export async function handler(event, context) {
  try {
    const { nickname, password } = JSON.parse(event.body || '{}');
    if (!nickname || !password) return err('nickname and password required', 400);

    const sb = getServiceClient();
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error, status } = await sb
      .from('users_local')
      .insert({ nickname, password_hash }) // email не указываем
      .select('id, nickname, email, created_at')
      .single();
    if (error) {
      return err(
        status === 409 || error.code === '23505'
          ? 'Nickname already exists'
          : (error.message || 'signup failed'),
        status || 500
      );
    }
    return ok({ success: true, user: data }, 201);
  } catch (e) {
    return err(e.message || 'signup failed', 500);
  }
}
