// netlify/functions/events-get.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };

  const code = (event.queryStringParameters?.code || '').toUpperCase();
  if (!code) return err('Code required', 400);

  try {
    const sb = getServiceClient();

    const { data: evt, error } = await sb
      .from('events')
      .select('id, code, title, date, time, address, dress, bring, notes, host_user_id, created_at')
      .eq('code', code)
      .single();
    if (error || !evt) return err('Код не найден', 404);

    const [{ data: wl = [] }, { data: g = [] }] = await Promise.all([
      sb.from('wishlist_items').select('id, title, url, claimed_by').eq('event_id', evt.id),
      sb.from('guests').select('id, name, rsvp, created_at').eq('event_id', evt.id).order('created_at', { ascending: true })
    ]);

    const guests = {
      yes: g.filter(x => x.rsvp === 'yes').map(x => x.name),
      no: g.filter(x => x.rsvp === 'no').map(x => x.name),
      maybe: g.filter(x => x.rsvp === 'maybe').map(x => x.name),
    };

    return ok({ ok: true, event: evt, wishlist: wl, guests });
  } catch (e) {
    return err(e.message || 'Failed to load', 500);
  }
}
