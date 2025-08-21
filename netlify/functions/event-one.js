import { getServiceClient } from './_supabase.js';
const ok=(b,s=200)=>({statusCode:s,headers:hdr(),body:JSON.stringify(b)});
const err=(m,s=400)=>({statusCode:s,headers:hdr(),body:JSON.stringify({error:m})});
const hdr=()=>({'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
export async function handler(event){
  const id = event.queryStringParameters?.id;
  const code = event.queryStringParameters?.code;
  if (!id && !code) return err('id or code required',400);
  const sb=getServiceClient();
  let q = sb.from('events').select('*, wishlist_items(*)').limit(1);
  if (id) q = q.eq('id', id); else q = q.eq('code', code);
  const { data, error } = await q.single();
  if (error || !data) return err('Not found',404);
  return ok({ event: data });
}
