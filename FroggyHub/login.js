import { nf, setToken } from './js/api.js';

async function handleLogin(evt) {
  evt?.preventDefault?.();
  const nickname = document.querySelector('#login-nickname')?.value?.trim();
  const password = document.querySelector('#login-password')?.value ?? '';

const res = await fetch('/.netlify/functions/local-login-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  const data = await res.json();

  if (data?.success && data?.token) {
    setToken(data.token);
    // вернёмся на главную/меню
    location.href = '/';
  } else {
    // покажи ошибку в UI
    console.warn('Login failed:', data);
    alert(data?.error || 'Не удалось войти');
  }
}
window.handleLogin = handleLogin;
