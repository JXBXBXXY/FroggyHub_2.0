import { signIn, signUpWithNickname, resetPassword, signOut, supa } from './api.js';

/* ---------- РОУТЕР ---------- */
const SCREENS = ['auth','home','profile','settings','create','join','wishlist','final'];
function showScreen(id) {
  SCREENS.forEach(name => {
    const el = document.getElementById(`screen-${name}`);
    if (!el) return;
    const visible = (name === id);
    el.classList.toggle('visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  // Скролл разрешаем только на wishlist
  document.body.classList.toggle('allow-scroll', id === 'wishlist');
  location.hash = `#${id}`;
}

/* ---------- ПУЗЫРИ (mount один раз, лимит + стоп при авторизации) ---------- */
const MAX_CHIPS = 24;
let chipsMounted = false;

function mountChipsOnce() {
  if (chipsMounted) return;
  chipsMounted = true;

  const root = document.getElementById('fh-message-clouds');
  if (!root) return;

  // Берём исходные сообщения из шаблона/массива
  const items = Array.from(root.querySelectorAll('[data-chip]')).map(n => n.textContent.trim());
  root.innerHTML = '';

  const pool = items.slice(0, MAX_CHIPS);
  pool.forEach((text, i) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = text;
    // рандомная раскладка по колонкам
    chip.style.transform = `translate(${(i%3)*33.33 + 5 + Math.random()*10}vw, ${Math.random()*60+5}vh)`;
    root.appendChild(chip);
  });
}

function pauseChips(pause) {
  const root = document.getElementById('fh-message-clouds');
  if (root) root.style.pointerEvents = pause ? 'none' : '';
}

/* ---------- AUTH UI ---------- */
function bindAuth() {
  // login
  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(authForm);
      const login = fd.get('login');
      const password = fd.get('password');
      const btn = authForm.querySelector('button[type="submit"]');
      btn?.setAttribute('disabled','');
      try {
        await signIn({ login, password });
        showScreen('home');                 // ← после успеха идём в лобби
      } catch (err) {
        const box = document.getElementById('login-status');
        if (box) box.textContent = err?.message || 'Ошибка входа';
      } finally {
        btn?.removeAttribute('disabled');
      }
    });
  }

  // sign up
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      const nickname = fd.get('nickname');
      const email = fd.get('email');
      const password = fd.get('password');
      const btn = regForm.querySelector('button[type="submit"]');
      btn?.setAttribute('disabled','');
      try {
        await signUpWithNickname({ nickname, email, password });
        showScreen('home');
      } catch (err) {
        const box = document.getElementById('register-status');
        if (box) box.textContent = err?.message || 'Ошибка регистрации';
      } finally {
        btn?.removeAttribute('disabled');
      }
    });
  }

  // reset
  const resetBtn = document.querySelector('[data-action="forgot"]');
  if (resetBtn) {
    resetBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt('Введите e-mail');
      if (!email) return;
      try { await resetPassword(email); alert('Ссылка для сброса отправлена.'); }
      catch (err) { alert(err?.message || 'Не удалось отправить письмо'); }
    });
  }
}

/* ---------- НАВИГАЦИЯ ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  const dest = a.getAttribute('data-link');
  if (SCREENS.includes(dest)) showScreen(dest);
});

/* ---------- ИНИТ ---------- */
function bootstrap() {
  // 1) фоновые пузыри
  mountChipsOnce();

  // 2) авторизация и оверлей
  bindAuth();

  // 3) показываем auth, если нет сессии; иначе — лобби
  const s = supa(); // может быть undefined, если нет ключей — просто покажем auth
  if (!s) {
    showScreen('auth');
    pauseChips(true);
  } else {
    s.auth.getSession().then(({ data }) => {
      const has = !!data?.session;
      showScreen(has ? 'home' : 'auth');
      pauseChips(!has);
    });
    s.auth.onAuthStateChange((_e, sess) => {
      const has = !!sess;
      showScreen(has ? 'home' : 'auth');
      pauseChips(!has);
    });
  }
}

// запускаемся
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', bootstrap)
  : bootstrap();

