import { getServiceClient } from './_supabase.js';

export const handler = async (event) => {
  const code = event.queryStringParameters?.code || JSON.parse(event.body||'{}').code;
  if (!code) return { statusCode: 400, body: 'code required' };
  const sb = getServiceClient();

  try {
    const { data: ev, error } = await sb.from('events').select('id, code, title, date, time, address, dress, bring, notes, created_at, host_user_id').eq('code', code).single();
    if (error) throw error;

    const [{ data: wl }, { data: guests }] = await Promise.all([
      sb.from('wishlist_items').select('id, title, url, claimed_by').eq('event_id', ev.id).order('id'),
      sb.from('guests').select('id, name, rsvp, created_at').eq('event_id', ev.id).order('created_at')
    ]);

    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, event: ev, wishlist: wl||[], guests: guests||[] }) };
  } catch (e) {
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};
