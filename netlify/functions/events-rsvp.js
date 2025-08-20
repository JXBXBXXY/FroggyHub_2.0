import { getServiceClient } from './_supabase.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const { code, name, rsvp, claimItemId, unclaimItemId } = JSON.parse(event.body || '{}');
  if (!code) return { statusCode: 400, body: 'code required' };
  const sb = getServiceClient();

  try {
    const { data: ev } = await sb.from('events').select('id').eq('code', code).single();
    if (!ev) throw new Error('Event not found');

    if (name && rsvp) {
      // upsert гостя по имени (case-insensitive)
      const { data: exists } = await sb.from('guests')
        .select('id').eq('event_id', ev.id).ilike('name', name).maybeSingle();
      if (exists) {
        await sb.from('guests').update({ rsvp }).eq('id', exists.id);
      } else {
        await sb.from('guests').insert({ event_id: ev.id, name, rsvp });
      }
    }

    if (claimItemId) {
      // занять, если свободно или занято этим же именем
      await sb.rpc('claim_wishlist_item', { p_item_id: claimItemId, p_name: name || '' }).catch(async () => {
        // Fallback без RPC
        const { data: item } = await sb.from('wishlist_items').select('claimed_by').eq('id', claimItemId).single();
        if (!item) throw new Error('Item not found');
        if (!item.claimed_by || item.claimed_by.toLowerCase() === (name||'').toLowerCase()) {
          await sb.from('wishlist_items').update({ claimed_by: name || null }).eq('id', claimItemId);
        }
      });
    }
    if (unclaimItemId) {
      await sb.from('wishlist_items').update({ claimed_by: null }).eq('id', unclaimItemId).ilike('claimed_by', name||'');
    }

    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true }) };
  } catch (e) {
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};
