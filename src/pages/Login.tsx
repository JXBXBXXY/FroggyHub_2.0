// src/pages/Login.tsx
import { login } from '../api';

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
