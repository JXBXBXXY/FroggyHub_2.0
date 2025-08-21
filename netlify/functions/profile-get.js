import { getServiceClient } from './_supabase.js';
import { requireAuth, ok, err, cors } from './_auth.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);
  const auth = requireAuth(event);
  if (!auth) return err('Unauthorized', 401);
  const sb = getServiceClient();
  try {
    const { data, error } = await sb
      .from('users')
      .select('id, nickname, avatar_url')
      .eq('id', auth.user.sub)
      .single();
    if (data) return ok(data);
    if (error && error.code !== 'PGRST116') throw error;
    const { data: created, error: insErr } = await sb
      .from('users')
      .insert({ id: auth.user.sub, nickname: auth.user.nickname })
      .select('id, nickname, avatar_url')
      .single();
    if (insErr) throw insErr;
    return ok(created);
  } catch (e) {
    return err(e.message || 'Failed to load profile', 400);
  }
};
