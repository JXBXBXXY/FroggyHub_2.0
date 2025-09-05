import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Берём ENV из window, но не валим UI, если их нет
const ENV = (window.ENV ?? {});
function hasCreds(){
  return Boolean(ENV.PUBLIC_SUPABASE_URL && ENV.PUBLIC_SUPABASE_ANON_KEY);
}

// Возвращаем singleton или null, если нет кредов
let _supa;
export function supa(){
  if (!hasCreds()) { console.warn('[supa] creds are missing, return null client'); return null; }
  if (_supa) return _supa;
  _supa = createClient(ENV.PUBLIC_SUPABASE_URL, ENV.PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return _supa;
}

// Авторизация: логин (ник или e-mail) + пароль
const isEmail = v => /\S+@\S+\.\S+/.test(String(v||'').trim());

/** Получить сессию (или null) */
export async function getSession(){
  const c = supa(); if (!c) return null;
  const { data } = await c.auth.getSession();
  return data?.session ?? null;
}

/** Выход */
export async function signOut(){
  const c = supa(); if (!c) return;
  await c.auth.signOut();
}

/** Регистрация по никнейму+email+пароль (email обязателен) */
export async function signUpWithNickname({ nickname, email, password }){
  const c = supa(); if (!c) throw new Error('Supabase is not configured');
  if (!nickname || !email || !password) throw new Error('Заполните никнейм, email и пароль');
  const { data, error } = await c.auth.signUp({
    email,
    password,
    options: { data: { nickname: String(nickname).trim() } }
  });
  if (error) throw error;
  return data;
}

/** Умный вход: если логин без '@', используем RPC get_email_by_nickname и входим по email */
export async function signInSmart({ login, password }){
  const c = supa(); if (!c) throw new Error('Supabase is not configured');
  const raw = String(login||'').trim();
  if (!raw || !password) throw new Error('Заполните логин и пароль');

  let email = raw;
  if (!isEmail(raw)) {
    // Ожидается функция БД: get_email_by_nickname(p_nickname text) returns record(email text)
    const { data, error } = await c.rpc('get_email_by_nickname', { p_nickname: raw });
    if (error) throw error;
    if (!data || !data.email) throw new Error('Пользователь с таким никнеймом не найден');
    email = data.email;
  }

  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
