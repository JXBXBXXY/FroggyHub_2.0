const { db, json } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { success:false, error:'Method Not Allowed' });

  try {
    const { id, nickname } = JSON.parse(event.body || '{}');
    const { error } = await db.from('wishlist_items').update({ claimed_by: nickname }).eq('id', id);
    if (error) return json(500, { success:false, error: error.message });

    return json(200, { success:true });
  } catch (e) {
    return json(400, { success:false, error: e.message });
  }
};
