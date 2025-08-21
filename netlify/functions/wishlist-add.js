import { db, ok, bad, preflight } from './_utils.js';

export async function onRequestOptions(ctx){ const r = preflight(ctx.request); return r || ok({}); }

export async function onRequestPost({ request }) {
  try {
    const { code, title, url } = await request.json();
    if (!code || !title) return bad(400, 'code and title required');

    const { data: ev, error: e1 } = await db.from('events').select('id').eq('code', code).single();
    if (e1 || !ev) return bad(404, 'Event not found');

    const { error: e2 } = await db.from('wishlist_items').insert({ event_id: ev.id, title, url });
    if (e2) return bad(500, e2.message);

    return ok({ success: true });
  } catch (e) { return bad(400, e.message); }
}
