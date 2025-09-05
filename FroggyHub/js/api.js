import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ENV || {};
let _supa;
export function getSupa() {
  if (!_supa) {
    _supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return _supa;
}

export async function signInOrSignUp({ identifier, password }) {
  const supa = getSupa();
  const email = identifier.includes('@') ? identifier : `${identifier}@local.froggyhub`;
  let { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error && error.message?.toLowerCase().includes('invalid login credentials')) {
    const reg = await supa.auth.signUp({ email, password });
    if (reg.error) throw reg.error;
    ({ data, error } = await supa.auth.signInWithPassword({ email, password }));
  }
  if (error) throw error;
  return data?.session ?? null;
}

export function onAuth(cb) {
  const supa = getSupa();
  return supa.auth.onAuthStateChange((_evt, session) => cb(session));
}

export async function signOut() {
  const supa = getSupa();
  await supa.auth.signOut();
}

export async function getSession() {
  const supa = getSupa();
  const { data } = await supa.auth.getSession();
  return data?.session ?? null;
}

