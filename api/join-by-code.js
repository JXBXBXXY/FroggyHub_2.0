import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { code, userId } = JSON.parse(event.body || '{}');
    if (!code || !userId) {
      return { statusCode: 400, body: 'code and userId required' };
    }

    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: eventRow } = await client
      .from('events')
      .select('id')
      .eq('code', code)
      .single();
    if (!eventRow) return { statusCode: 404, body: 'Event not found' };

    const { error } = await client
      .from('participants')
      .upsert({ event_id: eventRow.id, user_id: userId });
    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ eventId: eventRow.id }) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
