import { getServiceClient } from './_supabase.js';

const ok = (b,s=200)=>({ statusCode:s, headers:hdr(), body:JSON.stringify(b) });
const err = (m,s=400)=>({ statusCode:s, headers:hdr(), body:JSON.stringify({ error:m }) });
const hdr = ()=>({
  'Content-Type':'application/json',
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
});

export async function handler(event){
  if (event.httpMethod==='OPTIONS') return ok({});
  if (event.httpMethod!=='POST') return err('Method not allowed',405);
  try{
    const { code } = JSON.parse(event.body||'{}');
    if (!code || String(code).length!==6) return err('Invalid code');
    const sb = getServiceClient();
    const { data:ev, error } = await sb.from('events').select('*').eq('code', String(code)).single();
    if (error || !ev) return err('Код не найден',404);
    return ok({ success:true, event: ev });
  }catch(e){ return err(e.message||'Server error',500); }
}
