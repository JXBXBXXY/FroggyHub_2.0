import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ENV = window.ENV || {};
const SUPABASE_URL = ENV.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = ENV.PUBLIC_SUPABASE_ANON_KEY;

let _supa = null;
export function supa() {
  if (_supa !== null) return _supa;
  const looksLikePlaceholder =
    !SUPABASE_URL || !SUPABASE_ANON_KEY ||
    /PUBLIC_SUPABASE_URL|PUBLIC_SUPABASE_ANON_KEY/i.test(String(SUPABASE_URL + SUPABASE_ANON_KEY));
  if (looksLikePlaceholder) {
    console.warn('[supa] creds are placeholders/missing, skip init', { SUPABASE_URL });
    _supa = undefined;               // «мягкий» режим: без клиента
    return _supa;
  }
  _supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return _supa;
}

const isEmail = (v) => /\S+@\S+\.\S+/.test(String(v||'').trim());

/** Если ввели ник — достаём email через RPC/функцию, иначе берём как есть */
async function resolveEmail(login) {
  const raw = String(login||'').trim();
  if (isEmail(raw)) return raw;
  const s = supa();
  if (!s) throw new Error('Supabase is not configured');
  const { data, error } = await s.rpc('get_email_by_nickname', { p_nickname: raw });
  if (error) throw error;
  if (!data?.email) throw new Error('Пользователь с таким ником не найден');
  return data.email;
}

export async function signIn({ login, password }) {
  const s = supa();
  if (!s) throw new Error('Supabase is not configured');
  const email = await resolveEmail(login);
  const { data, error } = await s.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUpWithNickname({ nickname, email, password }) {
  const s = supa();
  if (!s) throw new Error('Supabase is not configured');
  const { data, error } = await s.auth.signUp({
    email, password,
    options: { data: { nickname: String(nickname||'').trim() } }
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const s = supa();
  if (!s) throw new Error('Supabase is not configured');
  await s.auth.signOut();
}

export async function resetPassword(email) {
  const s = supa();
  if (!s) throw new Error('Supabase is not configured');
  return s.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + '/#reset'
  });
}

