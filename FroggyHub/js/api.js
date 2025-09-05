import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ENV = window?.ENV ?? {};
let _supa;
export const supa = (() => {
  if (_supa) return _supa;
  _supa = createClient(ENV.PUBLIC_SUPABASE_URL, ENV.PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  window.FH = window.FH || {};
  window.FH.supa = _supa;
  return _supa;
})();

const isEmail = (v) => /\S+@\S+\.\S+/.test(String(v||'').trim());

export async function signUpWithNickname({ nickname, email, password }) {
  if (!nickname || !email || !password) throw new Error('Заполните никнейм, email и пароль');
  const { data, error } = await supa.auth.signUp({
    email, password,
    options: { data: { nickname: String(nickname).trim() } },
  });
  if (error) throw error;
  try {
    const user = data.user;
    if (user) {
      await supa.from('profiles').upsert({
        id: user.id, nickname: String(nickname).trim(), email: String(email).trim(),
      });
    }
  } catch {}
  return data;
}

export async function signInSmart({ login, password }) {
  const raw = String(login||'').trim();
  if (!raw || !password) throw new Error('Заполните логин и пароль');
  let email = raw;
  if (!isEmail(raw)) {
    const { data, error } = await supa.rpc('get_email_by_nickname', { p_nickname: raw });
    if (error) throw error;
    if (!data || !data.email) throw new Error('Пользователь с таким никнеймом не найден');
    email = data.email;
  }
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getSession(){ const {data,error}=await supa.auth.getSession(); if(error)throw error; return data.session??null;}
export async function signOut(){ const {error}=await supa.auth.signOut(); if(error)throw error;}
export function onAuthChanged(cb){ return supa.auth.onAuthStateChange((e,s)=>{ try{cb?.(e,s);}catch{} }); }
