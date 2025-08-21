import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ok=(b)=>new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
const bad=(s,e)=>ok({success:false,error:e,status:s});

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const id   = url.searchParams.get('id');
  let q = db.from('events').select('id,code,title,date,time,address,dress,bring,comment, wishlist:wishlist_items(id,title,url,claimed_by)');
  if (code) q = q.eq('code', code);
  else if (id) q = q.eq('id', id);
  else return bad(400,'code or id required');
  const { data, error } = await q.single();
  if (error || !data) return bad(404,'Не найдено');
  return ok({ success:true, event:data });
}
