const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const ev = await pool.query(
      'SELECT id,title,date,time,address,dress,bring,notes,code FROM events WHERE code=$1',
      [code]
    );
    if (ev.rowCount === 0) return send(res, 404, { error: 'not_found' });
    send(res, 200, ev.rows[0]);
  } catch (err) {
    send(res, 500, { error: err.message });
  }
};

function send(res, status, body){
  res.statusCode = status;
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(body));
}
