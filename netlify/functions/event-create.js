import { db, ok, bad, preflight, authUser, genCode } from './_utils.js';

export async function onRequestOptions(ctx){ const r = preflight(ctx.request); return r || ok({}); }

export async function onRequestPost({ request }) {
  const who = authUser(request);
  if (!who) return bad(401, 'Unauthorized');

  try {
    const body = await request.json();
    const payload = {
      code: genCode(),
      host_user_id: who.id,
      type: (body.type || 'party'),             // 'business' | 'party'
      title: body.title?.trim() || 'Событие',
      date: body.date || null,
      time: body.time || null,
      address: body.address || null,
      dress: body.dress || null,
      bring: body.bring || null,
      comment: body.comment || null
    };

    const { data, error } = await db.from('events').insert(payload).select().single();
    if (error) return bad(500, error.message);
    return ok({ success: true, event: data });
  } catch (e) { return bad(400, e.message); }
}
