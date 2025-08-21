const { db, json } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { success:false, error:'Method Not Allowed' });

  const url = new URL(event.rawUrl);
  const code = url.searchParams.get('code');
  const id   = url.searchParams.get('id');

  let q = db.from('events').select(
    'id,code,title,date,time,address,dress,bring,comment,' +
    'wishlist:wishlist_items(id,title,url,claimed_by)'
  );
  if (code) q = q.eq('code', code);
  else if (id) q = q.eq('id', id);
  else return json(400, { success:false, error:'code or id required' });

  const { data, error } = await q.single();
  if (error || !data) return json(404, { success:false, error:'Не найдено' });

  return json(200, { success:true, event:data });
};
