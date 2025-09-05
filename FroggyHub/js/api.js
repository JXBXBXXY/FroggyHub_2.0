import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let _supa = null;

export function supa(){
  if (_supa !== null) return _supa;
  const ENV = (window.ENV || {});
  const url = ENV.PUBLIC_SUPABASE_URL || '';
  const key = ENV.PUBLIC_SUPABASE_ANON_KEY || '';
  const ok = /^https?:\/\//i.test(url) && key && !/PUBLIC_SUPABASE_ANON_KEY/.test(key);
  if (!ok){
    _supa = null;  // нет конфигурации — не создаём клиент и не спамим консоль
    return _supa;
  }
  _supa = createClient(url, key, { auth:{ persistSession:true, autoRefreshToken:true }});
  return _supa;
}

export async function signInSmart({ login, password }){
  const client = supa();
  if (!client) throw new Error('Supabase is not configured');
  const raw = String(login||'').trim();
  if (!raw || !password) throw new Error('Заполните логин и пароль');

  let email = raw;
  const isEmail = /\S+@\S+\.\S+/.test(raw);
  if (!isEmail){
    // получаем email по никнейму через RPC (функция get_email_by_nickname уже есть)
    const { data, error } = await client.rpc('get_email_by_nickname', { p_nickname: raw });
    if (error) throw error;
    if (!data?.email) throw new Error('Пользователь с таким никнеймом не найден');
    email = data.email;
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithNickname({ nickname, email, password }){
  const client = supa();
  if (!client) throw new Error('Supabase is not configured');
  if (!nickname || !email || !password) throw new Error('Заполните никнейм, email и пароль');

  const { data, error } = await client.auth.signUp(
    { email, password },
    { data: { nickname: String(nickname).trim() } }
  );
  if (error) throw error;
  return data;
}

export function onAuthChanged(cb){
  const client = supa();
  if (!client) return () => {};
  return client.auth.onAuthStateChange((_e, s)=>cb?.(s));
}

export async function signOut(){
  const client = supa();
  if (!client) return;
  await client.auth.signOut();
}
