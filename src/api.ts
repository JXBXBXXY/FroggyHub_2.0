import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'FH_JWT';

// migrate old token
const legacyToken = localStorage.getItem('token');
if (legacyToken) {
  localStorage.setItem(TOKEN_KEY, legacyToken);
  localStorage.removeItem('token');
}

const api = axios.create({
  baseURL: '/.netlify/functions'
});

export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface LoginResponse { token: string; }
interface Profile {
  id: number;
  nickname: string;
  email?: string;
  created_at?: string;
}
interface ProfileResponse { profile: Profile; }

export const login = async (
  nickname: string,
  password: string
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/local-login', {
    nickname,
    password
  });
  if (data.token) setToken(data.token);
  return data;
};

export const signup = async (
  nickname: string,
  password: string
): Promise<LoginResponse> => {
  await api.post('/local-signup', { nickname, password });
  return login(nickname, password);
};

export const getProfile = async (): Promise<Profile> => {
  try {
    const { data } = await api.get<ProfileResponse>('/profile', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return data.profile;
  } catch (e) {
    const err = e as AxiosError;
    if (err.response?.status === 401) {
      clearToken();
      window.location.href = '/';
    }
    throw e;
  }
};

export default api;
