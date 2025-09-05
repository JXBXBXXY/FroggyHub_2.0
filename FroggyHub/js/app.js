import { getSession, onAuth, signInOrSignUp } from './api.js';

const SCREENS = ['auth','home','profile','settings','create','join'];

function showScreen(name) {
  SCREENS.forEach(id => {
    const el = document.querySelector(`#screen-${id}`);
    if (!el) return;
    el.classList.toggle('visible', id === name);
    el.setAttribute('aria-hidden', id === name ? 'false' : 'true');
  });
  // Обновляем hash для SPA
  if (name !== 'auth') location.hash = `#${name}`;
}

function routeFromHash() {
  const target = (location.hash || '#home').replace('#','');
  showScreen(SCREENS.includes(target) ? target : 'home');
}

function bindNav() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    e.preventDefault();
    const dest = btn.getAttribute('data-link');
    if (SCREENS.includes(dest)) showScreen(dest);
  });
}

function bindAuthForm() {
  const form = document.querySelector('#auth-form');
  if (!form) return;
  const loginInput = form.querySelector('input[name="login"]');
  const passInput  = form.querySelector('input[name="password"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = (loginInput?.value || '').trim();
    const password   = (passInput?.value  || '').trim();
    if (!identifier || !password) return;
    form.classList.add('is-loading');
    try {
      const session = await signInOrSignUp({ identifier, password });
      if (session) showScreen('home');
    } catch (err) {
      console.warn('[auth]', err?.message || err);
      // Мягкая подсветка ошибки
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 300);
    } finally {
      form.classList.remove('is-loading');
    }
  });
}

async function bootstrap() {
  // 1) отрисовываем Home по умолчанию, auth поверх если нет сессии
  showScreen('home');
  // 2) слушаем auth
  onAuth((session) => {
    if (session) showScreen('home'); else showScreen('auth');
  });
  // 3) проверяем существующую сессию
  const session = await getSession();
  if (session) showScreen('home'); else showScreen('auth');
  // 4) навигация
  bindNav();
  bindAuthForm();
  // 5) роутинг по hash
  window.addEventListener('hashchange', routeFromHash);
  if (location.hash) routeFromHash();
}

document.addEventListener('DOMContentLoaded', bootstrap);

