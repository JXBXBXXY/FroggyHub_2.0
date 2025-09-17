// app.js
import { supa } from './api.js';

/* -------------------- фоновые «облачка» -------------------- */

const FH_MESSAGES = [
  'Я приду к 19:00 ✨','Я возьму пиццу 🍕','Кто возьмёт колу? 🥤','Ребят, постучите в дверь 🚪','Буду позже 🙈',
  'Закажем такси? 🚖','Добавил плейлист 🎶','У кого карты? 🎴','Забронировал столик 🍽️','Сделаем фото 📸',
  'Я за пивом 🍺','Принесу проектор 📽️','Я купил шарики 🎈','Спойлер: будет торт 🎂','Я возьму чипсы 🥨',
  'Друзья, до встречи 🐸','Нужны свечи 🕯️','Кто возьмет настолки? 🎲','Всем привет! 👋','Буду с +1 🙂',
  'Я за сладким 🍩','Кто за лимонадом? 🍋','Прихвачу фрукты 🍇','Поставлю чайник ☕','Возьму пледы 🧣',
  'Захвачу музыку 🔊','Кто возьмет мангал? 🔥','Я за салатом 🥗','Давайте играть в мафию 😎','Поделитесь адресом 🗺️',
  'Где паркуемся? 🅿️','Принесу колонку 📢','Я принесу десерт 🍰','Кто возьмёт свечи? 🕯️','Я возьму сок 🧃',
  'Берите тёплые вещи 🧥','Я за хлопьями 🍿','Нужен штопор? 🍷','Кто возьмёт гитару? 🎸','Давайте устроим караоке 🎤',
  'Привезу настольный футбол ⚽','Я везу кота 🐱','Кто-то едет на велосипеде? 🚲','Приготовлю салаты 🥬','Я за фруктами 🍏',
  'Сделаю лимонад 🍋','У меня есть проектор 📽️','Я приеду на час раньше ⏱️','Привезу геймпад 🎮','Я на метро 🚇',
  'Возьму фотоаппарат 📷','Кто-то пьет чай? 🍵','Я привезу воду 💧','Есть у кого настольный теннис? 🏓','Я за хлебом 🍞',
  'Кто возьмёт кофе? ☕','Давайте фильм посмотрим 🎬','Я приготовлю пасту 🍝','Возьму гитару 🎸','Нужны батарейки? 🔋',
  'Я на машине 🚗','Кто возьмет тарелки? 🍽️','Буду через 15 минут ⏳','Захвачу зонтик ☔','Я возьму торт 🍰',
  'Не забудьте зарядки 🔌','Я уже в пути 🛣️','Поставлю музыку 🎧','Принесу игру в угадайку 🤔','Я за печеньем 🍪',
  'Буду online 💻','Увидимся у входа 🚪','Я за наушниками 🎧','Кто возьмет посуду? 🍽️','Мне нужно такси 🛺',
  'У кого есть карты? 🃏','Заберу пиццу по пути 🍕','Кто за гирляндами? 🌟','Я отпечатаю фото 📸','Кто на десерт? 🍮',
  'Встречаемся у метро 🚉','Я возьму мороженое 🍦'
];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pickMessage = () => FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];

function rectsOverlap(a, b, pad = 0) {
  return !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
}
function desiredBubbleCount() {
  const area = window.innerWidth * window.innerHeight;
  return Math.min(80, Math.max(20, Math.round(area / 12000)));
}
const debounce = (fn, wait=100) => { let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; };

function spawnBubbles(container, count) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = pickMessage();
    container.appendChild(el);

    const c = container.getBoundingClientRect();
    let tries = 0, x = 0, y = 0, ok = false;
    while (tries++ < 60 && !ok) {
      x = 24 + Math.random() * (c.width - 160);
      y = 24 + Math.random() * (c.height - 60);
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      const r1 = el.getBoundingClientRect();
      ok = !placed.some(p => rectsOverlap(r1, p.getBoundingClientRect(), 8));
    }
    requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));

    if (!prefersReduced) {
      const anchor = { x, y };
      const loop = () => {
        const visibleMs = 3000 + Math.random() * 1000;
        setTimeout(() => {
          el.classList.remove('fh-bubble--in');
          el.classList.add('fh-bubble--out');
          el.addEventListener('transitionend', () => {
            el.textContent = pickMessage();
            const dx = Math.random()*80 - 40;
            const dy = Math.random()*80 - 40;

            const { width, height } = el.getBoundingClientRect();
            const nx = Math.max(8, Math.min(c.width  - width  - 8, anchor.x + dx));
            const ny = Math.max(8, Math.min(c.height - height - 8, anchor.y + dy));
            el.style.left = `${nx}px`; el.style.top = `${ny}px`;
            el.classList.remove('fh-bubble--out');
            requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));
            loop();
          }, { once: true });
        }, visibleMs);
      };
      loop();
    } else {
      setInterval(()=>{ el.textContent = pickMessage(); }, 10000 + Math.random()*2000);
    }

    placed.push(el);
  }
}

/* -------------------- мини-роутер и экраны -------------------- */

const LS_KEY = 'fh_session';
const getSavedSession = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
};
const setSavedSession = (s) => {
  try { s ? localStorage.setItem(LS_KEY, JSON.stringify(s)) : localStorage.removeItem(LS_KEY); } catch {}
};

let $auth, $home;

function show($el) {
  [$auth, $home].forEach(x => x && x.classList.remove('visible'));
  if ($el) $el.classList.add('visible');
}

