import pg from 'pg';
const { Client } = pg;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async function handler() {
  const url = process.env.DATABASE_URL;
  if (!url) return json({ ok: false, error: 'DATABASE_URL is not set' }, 500);

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const { rows } = await client.query(
      `select current_user, current_database() as db, inet_server_addr()::text as host;`
    );
    return json({ ok: true, ...rows[0] });
  } catch (e) {
    if (e?.code === '28P01' || /password authentication failed/i.test(e?.message || '')) {
      return json(
        {
          ok: false,
          code: '28P01',
          error: 'Database password is invalid for the provided user.',
          hint:
            'In Neon → Roles → Reset password for the selected role (e.g., neondb_owner). Copy the URI (without psql/quotes). ' +
            'In Netlify → Environment variables update DATABASE_URL in ALL scopes (Production, Deploy Previews, Branch). Redeploy and try again.'
        },
        500
      );
    }
    return json({ ok: false, error: e?.message || 'DB error' }, 500);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}
