const { db, json } = require('./_utils');
const jwt = require('jsonwebtoken');

const genCode = () => String(Math.floor(100000 + Math.random()*900000));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { success:false, error:'Method Not Allowed' });

  try {
    const auth = event.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);

    const body = JSON.parse(event.body || '{}');

    const payload = {
      code: genCode(),
      host_user_id: sub,
      title: body.title?.trim() || 'Событие',
      date: body.date,
      time: body.time || null,
      address: body.address || null,
      dress: body.dress || null,
      bring: body.bring || null,
      comment: body.comment || null
    };

    const { data, error } = await db.from('events').insert(payload).select().single();
    if (error) return json(500, { success:false, error: error.message });

    return json(200, { success:true, event: data });
  } catch (e) {
    return json(400, { success:false, error: e.message });
  }
};
