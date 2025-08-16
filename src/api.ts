import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/.netlify/functions'
})

export const signup = (nickname: string, password: string) =>
  api.post('/signup', { nickname, password }).then(r => r.data)

export const login = (nickname: string, password: string) =>
  api.post('/login', { nickname, password }).then(r => r.data)

export default api

