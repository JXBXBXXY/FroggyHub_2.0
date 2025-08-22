import { supabaseAdmin } from './_lib/supabase.js';

const json = (status, body) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    const qs = event.queryStringParameters || {};
    const id = qs.id ? Number(qs.id) : null;
    const code = qs.code ? String(qs.code).trim() : null;
    if (!id && !code) return json(400, { success: false, error: 'id or code is required' });

    const supa = supabaseAdmin();
    let query = supa
      .from('events')
      .select(`
        id, code, join_code, title, date, time,
        address, dress_code, what_to_bring, comment,
        wishlist:wishlist_items ( id, title, url, claimed_by )
      `);

    if (id)  query = query.eq('id', id);
    if (code) query = query.eq('code', code);

    const { data, error } = await query.single();
    if (error || !data) return json(404, { success: false, error: 'Not found' });

    return json(200, { success: true, event: data });
  } catch (e) {
    console.error('event-one error', e);
    return json(500, { success: false, error: String(e.message || e) });
  }
}
