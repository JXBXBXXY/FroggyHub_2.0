import { supabase } from './_supabase.js';
import { getPidByUserUuid } from './_pid.js';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const auth = JSON.parse(event.headers['x-auth'] || '{}');
    if (!auth?.user?.sub) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    // UUID → pid
    const hostPid = await getPidByUserUuid(auth.user.sub);

    // фильтруем по BIGINT pid
    const { data, error } = await supabase
      .from('events')
      .select('id,title,date,time,address,notes,dress,bring,code,host_user_id')
      .eq('host_user_id', hostPid)
      .order('date', { ascending: true });

    if (error) {
      return { statusCode: 400, body: `Query failed: ${error.message}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, items: data ?? [] }),
      headers: { 'content-type': 'application/json' }
    };
  } catch (err) {
    return { statusCode: 500, body: `Server error: ${err.message}` };
  }
}
