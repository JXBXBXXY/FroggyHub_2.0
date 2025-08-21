import { getServiceClient } from './_supabase.js';
import { requireAuth, ok, err, cors } from './_auth.js';

function decodeDataURL(dataUrl){
  const m = /^data:(.+);base64,(.+)$/.exec(dataUrl||''); if(!m) throw new Error('Bad image');
  return Buffer.from(m[2],'base64');
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors() };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);
  const auth = requireAuth(event);
  if (!auth) return err('Unauthorized', 401);
  try{
    const { image } = JSON.parse(event.body || '{}');
    const buf = decodeDataURL(image);
    const sb = getServiceClient();
    const path = `avatars/${auth.user.sub}.jpg`;
    const { error:upErr } = await sb.storage.from('avatars').upload(path, buf, { upsert:true, contentType:'image/jpeg' });
    if (upErr) throw upErr;
    const { data:pub } = sb.storage.from('avatars').getPublicUrl(path);
    await sb.from('users_local').update({ avatar_url: pub.publicUrl }).eq('id', auth.user.sub);
    return ok({ url: pub.publicUrl });
  }catch(e){
    return err(e.message || 'Failed to upload', 400);
  }
};
