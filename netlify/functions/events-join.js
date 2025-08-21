// netlify/functions/events-join.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { code, nickname } = JSON.parse(event.body || '{}');
    if (!code || !nickname) return err('Code and nickname required', 400);

    const sb = getServiceClient();
    const { data: evt, error } = await sb.from('events').select('id').eq('code', code.toUpperCase()).single();
    if (error || !evt) return err('Код не найден', 404);

    const { data: g, error: e2 } = await sb
      .from('guests')
      .insert({ event_id: evt.id, nickname, rsvp: 'maybe' })
      .select('id')
      .single();
    if (e2) throw e2;

    return ok({ ok: true, guestId: g.id, eventId: evt.id });
  } catch (e) {
    return err(e.message || 'Failed to join', 500);
  }
}
