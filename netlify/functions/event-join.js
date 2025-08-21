import { db, ok, bad, preflight } from './_utils.js';

export async function onRequestOptions(ctx){ const r = preflight(ctx.request); return r || ok({}); }

export async function onRequestPost({ request }) {
  try {
    const { code, nickname } = await request.json();
    if (!code || !nickname) return bad(400, 'code and nickname required');

    const { data: ev, error: e1 } = await db.from('events').select('id').eq('code', code).single();
    if (e1 || !ev) return bad(404, 'Event not found');

    const { error: e2 } = await db.from('guests').insert({ event_id: ev.id, nickname });
    if (e2) return bad(500, e2.message);

    return ok({ success: true });
  } catch (e) { return bad(400, e.message); }
}
