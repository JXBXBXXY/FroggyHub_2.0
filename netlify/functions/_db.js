// pg client factory (Neon/Supabase pooled URL via DATABASE_URL)
import pg from 'pg';
const { Client } = pg;

export function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
}
