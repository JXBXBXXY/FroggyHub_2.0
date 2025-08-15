import { Pool } from 'pg';
import { json, getUserFromAuth } from './_utils.js';

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl:{rejectUnauthorized:false} });

export async function handler(event){
  try{
    if (event.httpMethod !== 'GET') return json(405,{error:'Method Not Allowed'});
    const code = (event.queryStringParameters?.code || '').trim();
    if(!/^\d{6}$/.test(code)) return json(400,{error:'Invalid code format'});

    try{ await getUserFromAuth(event); } catch { return json(401,{error:'Unauthorized'}); }

    const { rows } = await pool.query(
      `select id, title, date, time, address, dress, bring, notes, code
         from events where code=$1 limit 1`, [code]
    );
    if(!rows.length) return json(404,{error:'Not found'});
    return json(200, rows[0]);
  }catch(e){ console.error(e); return json(500,{error:'Server error'}); }
}
