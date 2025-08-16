// netlify/functions/local-login.js
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// helpers (CORS + unified responses)
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
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
    if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return err('Invalid JSON body', 400);
    }

    const { nickname, password } = payload;
    if (!nickname || !password) return err('Missing nickname or password', 400);

    const conn = process.env.DATABASE_URL;
    if (!conn) return err('DATABASE_URL is not set', 500);

    const client = new Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const { rows } = await client.query(
      'SELECT id, nickname, password_hash FROM public.users_local WHERE nickname = $1 LIMIT 1',
      [nickname]
    );

    if (!rows[0]) {
      await client.end();
      return err('User not found', 401);
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await client.end();
      return err('Invalid password', 401);
    }

    await client.end();
    return ok({ success: true, user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    console.error('local-login error:', e && (e.stack || e.message || e));
    return err(e && e.message ? e.message : 'Internal error', 500);
  }
};

