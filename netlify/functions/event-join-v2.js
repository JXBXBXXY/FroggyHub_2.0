// netlify/functions/event-join-v2.js
import { getServiceClient } from './_supabase.js';
import { cors, ok, err } from './_auth.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { code, nickname } = JSON.parse(event.body || '{}');
    if (!code) return err('Code required', 400);

    const sb = getServiceClient();
    const { data: evt, error } = await sb.from('events').select('id').eq('code', String(code).toUpperCase()).single();
    if (error || !evt) return err('Код не найден', 404);

    if (nickname) {
      await sb.from('guests').insert({ event_id: evt.id, nickname }).select('id').single();
    }

    return ok({ eventId: evt.id });
  } catch (e) {
    return err(e.message || 'Failed to join', 500);
  }
}
