// netlify/functions/profile.js
const { cors, ok, err, requireAuth } = require('./_auth');
const { getServiceClient } = require('./_supabase');

async function handler(event, context) {
  console.log('[auth] using supabase sdk');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors(), body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const sb = getServiceClient();
  try {
    // context.user.sub — id из токена
    const { data, error } = await sb
      .from('users_local')
      .select('id, nickname, email, created_at')
      .eq('id', context.user.sub)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return err('User not found', 404);
      console.error('profile select error:', error);
      return err(error.message || 'Failed to load profile', 500);
    }
    return ok({ success: true, profile: data });
  } catch (e) {
    return err(e.message || 'Failed to load profile', 500);
  }
}

exports.handler = requireAuth(handler);
