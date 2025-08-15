import { Pool } from 'pg';
import { json, getUserFromAuth, clientIp, isRateLimited } from './_utils.js';

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl:{rejectUnauthorized:false} });

export async function handler(event){
  try{
    if (event.httpMethod !== 'GET') return json(405,{error:'Method Not Allowed'});
    const code = (event.queryStringParameters?.code || '').trim();
    if(!/^\d{6}$/.test(code)) return json(400,{error:'Invalid code format'});

    const ip = clientIp(event);
    const client = await pool.connect();
    try{
      if (await isRateLimited(client, `evcode:${ip}`, 600, 60))
        return json(429, { error:'Too Many Requests' });

      try{ await getUserFromAuth(event); } catch { return json(401,{error:'Unauthorized'}); }

      const { rows } = await client.query(
        `select id, title, date, time, address, dress, bring, notes, code, code_expires_at
           from events
          where code=$1
          limit 1`,
        [code]
      );
      if(!rows.length) return json(404,{error:'Not found'});

      const ev = rows[0];
      if (ev.code_expires_at && new Date(ev.code_expires_at) < new Date())
        return json(410, { error:'Code expired' });

      return json(200, ev);
    } finally { client.release(); }
  }catch(e){ console.error(e); return json(500,{error:'Server error'}); }
}
