const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
    const body = await readBody(req);
    const { code, name, user_id } = body || {};
    if (!code || !name || !user_id) return send(res, 400, { error: 'bad_request' });
    const ev = await pool.query('SELECT id FROM events WHERE code = $1', [code]);
    if (ev.rowCount === 0) return send(res, 404, { error: 'not_found' });
    const eventId = ev.rows[0].id;
    await pool.query(
      'INSERT INTO guests(event_id,user_id,name) VALUES($1,$2,$3) ON CONFLICT (event_id,name) DO UPDATE SET user_id=EXCLUDED.user_id',
      [eventId, user_id, name]
    );
    send(res, 200, { event_id: eventId });
  } catch (err) {
    send(res, 500, { error: err.message });
  }
};

function send(res, status, body){
  res.statusCode = status;
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(body));
}

function readBody(req){
  return new Promise((resolve, reject)=>{
    let data='';
    req.on('data', c => (data += c));
    req.on('end', ()=>{
      try{ resolve(JSON.parse(data || '{}')); }catch(e){ reject(e); }
    });
  });
}
