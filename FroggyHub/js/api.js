// Tiny client for Netlify functions + token helpers
export const TOKEN_KEY = 'fh:token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

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

// Глобальный logout удобен для кнопки в шапке
export function logout() {
  clearToken();
  location.assign('/');
}

// если в разметке вызывается window.logout()
try { window.logout = logout; } catch {}

// Для удобства в браузере:
window.fhApi = { nf, getToken, setToken, clearToken, logout };
