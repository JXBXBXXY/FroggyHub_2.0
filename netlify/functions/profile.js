// netlify/functions/profile.js
const { ok, err, requireAuth } = require('./_auth');
const { getServiceClient } = require('./_supabase');

exports.handler = requireAuth(async (_event, ctx) => {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('users_local')
    .select('id, nickname, email, created_at')
    .eq('id', ctx.user.sub)
    .single();
  if (error || !data) return err('User not found', 404);
  return ok({ success:true, profile: data });
});