async function route() {
  const hash = (location.hash || '#auth').toLowerCase();

  let session = getSavedSession();
  if (!session && supa?.auth) {
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), 1500);
    try {
      const { data } = await supa.auth.getSession({ signal: ctrl.signal });
      session = data?.session || null;
    } catch {}
    clearTimeout(t);
    if (session) setSavedSession({ user: session.user, access_token: session.access_token });
  }

  const authed = !!session;

  if (!authed) {
    show($auth);
    if (hash !== '#auth') location.hash = '#auth';
    return;
  }

  show($home);
  if (hash !== '#home') location.hash = '#home';
}

/* -------------------- переключение экранов -------------------- */

const ALL_SCREENS = () => Array.from(document.querySelectorAll('.screen'));
function showScreen(id) {
  const target = document.getElementById(id);
  if (!target) return; // защита от «пустого экрана»
  const screens = ALL_SCREENS();
  for (const s of screens) {
    const on = s === target;
    s.toggleAttribute('hidden', !on);
    s.classList.toggle('visible', on);
  }
}

/* Делегирование по [data-go] */
document.addEventListener('click', (e) => {
  const navBtn = e.target.closest('[data-go]');
  if (!navBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const to = navBtn.getAttribute('data-go');
  const mode = navBtn.getAttribute('data-mode') || '';

  const map = {
    menu: 'screen-home',
    'create-conditions': 'screen-create-conditions',
    'create-reqs': 'screen-create-reqs',
    wishlist: 'screen-wishlist',
    app: 'screen-app',
    final: 'screen-final',
    profile: 'screen-profile',
    'join-name': 'screen-join-name',
    'join-wishlist': 'screen-join-wishlist',
    auth: 'screen-auth',
  };

  if (to === 'app' && mode === 'create') {
    showScreen('screen-create-conditions');
    return;
  }

  const targetId = map[to] || to;
  showScreen(targetId);
});

/* -------------------- биндинг UI -------------------- */

function bindTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabReg   = document.getElementById('tab-register');
  const paneLogin= document.getElementById('pane-login');
  const paneReg  = document.getElementById('pane-register');
  if (!tabLogin || !tabReg || !paneLogin || !paneReg) return;

  const activate = (which) => {
    const loginActive = which === 'login';
    tabLogin.classList.toggle('is-active', loginActive);
    tabReg.classList.toggle('is-active', !loginActive);
    paneLogin.classList.toggle('is-hidden', !loginActive);
    paneReg.classList.toggle('is-hidden', loginActive);
    tabLogin.setAttribute('aria-selected', String(loginActive));
    tabReg.setAttribute('aria-selected', String(!loginActive));
  };

  tabLogin.addEventListener('click', () => activate('login'));
  tabReg.addEventListener('click', () => activate('register'));
}

function bindAuthForms() {
  if (window.FH?.__authBound) return;
  window.FH = window.FH || {};
  window.FH.__authBound = true;

  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  async function handle(form, kind) {
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const nickname = (fd.get('nickname') || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      if (!nickname || !password) return;

      const email = nickname.includes('@') ? nickname : `${nickname}@local`;
      try {
        let ok = false, session = null;

        if (kind === 'login') {
          const { data, error } = await supa.auth.signInWithPassword({ email, password });
          if (!error) { ok = true; session = data.session; }
        } else {
          const { error } = await supa.auth.signUp({ email, password });
          if (!error) {
            const r = await supa.auth.signInWithPassword({ email, password });
            ok = !r.error; session = r.data.session;
          }
        }

        if (ok && session) {
          setSavedSession({ user: session.user, access_token: session.access_token });
          location.hash = '#home';
          await route();
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  handle(loginForm, 'login');
  handle(signupForm, 'signup');

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action="login"], [data-action="signup"], .js-login, .js-signup');
    if (!btn) return;
    ev.preventDefault();
    const isLogin = btn.matches('[data-action="login"], .js-login');
    const form = btn.closest('form') || (isLogin ? loginForm : signupForm);
    if (!form) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

function bindNav() {
  // верхнее меню по data-link
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const to = btn.getAttribute('data-link');
    if (to === 'home') location.hash = '#home';
    if (to === 'profile') location.hash = '#profile';
    if (to === 'settings') location.hash = '#settings';
  });

  // форма «Присоединиться» — ведём в мастер join
  const joinBtn   = document.getElementById('join-btn');
  const joinInput = document.getElementById('join-code');
  if (joinBtn && joinInput) {
    joinBtn.addEventListener('click', () => {
      const code = (joinInput.value || '').trim();
      if (!/^[A-Z0-9]{6}$|^\d{6}$/.test(code.toUpperCase())) {
        joinInput.classList.add('input-error');
        setTimeout(()=> joinInput.classList.remove('input-error'), 800);
        return;
      }
      const c = code.toUpperCase();
      // 👉 теперь на страницу с вводом имени/RSVP:
      window.location.href = `/hub.html?step=join&code=${encodeURIComponent(c)}`;
    });
  }
}

/* -------------------- bootstrap -------------------- */

function bootBubbles() {
  const root = document.querySelector('.fh-bubbles');
  if (!root) return;
  root.innerHTML = '';
  spawnBubbles(root, desiredBubbleCount());
  window.addEventListener('resize', debounce(() => {
    root.innerHTML = '';
    spawnBubbles(root, desiredBubbleCount());
  }, 200));
}

document.addEventListener('DOMContentLoaded', () => {
  $auth = document.getElementById('screen-auth');
  $home = document.getElementById('screen-home');

  bindTabs();
  bindAuthForms();
  bindNav();
  bootBubbles();
  route();
});

window.addEventListener('hashchange', route);
