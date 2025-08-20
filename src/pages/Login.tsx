// src/pages/Login.tsx
import { login, signup } from '../api';

export async function doLogin(
  nickname: string,
  password: string,
  setMsg: (s: string) => void
) {
  try {
    await login(nickname, password);
    setMsg('Вход выполнен');
    window.location.href = '/profile.html';
  } catch (e: any) {
    setMsg(e?.response?.data?.error || 'Ошибка входа');
  }
}

export async function doSignup(
  nickname: string,
  password: string,
  setMsg: (s: string) => void
) {
  try {
    await signup(nickname, password);
    setMsg('Регистрация выполнена');
    window.location.href = '/profile.html';
  } catch (e: any) {
    setMsg(e?.response?.data?.error || 'Ошибка регистрации');
  }
}
