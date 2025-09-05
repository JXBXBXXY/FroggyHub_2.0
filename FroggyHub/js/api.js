const ENV = window?.ENV ?? {};
const URL = (ENV.PUBLIC_SUPABASE_URL || '').trim();
const KEY = (ENV.PUBLIC_SUPABASE_ANON_KEY || '').trim();

function looksLikePlaceholder(s) {
  return !s || /PUBLIC_SUPABASE_/i.test(s) || s.endsWith('/');
}

let _supa = null;
export const supa = (() => {
  if (_supa) return _supa;
  if (looksLikePlaceholder(URL) || looksLikePlaceholder(KEY)) {
    console.warn('[supa] creds are placeholders/missing, skip init', { URL, KEY: KEY && KEY.slice(0,6) + '…' });
    return null;
  }
  _supa = window.supabase?.createClient
    ? window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
  return _supa;
})();

export const getSession = () => {
  if (!supa) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  return supa.auth.getSession().then((r) => r.data.session);
};

export const onAuthState = (cb) => {
  if (!supa) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  return supa.auth.onAuthStateChange((_evt, session) => cb(session));
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
  return supa.auth.signInWithPassword({ email, password });
}

export async function signUpWithNickname({ nickname, email, password }) {
  if (!supa) throw new Error('Supabase is not configured');
  return supa.auth.signUp({
    email,
    password,
    options: { data: { nickname } }
  });
}

export function resetPassword(email) {
  if (!supa) throw new Error('Supabase is not configured');
  return supa.auth.resetPasswordForEmail(email);
}

export const signOut = () => {
  if (!supa) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
  return supa.auth.signOut();
};

export async function getProfile() {
  if (!supa) {
    console.warn('[auth] Supabase is not configured');
    return null;
  }
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
