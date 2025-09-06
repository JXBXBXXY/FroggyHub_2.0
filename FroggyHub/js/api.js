// js/api.js — безопасная инициализация + все твои экспорты сохранены

// Источники конфигов (любой подойдёт):
// 1) window.__SUPABASE = { url, key }
// 2) window.ENV.PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY
const ENV = window?.ENV ?? {};
const URL =
  (window.__SUPABASE && window.__SUPABASE.url) ||
  (ENV.PUBLIC_SUPABASE_URL || '').trim();
const KEY =
  (window.__SUPABASE && window.__SUPABASE.key) ||
  (ENV.PUBLIC_SUPABASE_ANON_KEY || '').trim();

function looksLikePlaceholder(s) {
  return !s || /PUBLIC_SUPABASE_/i.test(s) || s.endsWith('/');
}

// Храним клиент тут, создаём по требованию
let _supa = null;

// Единая точка — гарантирует, что клиент создан (или вернёт null)
async function ensureSupa() {
  if (_supa) return _supa;

  if (looksLikePlaceholder(URL) || looksLikePlaceholder(KEY)) {
    console.warn('[supa] creds are placeholders/missing, skip init', {
      URL,
      KEY: KEY ? KEY.slice(0, 6) + '…' : '',
    });
    return null;
  }

  // Вариант А: уже подключили UMD-скрипт <script src="...@supabase/supabase-js">
  if (window.supabase?.createClient) {
    _supa = window.supabase.createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return _supa;
  }

  // Вариант Б: потянем ESM-модуль динамически (работает на Netlify/ESM)
  try {
    const { createClient } = await import(
      'https://esm.sh/@supabase/supabase-js@2'
    );
    _supa = createClient(URL, KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return _supa;
  } catch (e) {
    console.warn('[supa] dynamic import failed', e);
    return null;
  }
}

// Для совместимости: синхронный «быстрый» экспорт (может быть null,
// пока ensureSupa() не отработает). Не используем его внутри — только для debug.
export const supa = null;

/* ============ AUTH API (сохраняем сигнатуры) ============ */

export const getSession = async () => {
  const c = await ensureSupa();
  if (!c) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  const { data } = await c.auth.getSession();
  return data.session ?? null;
};

export const onAuthState = async (cb) => {
  const c = await ensureSupa();
  if (!c) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  return c.auth.onAuthStateChange((_evt, session) => cb(session));
};

export async function signIn({ login, password }) {
  const c = await ensureSupa();
  if (!c) throw new Error('Supabase is not configured');

  const isEmail = /\S+@\S+\.\S+/.test(login);
  let email = login;

  // Поддержка входа по никнейму через RPC (если настроена)
  if (!isEmail && c.rpc) {
    const { data, error } = await c.rpc('get_email_by_nickname', {
      p_nickname: login,
    });
    if (error) throw error;
    if (!data?.email) throw new Error('User not found');
    email = data.email;
  }
  return c.auth.signInWithPassword({ email, password });
}

export async function signUpWithNickname({ nickname, email, password }) {
  const c = await ensureSupa();
  if (!c) throw new Error('Supabase is not configured');
  return c.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
}

export async function resetPassword(email) {
  const c = await ensureSupa();
  if (!c) throw new Error('Supabase is not configured');
  return c.auth.resetPasswordForEmail(email);
}

export const signOut = async () => {
  const c = await ensureSupa();
  if (!c) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  return c.auth.signOut();
};

export async function getProfile() {
  const c = await ensureSupa();
  if (!c) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  const { data } = await c.from('profiles').select('*').single();
  return data;
}

/* ============ TOKEN & HELPERS (как у тебя) ============ */

export const TOKEN_KEY = 'fh:token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Вспомогательный вызов Netlify Functions с подстановкой токена
export async function nf(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`/.netlify/functions/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (location.pathname !== '/' && location.pathname !== '/index.html') {
      location.href = '/';
    }
    return { success: false, error: 'unauthorized' };
  }
  return res.json();
}

export async function joinEvent({ code, nickname }) {
  const res = await fetch('/.netlify/functions/event-join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, nickname }),
  });
  return res.json();
}

export function logout() {
  clearToken();
  location.href = '/';
}

/* QA:
fetch(`${URL}/auth/v1/health`, { headers: { apikey: KEY } })
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
*/
