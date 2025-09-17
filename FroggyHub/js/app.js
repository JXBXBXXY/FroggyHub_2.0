import { supa } from './api.js';

const FH_MESSAGES = [
  'Я приду к 19:00 ✨',
  'Я возьму пиццу 🍕',
  'Кто возьмёт колу? 🥤',
  'Ребят, постучите в дверь 🚪',
  'Буду позже 🙈',
  'Закажем такси? 🚖',
  'Добавил плейлист 🎶',
  'У кого карты? 🎴',
  'Забронировал столик 🍽️',
  'Сделаем фото 📸',
  'Я за пивом 🍺',
  'Принесу проектор 📽️',
  'Я купил шарики 🎈',
  'Спойлер: будет торт 🎂',
  'Я возьму чипсы 🥨',
  'Друзья, до встречи 🐸',
  'Нужны свечи 🕯️',
  'Кто возьмет настолки? 🎲',
  'Всем привет! 👋',
  'Буду с +1 🙂',
  'Я за сладким 🍩',
  'Кто за лимонадом? 🍋',
  'Прихвачу фрукты 🍇',
  'Поставлю чайник ☕',
  'Возьму пледы 🧣',
  'Захвачу музыку 🔊',
  'Кто возьмет мангал? 🔥',
  'Я за салатом 🥗',
  'Давайте играть в мафию 😎',
  'Поделитесь адресом 🗺️',
  'Где паркуемся? 🅿️',
  'Принесу колонку 📢',
  'Я принесу десерт 🍰',
  'Кто возьмёт свечи? 🕯️',
  'Я возьму сок 🧃',
  'Берите тёплые вещи 🧥',
  'Я за хлопьями 🍿',
  'Нужен штопор? 🍷',
  'Кто возьмёт гитару? 🎸',
  'Давайте устроим караоке 🎤',
  'Привезу настольный футбол ⚽',
  'Я везу кота 🐱',
  'Кто-то едет на велосипеде? 🚲',
  'Приготовлю салаты 🥬',
  'Я за фруктами 🍏',
  'Сделаю лимонад 🍋',
  'У меня есть проектор 📽️',
  'Я приеду на час раньше ⏱️',
  'Привезу геймпад 🎮',
  'Я на метро 🚇',
  'Возьму фотоаппарат 📷',
  'Кто-то пьет чай? 🍵',
  'Я привезу воду 💧',
  'Есть у кого настольный теннис? 🏓',
  'Я за хлебом 🍞',
  'Кто возьмёт кофе? ☕',
  'Давайте фильм посмотрим 🎬',
  'Я приготовлю пасту 🍝',
  'Возьму гитару 🎸',
  'Нужны батарейки? 🔋',
  'Я на машине 🚗',
  'Кто возьмет тарелки? 🍽️',
  'Буду через 15 минут ⏳',
  'Захвачу зонтик ☔',
  'Я возьму торт 🍰',
  'Не забудьте зарядки 🔌',
  'Я уже в пути 🛣️',
  'Поставлю музыку 🎧',
  'Принесу игру в угадайку 🤔',
  'Я за печеньем 🍪',
  'Буду online 💻',
  'Увидимся у входа 🚪',
  'Я за наушниками 🎧',
  'Кто возьмет посуду? 🍽️',
  'Мне нужно такси 🛺',
  'У кого есть карты? 🃏',
  'Заберу пиццу по пути 🍕',
  'Кто за гирляндами? 🌟',
  'Я отпечатаю фото 📸',
  'Кто на десерт? 🍮',
  'Встречаемся у метро 🚉',
  'Я возьму мороженое 🍦'
];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickMessage() {
  return FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
}

function rectAt(pos, el) {
  const { width, height } = el.getBoundingClientRect();
  return { left: pos.x, top: pos.y, right: pos.x + width, bottom: pos.y + height };
}

function rectsOverlap(a, b, pad = 0) {
  return !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
}

function overlapsAny(pos, el) {
  const r1 = rectAt(pos, el);
  const nodes = document.querySelectorAll('.fh-bubble.fh-bubble--in');
  for (const n of nodes) {
    if (n === el) continue;
    const r2 = n.getBoundingClientRect();
    if (rectsOverlap(r1, r2, 6)) return true;
  }
  return false;
}

function clampToContainer(p, el) {
  const c = el.parentElement.getBoundingClientRect();
  const { width, height } = el.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(c.width - width - 8, p.x)),
    y: Math.max(8, Math.min(c.height - height - 8, p.y)),
  };
}

function lifeCycle(bubble, anchor) {
  const el = bubble.el;
  if (prefersReduced) {
    bubble.timer = setInterval(() => {
      el.textContent = pickMessage();
    }, 10000 + Math.random() * 2000);
    return;
  }

  const run = () => {
    const visibleMs = 3000 + Math.random() * 1000;
    bubble.timer = setTimeout(() => {
      el.classList.remove('fh-bubble--in');
      el.classList.add('fh-bubble--out');

      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        el.textContent = pickMessage();

        const dx = Math.random() * 80 - 40;
        const dy = Math.random() * 80 - 40;
        const target = clampToContainer({ x: anchor.x + dx, y: anchor.y + dy }, el);

        let tries = 0;
        while (tries < 30 && overlapsAny(target, el)) {
          target.x += Math.random() * 20 - 10;
          target.y += Math.random() * 20 - 10;
          tries++;
        }

        el.style.left = `${target.x}px`;
        el.style.top = `${target.y}px`;

        el.classList.remove('fh-bubble--out');
        requestAnimationFrame(() => el.classList.add('fh-bubble--in'));

        run();
      };

      el.addEventListener('transitionend', onEnd, { once: true });
    }, visibleMs);
  };
  run();
}

