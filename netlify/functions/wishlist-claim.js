import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ok=(b)=>new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
const bad=(s,e)=>ok({success:false,error:e,status:s});

export async function onRequestPost({ request }) {
  const { id, nickname } = await request.json();
  const { error } = await db.from('wishlist_items').update({ claimed_by: nickname }).eq('id', id);
  if (error) return bad(500, error.message);
  return ok({ success:true });
}
