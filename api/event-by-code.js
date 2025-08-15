import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const code = event.queryStringParameters.code;
    const userId = event.queryStringParameters.userId;
    if (!code || !userId) {
      return { statusCode: 400, body: 'code and userId required' };
    }

    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: eventRow } = await client
      .from('events')
      .select('*')
      .eq('code', code)
      .single();
    if (!eventRow) return { statusCode: 404, body: 'Event not found' };

    const { data: participants } = await client
      .from('participants')
      .select('user_id, profiles(nickname)')
      .eq('event_id', eventRow.id);

    const { data: wishlist } = await client
      .from('wishlist_items')
      .select('*')
      .eq('event_id', eventRow.id);

    const isOwner = eventRow.owner_id === userId;
    const isParticipant = participants.some(p => p.user_id === userId) || isOwner;

    return {
      statusCode: 200,
      body: JSON.stringify({
        event: eventRow,
        participants,
        wishlist,
        isOwner,
        isParticipant
      })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
