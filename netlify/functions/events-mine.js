import { getServiceClient } from './_supabase.js';
import { requireAuth, ok, err, cors } from './_auth.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const ctx = requireAuth(event);
  if (!ctx) return err('Unauthorized', 401);

  const sb = getServiceClient();

  const { data: hosted = [] } = await sb
    .from('events')
    .select('id, code, title, date, time, address')
    .eq('host_user_id', ctx.user.sub);

  const { data: guestRows = [] } = await sb
    .from('guests')
    .select('event_id')
    .eq('nickname', ctx.user.nickname);
  const guestIds = guestRows.map(g => g.event_id);

  const { data: joined = [] } = guestIds.length
    ? await sb.from('events').select('id, code, title, date, time, address').in('id', guestIds)
    : { data: [] };

  const uniq = {};
  [...hosted, ...joined].forEach(e => { uniq[e.id] = e; });

  return ok({ events: Object.values(uniq) });
};
