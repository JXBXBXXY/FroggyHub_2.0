import { Pool } from 'pg';
import { json, getUserFromAuth, clientIp, isRateLimited } from './_utils.js';

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl:{rejectUnauthorized:false} });

export async function handler(event){
  try{
    if (event.httpMethod !== 'POST') return json(405,{error:'Method Not Allowed'});
    const body = JSON.parse(event.body || '{}');
    const code = (body.code || '').trim();
    const name = (body.name || '').trim();
    if(!/^\d{6}$/.test(code) || !name) return json(400,{error:'Bad payload'});

    const ip = clientIp(event);
    const client = await pool.connect();
    try{
      if (await isRateLimited(client, `join:${ip}`, 600, 30))
        return json(429, { error:'Too Many Requests' });

      let user; try{ user = await getUserFromAuth(event); } catch { return json(401,{error:'Unauthorized'}); }

      const ev = await client.query(
        `select id, code_expires_at from events where code=$1 limit 1`, [code]
      );
      if (!ev.rowCount) return json(404,{error:'Invalid code'});
      if (ev.rows[0].code_expires_at && new Date(ev.rows[0].code_expires_at) < new Date())
        return json(410, { error:'Code expired' });

      const event_id = ev.rows[0].id;

      await client.query(
        `insert into guests(event_id, user_id, name)
         values ($1, $2, $3)
         on conflict (event_id, name) do update set user_id = excluded.user_id`,
        [event_id, user.id, name]
      );

      return json(200, { event_id });
    } finally { client.release(); }
  }catch(e){ console.error(e); return json(500,{error:'Server error'}); }
}
