import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ---- SAFE SUPABASE FACTORY (guards placeholders/invalid URL) ----
export const supa = (() => {
  const rawUrl = window?.ENV?.PUBLIC_SUPABASE_URL ?? "";
  const rawKey = window?.ENV?.PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Плейсхолдеры Netlify/пустые строки считаем «нет кредов»
  const isPlaceholder = (v) =>
    !v || /^\$?PUBLIC_SUPABASE_/i.test(String(v));

  if (isPlaceholder(rawUrl) || isPlaceholder(rawKey)) {
    console.warn("[supa] creds are placeholders/missing, skip init", {
      url: rawUrl,
      hasKey: !!rawKey,
    });
    return null;
  }

  const url = String(rawUrl).trim();
  const key = String(rawKey).trim();

  // Валидация URL — если кривой, не инициализируем
  try {
    // бросит исключение, если url невалидный
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    console.warn("[supa] invalid URL, skip init", { url });
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.error("[supa] init error", e);
    return null;
  }
})();
// -----------------------------------------------------------------

export const getSession = () => {
  if (!supa) {
    console.warn("[auth] Supabase is not configured");
    return null;
  }
  return supa.auth.getSession().then((r) => r.data.session);
};
export const onAuthState = (cb) => {
  if (!supa) {
    console.warn("[auth] Supabase is not configured");
    return null;
  }
  return supa.auth.onAuthStateChange((_evt, session) => cb(session));
};
export const signIn = (email, password) => {
  if (!supa) {
    console.warn("[auth] Supabase is not configured");
    return null;
  }
  return supa.auth.signInWithPassword({ email, password });
};
export const signUp = (email, password) => {
  if (!supa) {
    console.warn("[auth] Supabase is not configured");
    return null;
  }
  return supa.auth.signUp({ email, password });
};
export const signOut = () => {
  if (!supa) {
    console.warn("[auth] Supabase is not configured");
    return null;
  }
  return supa.auth.signOut();
};
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

/* QA:
fetch(`${window.ENV.PUBLIC_SUPABASE_URL}/auth/v1/health`, {
  headers: { apikey: window.ENV.PUBLIC_SUPABASE_ANON_KEY }
}).then(r => r.text()).then(console.log).catch(console.error);
// Должен вернуться JSON с GoTrue, без CORS/host not found.
*/

