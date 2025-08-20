import jwt from 'jsonwebtoken';
import { getServiceClient } from './_supabase.js';
const uid = (e)=>{ try{ const t=(e.headers.authorization||'').replace(/^Bearer\s+/,''); return jwt.verify(t,process.env.JWT_SECRET).sub }catch{return null} };

export const handler = async (event) => {
  const userId = uid(event); if (!userId) return { statusCode: 401, body: 'Unauthorized' };
  const sb = getServiceClient();
  const { data: rows } = await sb.from('events')
    .select('id, code, title, date, time, created_at')
    .eq('host_user_id', userId).order('created_at', { ascending:false });
  return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, events: rows||[] }) };
};
