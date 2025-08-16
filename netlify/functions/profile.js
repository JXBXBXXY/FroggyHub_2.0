// Protected example on v2
import pg from 'pg';
import { json } from './_http.js';
import { withAuth } from './_jwt.js';

const { Client } = pg;

async function handler(_request, context) {
  const conn = process.env.DATABASE_URL;
  if (!conn) return json({ success:false, error:'DATABASE_URL is not set' }, 500);

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows } = await client.query(
      'SELECT id, nickname, email, created_at FROM public.users_local WHERE id=$1 LIMIT 1',
      [context.user.sub]
    );
    if (!rows[0]) return json({ success:false, error:'User not found' }, 404);
    return json({ success:true, profile: rows[0] });
  } catch (e) {
    return json({ success:false, error: e?.message || 'Failed to load profile' }, 500);
  } finally {
    await client.end();
  }
}

export default withAuth(handler);
