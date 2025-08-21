// ESM
import jwt from 'jsonwebtoken';
import { getServiceClient } from './_supabase.js';

const ok = (body, status=200)=>({ statusCode: status, headers: hdr(), body: JSON.stringify(body) });
const err = (message, status=400)=>({ statusCode: status, headers: hdr(), body: JSON.stringify({ error: message }) });
const hdr = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok({});
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);
  try {
    const auth = event.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return err('Unauthorized', 401);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub;

    const { title, date, time, address, dress_code, bring, comment, wishlist=[] } = JSON.parse(event.body||'{}');
    if (!title || !date || !time) return err('title, date, time required');

    const sb = getServiceClient();

    // уникальный 6-значный код
    let code;
    for (let i=0;i<5;i++) {
      code = String(Math.floor(100000 + Math.random()*900000));
      const { data:exists } = await sb.from('events').select('id').eq('code', code).maybeSingle();
      if (!exists) break;
      code = null;
    }
    if (!code) return err('Failed to generate code', 500);

    const { data:ev, error } = await sb.from('events').insert({
      code, host_user_id: userId, title, date, time, address, dress_code, bring, comment
    }).select('*').single();
    if (error) return err(error.message, 400);

    // wishlist
    if (Array.isArray(wishlist) && wishlist.length) {
      const rows = wishlist
        .filter(x=>x && x.title)
        .map(x=>({ event_id: ev.id, title: x.title, url: x.url||null }));
      if (rows.length) await sb.from('wishlist_items').insert(rows);
    }
    return ok({ success:true, event: ev });
  } catch (e) {
    return err(e.message || 'Server error', 500);
  }
}
