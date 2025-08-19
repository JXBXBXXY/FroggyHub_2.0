// netlify/functions/local-signup.js
const bcrypt = require('bcryptjs');
const { getServiceClient } = require('./_supabase');

// CORS + унифицированные ответы
function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': 'https://froggyhubapp.netlify.app',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra
  };
}
function ok(body, status = 200) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) };
}
function err(message, status = 400, meta) {
  return { statusCode: status, headers: cors(), body: JSON.stringify({ success: false, error: message, ...(meta||{}) }) };
}

exports.handler = async (event) => {
  console.log('[auth] using supabase sdk');
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
    if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

    let nickname, password;
    try {
      ({ nickname, password } = JSON.parse(event.body || '{}'));
    } catch {
      return err('Invalid JSON body', 400);
    }
    if (!nickname || !password) return err('Missing nickname or password', 400);

    // хэш пароля
    const passwordHash = await bcrypt.hash(password, 10);
    // вставка пользователя
    const sb = getServiceClient();
    const { data, error } = await sb
      .from('users_local')
      .insert({ nickname, password_hash: passwordHash })
      .select('id, nickname, email, created_at')
      .single();

    if (error) {
      if (error.code === '23505') return err('Nickname already exists', 409);
      console.error('local-signup insert error:', error);
      return err(error.message || 'Internal error', 500);
    }

    return ok({ success: true, user: data }, 201);
  } catch (e) {
    console.error('local-signup error:', e && (e.stack || e.message || e));
    return err(e && e.message ? e.message : 'Internal error', 500);
  }
};
