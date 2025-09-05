import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ENV = window?.ENV ?? {};
let _supa;

/** Фабрика клиента Supabase с защитой от пустых creds */
export function supa() {
  if (_supa) return _supa;
  const url = ENV.PUBLIC_SUPABASE_URL;
  const key = ENV.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[supa] creds are missing, return null client');
    return null;
  }
  _supa = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _supa;
}

/** Простая проверка e-mail */
const isEmail = v => /\S+@\S+\.\S+/.test(String(v||'').trim());

/** Преобразуем никнейм в валидный e-mail домена проекта */
export function nicknameToEmail(nickname) {
  const base = String(nickname||'').trim().toLowerCase();
  // только буквы/цифры/подчёркивания/точки/дефисы
  const local = base.replace(/[^a-z0-9._-]/g, '');
  return `${local}@users.froggyhub.app`;
}

/** Регистрация по никнейму+email+пароль (email можно сгенерировать) */
export async function signUpWithNickname({ nickname, email, password }) {
  const client = supa();
  if (!client) throw new Error('Supabase is not configured');
  const safeEmail = isEmail(email) ? email : nicknameToEmail(nickname);
  if (!nickname || !safeEmail || !password) {
    throw new Error('Заполните никнейм, email и пароль');
  }
  const { data, error } = await client.auth.signUp({
    email: safeEmail,
    password,
    options: { data: { nickname: String(nickname).trim() } },
  });
  if (error) throw error;
  return data;
}

/** Умный вход: принимает login (ник или e-mail) + пароль */
export async function signInSmart({ login, password }) {
  const client = supa();
  if (!client) throw new Error('Supabase is not configured');
  const raw = String(login||'').trim();
  if (!raw || !password) throw new Error('Заполните логин и пароль');

  let email = raw;
  if (!isEmail(raw)) {
    // Пробуем найти e-mail по никнейму в публичном профиле (если есть RPC — используй, а пока просто конвертация)
    email = nicknameToEmail(raw);
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function getSession() {
  const client = supa();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data?.session ?? null;
}

export async function signOut() {
  const client = supa();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/** Подписка на смену состояния авторизации */
export function onAuthChanged(cb) {
  const client = supa();
  if (!client) return () => {};
  const { data: sub } = client.auth.onAuthStateChange((_evt, session) => {
    try { cb?.(session); } catch {}
  });
  return () => sub?.subscription?.unsubscribe?.();
}

