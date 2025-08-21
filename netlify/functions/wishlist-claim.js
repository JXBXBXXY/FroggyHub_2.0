import { db, ok, bad, preflight } from './_utils.js';

export async function onRequestOptions(ctx){ const r = preflight(ctx.request); return r || ok({}); }

export async function onRequestPost({ request }) {
  try {
    const { id, nickname } = await request.json();
    if (!id || !nickname) return bad(400, 'id and nickname required');

    const { error } = await db.from('wishlist_items').update({ claimed_by: nickname }).eq('id', id);
    if (error) return bad(500, error.message);

    return ok({ success: true });
  } catch (e) { return bad(400, e.message); }
}
