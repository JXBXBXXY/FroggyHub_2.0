// netlify/functions/profile.js
import { getServiceClient } from './_supabase.js';
import { ok, err, requireAuth } from './_auth.js';

export async function handler(event, context) {
  return requireAuth(async (_event, ctx) => {
    const sb = getServiceClient();
    const { data, error } = await sb
      .from('users_local')
      .select('id, nickname, avatar_url')
      .eq('id', ctx.user.sub)
      .single();
    if (error || !data) return err('User not found', 404);
    return ok(data);
  })(event, context);
}
