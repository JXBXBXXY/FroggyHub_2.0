// src/api.ts (добавить хелперы использования токена)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/.netlify/functions'
});

export const login = async (nickname: string, password: string) => {
  const { data } = await api.post('/local-login', { nickname, password });
  if (data?.token) localStorage.setItem('FH_JWT', data.token);
  return data;
};

export const signup = async (nickname: string, password: string) => {
  await api.post('/local-signup', { nickname, password });
  return login(nickname, password);
};

export const getProfile = async () => {
  const token = localStorage.getItem('FH_JWT');
  try {
    const { data } = await api.get('/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return data;
  } catch (e: any) {
    if (e?.response?.status === 401) {
      localStorage.removeItem('FH_JWT');
      window.location.href = '/';
    }
    throw e;
  }
};
