const { getServiceClient } = require('./_supabase');

exports.handler = async () => {
  const urlDefined = !!process.env.SUPABASE_URL;
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let tableExists = null;
  let count = null;
  let supabaseError = null;

  try {
    if (urlDefined && hasServiceRole) {
      const sb = getServiceClient();
      const { count: c, error } = await sb
        .from('users_local')
        .select('id', { count: 'exact', head: true });

      if (error) {
        supabaseError = error.code || error.message || String(error);
        tableExists = error.code === '42P01' ? false : null;
      } else {
        tableExists = true;
        count = c ?? 0;
      }
    }
  } catch (e) {
    supabaseError = e.code || e.message || String(e);
  }

  const ok = urlDefined && hasServiceRole && !supabaseError;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok, urlDefined, hasServiceRole, tableExists, count, supabaseError }),
  };
};