function findNonOverlappingPosition(container, el, placed) {
  const c = container.getBoundingClientRect();
  let tries = 0;
  let x, y;
  do {
    x = 24 + Math.random() * (c.width - 160);
    y = 24 + Math.random() * (c.height - 60);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const r1 = el.getBoundingClientRect();
    const hit = placed.some(p => rectsOverlap(r1, p.el.getBoundingClientRect(), 8));
    if (!hit) break;
    tries++;
  } while (tries < 60);
  return { x, y };
}

function desiredBubbleCount() {
  const area = window.innerWidth * window.innerHeight;
  return Math.min(80, Math.max(20, Math.round(area / 12000)));
}

function debounce(fn, wait = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function spawnBubbles(container, count) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = pickMessage();
    container.appendChild(el);

    const pos = findNonOverlappingPosition(container, el, placed);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    requestAnimationFrame(() => el.classList.add('fh-bubble--in'));

    const bubble = { el };
    const anchor = { x: pos.x, y: pos.y };
    const delay = Math.random() * 400;
    setTimeout(() => lifeCycle(bubble, anchor), delay);

    placed.push({ el, x: pos.x, y: pos.y });
  }
}

// ---- BOOTСТАРТ (один раз)
if (!window.FH) window.FH = {};
if (window.FH.__booted) {
  // уже проинициализировано
} else {
  window.FH.__booted = true;

  const getSupabase = () => supa;

  // Локальный кэш сессии
  const LS_KEY = 'fh_session';
  const getSavedSession = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
    catch { return null; }
  };
  const setSavedSession = (s) => {
    try { s ? localStorage.setItem(LS_KEY, JSON.stringify(s)) : localStorage.removeItem(LS_KEY); } catch {}
  };

  // --- Экраны
  const $auth = document.querySelector('#screen-auth');
  const $home = document.querySelector('#screen-home');

  const show = ($el) => { [$auth,$home].forEach(x=>x&&x.classList.remove('visible')); $el && $el.classList.add('visible'); };

  // --- Простенький роутер
  async function route() {
    const hash = (location.hash || '#auth').toLowerCase();
    const supa = getSupabase();
    let session = getSavedSession();

    // быстрая проверка
    if (!session && supa?.auth) {
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), 1500);
      try {
        const { data } = await supa.auth.getSession({ signal: ctrl.signal });
        session = data?.session || null;
      } catch { /* таймаут/ошибка – игнор */ }
      clearTimeout(t);
      if (session) setSavedSession({ user: session.user, access_token: session.access_token });
    }

    const authed = !!session;

    if (!authed) {
      show($auth);
      location.hash = '#auth';
      return;
    }

    // авторизованы
    show($home);
    if (hash !== '#home') location.hash = '#home';
  }

  // --- Навигация (делегирование)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const to = btn.getAttribute('data-link');
    if (to === 'home') location.hash = '#home';
    else if (to === 'profile') location.hash = '#profile';
    else if (to === 'settings') location.hash = '#settings';
  });

  // --- Обработчики форм логина/регистрации
  function bindAuth() {
    if (window.FH.__authBound) return;
    window.FH.__authBound = true;

    const loginForm  = document.querySelector('#loginForm');
    const signupForm = document.querySelector('#signupForm');

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
          const supa = getSupabase();
          let ok = false, session = null;

          if (kind === 'login') {
            const { data, error } = await supa.auth.signInWithPassword({ email, password });
            if (!error) { ok = true; session = data.session; }
          } else {
            const { data, error } = await supa.auth.signUp({ email, password });
            if (!error) {
              const r = await supa.auth.signInWithPassword({ email, password });
              session = r.data.session; ok = !r.error;
            }
          }

          if (ok && session) {
            setSavedSession({ user: session.user, access_token: session.access_token });
            location.hash = '#home';
            await route();
          }
        } catch (err) {
          // можно вывести тост/ошибку
        }
      });
    }
    handle(loginForm, 'login');
    handle(signupForm, 'signup');

    // Страховка для кнопок без type="submit"
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action="login"], [data-action="signup"], .js-login, .js-signup');
      if (!btn) return;
      const isLogin = btn.matches('[data-action="login"], .js-login');
      const form = btn.closest('form') || (isLogin ? loginForm : signupForm);
      if (!form) return;

      ev.preventDefault();
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  }

  // ---- Фоновые «смс»
  (function bubbles() {
    const root = document.querySelector('.fh-bubbles');
    if (!root) return;
    spawnBubbles(root, desiredBubbleCount());
    window.addEventListener('resize', debounce(() => {
      const box = document.querySelector('.fh-bubbles');
      if (!box) return;
      box.innerHTML = '';
      spawnBubbles(box, desiredBubbleCount());
    }, 200));
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', () => {
    bindAuth();
    route();
  });
  window.addEventListener('hashchange', route);
}
