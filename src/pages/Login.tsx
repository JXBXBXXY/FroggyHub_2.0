// src/pages/Login.tsx
import { login, signup } from '../api';
import { goProfile } from '../goProfile';
import type { AxiosError } from 'axios';

export async function doLogin(
  nickname: string,
  password: string,
  setMsg: (s: string) => void
) {
  try {
    await login(nickname, password);
    setMsg('Вход выполнен');
    goProfile();
  } catch (e) {
    const err = e as AxiosError<{ error?: string }>;
    setMsg(err.response?.data?.error || 'Ошибка входа');
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
    goProfile();
  } catch (e) {
    const err = e as AxiosError<{ error?: string }>;
    setMsg(err.response?.data?.error || 'Ошибка регистрации');
  }
}
