import { getServiceClient } from './_supabase.js';
import { requireAuth, ok, err, cors } from './_auth.js';

// Returns events of current user (hosted by user for now)
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const ctx = requireAuth(event);
  if (!ctx) return err('Unauthorized', 401);

  const sb = getServiceClient();
  const { data: rows, error } = await sb
    .from('events')
    .select('id, code, title, date, time')
    .eq('host_user_id', ctx.user.sub)
    .order('date', { ascending: true });

  if (error) return err('Failed to load', 500);

  const items = (rows || []).map(r => ({
    id: r.id,
    code: r.code,
    title: r.title,
    date: r.date,
    time: r.time,
    is_host: true,
  }));

  return ok(items);
};
