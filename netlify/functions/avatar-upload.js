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
    const userId = auth.user.sub;

    const { data: existing } = await sb.from('users').select('avatar_url').eq('id', userId).single();
    if (existing?.avatar_url) {
      const prefix = '/storage/v1/object/public/avatars/';
      const oldPath = existing.avatar_url.includes(prefix) ? existing.avatar_url.split(prefix)[1] : null;
      if (oldPath) await sb.storage.from('avatars').remove([oldPath]);
    }

    const path = `avatars/${userId}-${Date.now()}.jpg`;
    const { error:upErr } = await sb.storage.from('avatars').upload(path, buf, { upsert:true, contentType:'image/jpeg' });
    if (upErr) throw upErr;
    const { data:pub } = sb.storage.from('avatars').getPublicUrl(path);
    await sb.from('users').upsert({ id:userId, nickname: auth.user.nickname, avatar_url: pub.publicUrl }).eq('id', userId);
    return ok({ url: pub.publicUrl });
  }catch(e){
    return err(e.message || 'Failed to upload', 400);
  }
};
