// GET /.netlify/functions/db-whoami
// Возвращает current_user, БД и адрес сервера. Используется только для отладки.
import pg from 'pg';
const { Client } = pg;

export default async function handler() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return new Response(JSON.stringify({ ok:false, error:'DATABASE_URL is not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query(`
    select current_user, current_database() as db, inet_server_addr()::text as host;
  `);
  await client.end();
  return new Response(JSON.stringify({ ok:true, ...rows[0] }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
