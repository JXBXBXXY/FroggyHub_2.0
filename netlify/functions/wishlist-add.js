import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ok=(b)=>new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
const bad=(s,e)=>ok({success:false,error:e,status:s});

export async function onRequestPost({ request }) {
  const { code, title, url } = await request.json();
  const { data:ev, error } = await db.from('events').select('id').eq('code', code).single();
  if (error || !ev) return bad(404,'Событие не найдено');
  const { error:err } = await db.from('wishlist_items').insert({ event_id: ev.id, title, url });
  if (err) return bad(500, err.message);
  return ok({ success:true });
}
