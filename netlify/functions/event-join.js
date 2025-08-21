const { db, json } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { success:false, error:'Method Not Allowed' });

  try {
    const { code, nickname } = JSON.parse(event.body || '{}');
    const { data: ev, error: e1 } = await db.from('events').select('id,code').eq('code', code).single();
    if (e1 || !ev) return json(404, { success:false, error:'Код не найден' });

    const { error: e2 } = await db.from('guests').insert({ event_id: ev.id, nickname });
    if (e2) return json(500, { success:false, error: e2.message });

    return json(200, { success:true });
  } catch (e) {
    return json(400, { success:false, error: e.message });
  }
};
