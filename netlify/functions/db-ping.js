// v2 ping
import pg from 'pg';
import { json, preflight } from './_http.js';
const { Client } = pg;

export default async function handler(request) {
  if (request.method === 'OPTIONS') return preflight();

  const conn = process.env.DATABASE_URL;
  if (!conn) return json({ ok:false, error:'DATABASE_URL is not set' }, 500);

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query('select now() as now, current_database() as db');
  await client.end();
  return json({ ok:true, ...rows[0] });
}
