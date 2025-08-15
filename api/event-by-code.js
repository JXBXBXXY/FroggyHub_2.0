import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const code = (event.queryStringParameters?.code || '').trim();
    if (!/^\d{6}$/.test(code)) return { statusCode: 400, body: 'Invalid code' };

    const { rows } = await pool.query(
      `select id, title, date, time, address, dress, bring, notes, code
         from events where code = $1 limit 1`,
      [code]
    );
    if (rows.length === 0) return { statusCode: 404, body: 'Not found' };
    return { statusCode: 200, body: JSON.stringify(rows[0]) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Server error' };
  }
}
