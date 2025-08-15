import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function getUserFromAuth(event) {
  const auth = event.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("Missing Authorization");

  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Auth validation failed");
  const user = await res.json();
  return user;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { code, name } = JSON.parse(event.body || '{}');
    if (!code || !name) {
      return { statusCode: 400, body: 'code and name are required' };
    }

    const user = await getUserFromAuth(event);

    const client = await pool.connect();
    try {
      const ev = await client.query('select id from events where code = $1 limit 1', [code]);
      if (ev.rowCount === 0) return { statusCode: 404, body: 'Invalid code' };
      const event_id = ev.rows[0].id;

      await client.query(
        `insert into guests(event_id, user_id, name)
         values ($1, $2, $3)
         on conflict (event_id, name)
         do update set user_id = excluded.user_id`,
        [event_id, user.id, name]
      );

      return { statusCode: 200, body: JSON.stringify({ event_id }) };
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Server error' };
  }
}
