import { createClient } from '@supabase/supabase-js';
import { json, getUserFromAuth } from './_utils.js';

export async function handler(event){
  try{
    if(event.httpMethod !== 'GET' && event.httpMethod !== 'POST'){
      return json(405, { error: 'Method Not Allowed' });
    }
    const payload = event.httpMethod === 'GET' ? (event.queryStringParameters || {}) : JSON.parse(event.body||'{}');
    const eventId = payload.event_id || payload.id;
    if(!eventId){
      return json(400, { error: 'event_id required' });
    }
    const user = await getUserFromAuth(event);
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: evt } = await client
      .from('events')
      .select('id, owner_id, title, date, time, address, notes')
      .eq('id', eventId)
      .single();
    if(!evt){
      return json(404, { error: 'not_found' });
    }
    if(evt.owner_id !== user.id){
      return json(403, { error: 'forbidden' });
    }

    const { data: participants } = await client
      .from('participants')
      .select('rsvp, profiles(nickname, avatar_url)')
      .eq('event_id', eventId);

    const { data: wishlist } = await client
      .from('wishlist_items')
      .select('title, url, taken_by, profiles:profiles!wishlist_items_taken_by_fkey(nickname, avatar_url)')
      .eq('event_id', eventId);

    const visitors = (participants||[]).map(p => ({
      nickname: p.profiles?.nickname || '',
      avatar_url: p.profiles?.avatar_url || '',
      rsvp: p.rsvp
    }));

    const wl = (wishlist||[]).map(w => ({
      title: w.title,
      url: w.url,
      taken_by: w.taken_by ? { nickname: w.profiles?.nickname || '', avatar_url: w.profiles?.avatar_url || '' } : null
    }));

    return json(200, {
      event: {
        title: evt.title,
        date: evt.date,
        time: evt.time,
        address: evt.address,
        notes: evt.notes
      },
      participants: visitors,
      wishlist: wl
    });
  }catch(err){
    console.error('get-event-analytics', err);
    return json(500, { error: 'server_error' });
  }
}
