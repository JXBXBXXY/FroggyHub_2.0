// Tiny client for Netlify functions + token helpers
export const TOKEN_KEY = 'fh:token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
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
    // отправим на экран входа
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

// Глобальный logout удобен для кнопки в шапке
export function logout() {
  clearToken();
  location.href = '/';
}

// сделать доступным везде
window.logout = logout;

// Для удобства в браузере:
window.fhApi = { nf, joinEvent, getToken, setToken, clearToken, logout };
// --- FH Supabase singleton (append only) ---
(function attachSupabaseSingleton() {
  const SUPABASE_URL = 'https://smamhlfzerjkdfhtwhdv.supabase.co';
  const SUPABASE_ANON_KEY = '<PUT_YOUR_ANON_KEY_HERE>'; // keep as is if already set elsewhere

  if (window.supabase && !window.__fh_supabase) {
    window.__fh_supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'fh.auth',
      },
    });
  }

  if (!window.getSupabase) {
    window.getSupabase = () => window.__fh_supabase;
  }
})();
