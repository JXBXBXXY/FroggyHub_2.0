const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'POST' && url.pathname === '/api/join-by-code') {
      const body = await readBody(req);
      const { code, name, user_id } = body || {};
      const ev = await pool.query('SELECT id FROM events WHERE code = $1', [code]);
      if (ev.rowCount === 0) return send(res, 404, { error: 'not_found' });
      const eventId = ev.rows[0].id;
      await pool.query(
        'INSERT INTO guests(event_id,user_id,name) VALUES($1,$2,$3) ON CONFLICT (event_id,user_id) DO UPDATE SET name=EXCLUDED.name',
        [eventId, user_id, name]
      );
      return send(res, 200, { event_id: eventId });
    }
    if (req.method === 'GET' && url.pathname === '/api/event-by-code') {
      const code = url.searchParams.get('code');
      const ev = await pool.query('SELECT id,title,date,time,address FROM events WHERE code=$1', [code]);
      if (ev.rowCount === 0) return send(res, 404, { error: 'not_found' });
      return send(res, 200, ev.rows[0]);
    }
    send(res, 404, { error: 'not_found' });
  } catch (err) {
    send(res, 500, { error: err.message });
  }
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (e) {
        reject(e);
      }
    });
  });
}
