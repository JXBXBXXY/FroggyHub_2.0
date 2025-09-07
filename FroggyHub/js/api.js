// FroggyHub/js/api.js
// Источник ENV: window.ENV (заполни на Netlify как раньше)
// Без реальных значений Supabase — auth/профиль не активируется (мягкая деградация).

const ENV = window?.ENV ?? {};
const URL = (ENV.PUBLIC_SUPABASE_URL || '').trim();
const KEY = (ENV.PUBLIC_SUPABASE_ANON_KEY || '').trim();

function looksLikePlaceholder(s) {
  if (!s) return true;
  if (/PUBLIC_SUPABASE_/i.test(s)) return true;
  if (/^https?:/i.test(s)) return !/supabase\.co\/?$/i.test(s);
  return false;
}

let _supa = null;
export const supa = (() => {
  if (_supa) return _supa;
  if (looksLikePlaceholder(URL) || looksLikePlaceholder(KEY) || !window.supabase?.createClient) {
    console.warn('[supa] creds are placeholders/missing, skip init', { URL, KEY: KEY && KEY.slice(0,6)+'…' });
    const banner = document.getElementById('sessionBanner') || document.createElement('div');
    banner.id = 'sessionBanner';
    banner.role = 'status';
    banner.textContent = 'Supabase не настроен. Проверьте /env.js';
    banner.style.cssText = 'position:fixed;left:1rem;bottom:1rem;padding:.5rem .75rem;background:#243b3b;color:#d5f5f5;border-radius:.5rem;z-index:9999';
    document.body.appendChild(banner);
    return null;
  }
  _supa = window.supabase?.createClient
    ? window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
  return _supa;
})();

export const getSession = async () => {
  if (!supa) return null;
  const { data } = await supa.auth.getSession();
  return data.session;
};

export const onAuthState = (cb) => {
  if (!supa) return () => {};
  const { data: sub } = supa.auth.onAuthStateChange((_evt, session) => cb(session));
  return () => sub?.subscription?.unsubscribe?.();
};

export async function signIn({ login, password }) {
  if (!supa) throw new Error('Supabase is not configured');
  const isEmail = /\S+@\S+\.\S+/.test(login);
  let email = login;
  if (!isEmail && supa.rpc) {
    const { data, error } = await supa.rpc('get_email_by_nickname', { p_nickname: login });
    if (error) throw error;
    if (!data?.email) throw new Error('User not found');
    email = data.email;
  }
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithNickname({ nickname, email, password }) {
  if (!supa) throw new Error('Supabase is not configured');
  const { data, error } = await supa.auth.signUp({
    email, password, options: { data: { nickname } }
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(email) {
  if (!supa) throw new Error('Supabase is not configured');
  return supa.auth.resetPasswordForEmail(email);
}

export const signOut = async () => {
  if (!supa) throw new Error('Supabase is not configured');
  await supa.auth.signOut();
};

export async function getProfile() {
  if (!supa) return null;
  const { data } = await supa.from('profiles').select('*').single();
  return data;
}

/* Netlify functions helpers (оставил нетронутыми) */
export const TOKEN_KEY = 'fh:token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

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
  const res = await fetch('/.netlify/functions/event-join-v2', {
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
