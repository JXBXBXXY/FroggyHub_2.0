import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const getEnv = () => (window.ENV || {});
const makeClient = () => {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = getEnv();
  if (!url || !key) {
    console.error("Supabase ENV missing", { url, keyPresent: !!key });
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
};

export const supa = makeClient();

// Helpers
export async function getSession() {
  if (!supa) return null;
  const { data } = await supa.auth.getSession();
  return data?.session || null;
}

export async function signInWithNicknameOrEmail({ login, password }) {
  if (!supa) throw new Error("Supabase not ready");
  const isEmail = /\S+@\S+\.\S+/.test(login);
  const args = isEmail ? { email: login, password } : { email: `${login}@users.local`, password };
  // Если логина нет — автосоздаем пользователя (upsert-паттерн)
  let { data, error } = await supa.auth.signInWithPassword(args);
  if (error?.status === 400) {
    const reg = await supa.auth.signUp(args);
    if (reg.error) throw reg.error;
    ({ data, error } = await supa.auth.signInWithPassword(args));
  }
  if (error) throw error;
  return data?.session || null;
}

export async function signOut() {
  if (!supa) return;
  await supa.auth.signOut();
}
