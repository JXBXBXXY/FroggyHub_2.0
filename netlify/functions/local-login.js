// netlify/functions/local-login.js
import { getServiceClient } from './_supabase.js';
import bcrypt from 'bcryptjs';
import { ok, err, signToken } from './_auth.js';

export async function handler(event, context) {
  try {
    const { nickname, password } = JSON.parse(event.body || '{}');
    if (!nickname || !password) return err('nickname and password required', 400);

    const sb = getServiceClient();
    const { data: user, error } = await sb
      .from('users_local')
      .select('id, nickname, password_hash')
      .eq('nickname', nickname)
      .single();
    if (error || !user) return err('User not found', 401);
    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return err('Invalid password', 401);
    const token = signToken({ sub: user.id, nickname: user.nickname });
    return ok({ success:true, token });
  } catch (e) {
    return err(e.message || 'login failed', 500);
  }
}
