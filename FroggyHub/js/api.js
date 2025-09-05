import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV;

export const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'fh.auth',
  },
});

export const getSession = () => supa.auth.getSession().then((r) => r.data.session);
export const onAuthState = (cb) => supa.auth.onAuthStateChange((_evt, session) => cb(session));
export const signIn = (email, password) => supa.auth.signInWithPassword({ email, password });
export const signUp = (email, password) => supa.auth.signUp({ email, password });
export const signOut = () => supa.auth.signOut();
export async function getProfile() {
  const { data } = await supa.from('profiles').select('*').single();
  return data;
}

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

