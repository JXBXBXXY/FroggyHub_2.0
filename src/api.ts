// src/api.ts (добавить хелперы использования токена)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/.netlify/functions'
});

export function setToken(t: string) { localStorage.setItem('FH_JWT', t); }
export function getToken() { return localStorage.getItem('FH_JWT'); }
export function clearToken() { localStorage.removeItem('FH_JWT'); }

export const login = async (nickname: string, password: string) => {
  const { data } = await api.post('/local-login', { nickname, password });
  if (data?.token) setToken(data.token);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/profile', {
    headers: { Authorization: 'Bearer ' + getToken() }
  });
  return data;
};
