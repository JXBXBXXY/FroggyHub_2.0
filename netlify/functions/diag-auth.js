const { getServiceClient } = require('./_supabase');

exports.handler = async () => {
  const urlDefined = Boolean(process.env.SUPABASE_URL);
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let tableExists = false;
  let count = null;
  let supabaseError = null;
  try {
    const sb = getServiceClient();
    const { error, count: c } = await sb
      .from('users_local')
      .select('id', { count: 'exact', head: true });
    if (error) {
      supabaseError = error.message || null;
      tableExists = error.code === '42P01' ? false : true;
    } else {
      tableExists = true;
      count = c ?? null;
    }
  } catch (e) {
    supabaseError = e.message || null;
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: !supabaseError,
      urlDefined,
      hasServiceRole,
      tableExists,
      count,
      supabaseError,
    }),
  };
};
