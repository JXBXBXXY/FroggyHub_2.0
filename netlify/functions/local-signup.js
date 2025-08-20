// netlify/functions/local-signup.js
const bcrypt = require('bcryptjs');
const { getServiceClient } = require('./_supabase');

const ok = (b, s=200)=>({ statusCode:s, headers:{'Content-Type':'application/json'}, body:JSON.stringify(b) });
const err = (m, s=400)=> ok({ success:false, error:m }, s);

exports.handler = async (event) => {
  try {
    const { nickname, password } = JSON.parse(event.body || '{}');
    if (!nickname || !password) return err('nickname and password required', 400);

    const sb = getServiceClient();
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error, status } = await sb
      .from('users_local')
      .insert({ nickname, password_hash }) // email не указываем
      .select('id, nickname, email, created_at')
      .single();
    if (error) return err(status === 409 || error.code === '23505' ? 'Nickname already exists' : (error.message || 'signup failed'), status || 500);
    return ok({ success:true, user: data }, 201);
  } catch (e) {
    return err(e.message || 'signup failed', 500);
  }
};
