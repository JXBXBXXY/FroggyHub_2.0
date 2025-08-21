import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET } = process.env;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const ok=(b)=>new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
const bad=(s,e)=>ok({success:false,error:e,status:s});

const genCode = ()=> String(Math.floor(100000 + Math.random()*900000));

export async function onRequestPost({ request }) {
  try{
    const auth = request.headers.get('authorization')||'';
    const token = auth.startsWith('Bearer ')? auth.slice(7):'';
    const { sub } = jwt.verify(token, JWT_SECRET);

    const body = await request.json();
    const payload = {
      code: genCode(),
      host_user_id: sub,
      title: body.title?.trim()||'Событие',
      date: body.date, time: body.time||null,
      address: body.address||null,
      dress: body.dress||null,
      bring: body.bring||null,
      comment: body.comment||null
    };
    const { data, error } = await db.from('events').insert(payload).select().single();
    if (error) return bad(500,error.message);
    return ok({ success:true, event:data });
  }catch(e){ return bad(401, e.message); }
}
