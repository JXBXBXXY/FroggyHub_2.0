// FroggyHub/js/app.js
import {
  supa, getSession, onAuthState,
  signIn, signUpWithNickname, resetPassword,
  signOut, getProfile
} from './api.js';

// ====== простая система экранов ======
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
  const el = document.getElementById(id);
  if (el) el.classList.add('visible');
}

// data-link навигация (между разделами одной страницы)
const linkMap = {
  home: 'screen-home',
  menu: 'screen-home',
  auth: 'screen-auth',
  profile: 'screen-profile',
  hub: 'screen-home',
  settings: 'screen-home'
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  const key = a.getAttribute('data-link');
  const target = linkMap[key] || key;
  showScreen(target);
});

// ====== auth UI ======
function wireAuthTabs() {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const panes = {
    login: document.getElementById('paneLogin'),
    signup: document.getElementById('paneSignup'),
    reset: document.getElementById('paneReset')
  };
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const key = t.getAttribute('data-auth-tab');
      Object.entries(panes).forEach(([k, el]) => el?.classList.toggle('is-hidden', k !== key));
    });
  });
}

function wireAuthForms() {
  // login
  const fLogin = document.getElementById('formLogin');
  fLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = fLogin.login.value.trim();
    const password = fLogin.password.value;
    try {
      await signIn({ login, password });
      await afterAuthSuccess();
    } catch (err) {
      showFieldError(fLogin, err);
    }
  });

  // signup
  const fSignup = document.getElementById('formSignup');
  fSignup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = fSignup.nickname.value.trim();
    const email = fSignup.email.value.trim();
    const password = fSignup.password.value;
    try {
      await signUpWithNickname({ nickname, email, password });
      await afterAuthSuccess();
    } catch (err) {
      showFieldError(fSignup, err);
    }
  });

  // reset
  const fReset = document.getElementById('formReset');
  fReset?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = fReset.email.value.trim();
    try {
      await resetPassword(email);
      fReset.querySelector('.form-success')?.classList.remove('is-hidden');
    } catch (err) {
      showFieldError(fReset, err);
    }
  });

  // logout (в хэдэре)
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    await signOut();
    showScreen('screen-auth');
  });
}

function showFieldError(form, err) {
  const box = form.querySelector('.form-error');
  if (box) {
    box.textContent = err?.message || 'Ошибка';
    box.classList.remove('is-hidden');
  } else {
    alert(err?.message || 'Ошибка');
  }
}

async function afterAuthSuccess() {
  const p = await getProfile().catch(() => null);
  renderProfile(p);
  showScreen('screen-home');
}

// ====== профиль ======
function renderProfile(p) {
  const nick = document.getElementById('profNick');
  const created = document.getElementById('profCreated');
  nick && (nick.textContent = p?.nickname || '—');
  created && (created.textContent = p?.created_at ? new Date(p.created_at).toLocaleString() : '—');
}

// ====== старт приложения ======
async function boot() {
  wireAuthTabs();
  wireAuthForms();
  placeMessageCloudsBehind();

  // если supa не настроен — показываем auth-экран (пустая форма), но без реального сабмита
  const session = await getSession();
  if (session) {
    // профиль и меню
    try {
      const p = await getProfile().catch(() => null);
      renderProfile(p);
    } catch {}
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }

  // реакция на смену авторизации
  onAuthState(async (sess) => {
    if (sess) {
      const p = await getProfile().catch(() => null);
      renderProfile(p);
      showScreen('screen-home');
    } else {
      showScreen('screen-auth');
    }
  });
}

document.addEventListener('DOMContentLoaded', boot);

// ====== фоновые чипы (смски) — всегда позади и не перехватывают клики ======
const FH_MESSAGES = [
  'Я приду к 19:00 ✨','Я возьму пиццу 🍕','Кто возьмёт колу? 🥤','Буду позже 🙈',
  'Добавил плейлист 🎶','Я за хлебом 🍞','Кто за лимонадом? 🍋','Увидимся у входа 🚪',
  'Зайду за напитками 🍻','Давайте фильм посмотрим 🎬','Встречаемся у метро 🚉'
];

function placeMessageCloudsBehind() {
  let root = document.getElementById('fh-message-clouds');
  if (!root) {
    root = document.createElement('div');
    root.id = 'fh-message-clouds';
    root.setAttribute('aria-hidden', 'true');
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '0';
    root.style.pointerEvents = 'none';
    document.body.prepend(root);
  }
  // очистить и накидать чипов
  root.innerHTML = '';
  FH_MESSAGES.slice(0, 16).forEach((t) => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = t;
    el.style.position = 'absolute';
    el.style.left = Math.round(Math.random()*80 + 10) + 'vw';
    el.style.top = Math.round(Math.random()*70 + 10) + 'vh';
    root.appendChild(el);
  });
}
