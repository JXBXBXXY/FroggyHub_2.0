// ESM
import jwt from 'jsonwebtoken';
import { getServiceClient } from './_supabase.js';

const getUserId = (event) => {
  const h = event.headers?.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return null;
  try { return jwt.verify(t, process.env.JWT_SECRET).sub; } catch { return null; }
};

const genCode = () => (Math.floor(100000 + Math.random()*900000)).toString();

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const uid = getUserId(event);
  if (!uid) return { statusCode: 401, body: 'Unauthorized' };

  const sb = getServiceClient();
  const { title, date, time, address, dress, bring, notes, wishlist = [] } = JSON.parse(event.body || '{}');

  try {
    // уникальный код
    let code; for (let i=0;i<7;i++){ code = genCode();
      const { data:ex } = await sb.from('events').select('id').eq('code', code).maybeSingle();
      if (!ex) break; code=null;
    }
    if (!code) throw new Error('Failed to generate code');

    const { data: ev, error } = await sb.from('events')
      .insert({ code, host_user_id: uid, title, date, time, address, dress, bring, notes })
      .select('id, code').single();
    if (error) throw error;

    if (Array.isArray(wishlist) && wishlist.length) {
      const rows = wishlist.map(i => ({ event_id: ev.id, title: i.title || '', url: i.url || '' }));
      await sb.from('wishlist_items').insert(rows);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:true, code: ev.code, eventId: ev.id }) };
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};
