const { db, json } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { success:false, error:'Method Not Allowed' });

  try {
    const { code, title, url } = JSON.parse(event.body || '{}');
    const { data: ev, error } = await db.from('events').select('id').eq('code', code).single();
    if (error || !ev) return json(404, { success:false, error:'Событие не найдено' });

    const { error: err } = await db.from('wishlist_items').insert({ event_id: ev.id, title, url });
    if (err) return json(500, { success:false, error: err.message });

    return json(200, { success:true });
  } catch (e) {
    return json(400, { success:false, error: e.message });
  }
};
