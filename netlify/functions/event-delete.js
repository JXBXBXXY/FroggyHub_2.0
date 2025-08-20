// netlify/functions/event-delete.js
import { getServiceClient } from './_supabase.js';
import { requireAuth, cors, ok, err } from './_auth.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const ctx = requireAuth(event); // { user: { sub, nickname, ... } }
  const { event_id } = JSON.parse(event.body || '{}');
  if (!event_id) return err('event_id required', 400);

  const sb = getServiceClient();

  // Проверяем владение
  const { data: ev, error: e1 } = await sb
    .from('events')
    .select('id, host_user_id')
    .eq('id', event_id)
    .single();

  if (e1 || !ev) return err('Event not found', 404);
  if (ev.host_user_id !== ctx.user.sub) return err('Forbidden', 403);

  // Чистим зависимые записи (если нет ON DELETE CASCADE)
  await sb.from('wishlist_items').delete().eq('event_id', event_id);
  await sb.from('guests').delete().eq('event_id', event_id);

  const { error: e2 } = await sb.from('events').delete().eq('id', event_id).single();
  if (e2) return err('Delete failed', 500);

  return ok({ success: true });
};
