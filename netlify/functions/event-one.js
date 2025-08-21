import { db, ok, bad, preflight } from './_utils.js';

export async function onRequestOptions(ctx){ const r = preflight(ctx.request); return r || ok({}); }

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const id   = url.searchParams.get('id');

  let q = db.from('events')
    .select('id,code,type,title,date,time,address,dress,bring,comment,wishlist:wishlist_items(id,title,url,claimed_by)')
    .limit(1);

  if (code) q = q.eq('code', code);
  else if (id) q = q.eq('id', id);
  else return bad(400, 'code or id required');

  const { data, error } = await q.single();
  if (error || !data) return bad(404, 'Not found');
  return ok({ success: true, event: data });
}
