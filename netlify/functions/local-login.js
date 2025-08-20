// netlify/functions/local-login.js
const bcrypt = require('bcryptjs');
const { cors, ok, err, signToken } = require('./_auth');
const { getServiceClient } = require('./_supabase');

exports.handler = async (event) => {
  console.log('[auth] using supabase sdk');
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
    if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

    let payload = {};
    try { payload = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON body', 400); }

    const { nickname, password } = payload;
    if (!nickname || !password) return err('Missing nickname or password', 400);

    const sb = getServiceClient();
    const { data: user, error } = await sb
      .from('users_local')
      .select('id, nickname, password_hash')
      .eq('nickname', nickname)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return err('User not found', 401);
      console.error('local-login select error:', error);
      return err(error.message || 'Internal error', 500);
    }

    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return err('Invalid password', 401);

    // JWT
    const token = signToken({ sub: user.id, nickname: user.nickname });

    return ok({ success: true, token, user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    console.error('local-login error:', e && (e.stack || e.message || e));
    return err(e && e.message ? e.message : 'Internal error', 500);
  }
};
