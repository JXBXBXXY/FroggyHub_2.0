// src/pages/Login.tsx
import { useState } from 'react'
import { signup, login } from '../api'

export default function AuthDemo() {
  const [nickname, setN] = useState('')
  const [password, setP] = useState('')
  const [msg, setMsg] = useState<string>('')

  const doSignup = async () => {
    setMsg('')
    try {
      const res = await signup(nickname, password)
      setMsg(res?.message || 'ok')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Ошибка регистрации')
    }
  }

  const doLogin = async () => {
    setMsg('')
    try {
      const res = await login(nickname, password)
      if (res?.token) localStorage.setItem('token', res.token)
      setMsg('Вход выполнен')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Ошибка входа')
    }
  }

  return (
    <div>
      <input placeholder="nickname" value={nickname} onChange={e => setN(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setP(e.target.value)} />
      <button onClick={doSignup}>Зарегистрироваться</button>
      <button onClick={doLogin}>Войти</button>
      {msg && <div>{msg}</div>}
    </div>
  )
}
