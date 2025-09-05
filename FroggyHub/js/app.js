import { supa } from './api.js';

const FH_MESSAGES = [
  "Я возьму пиццу 🍕",
  "Я приду в 9 ⏰",
  "Ребят, постучите в дверь 🚪",
  "Кто возьмет колу? 🥤",
  "Буду с +1 😊",
  "Спойлер: будет торт 🎂",
  "Добавил плейлист 🎶",
  "Беру настолки! 🎲",
  "Давайте сегодня тусовку?",
  "Приходи к 19:00 ✨",
  "Я возьму чипсы",
  "Друзья, до встречи 🐸",
  "Я за пивом 🍺",
  "Забронировал столик 🍽️",
  "Принесу проектор 📽️",
  "Закажем такси? 🚖",
  "Я купил шарики 🎈",
  "Кто возьмёт гитару? 🎸",
  "Я буду позже 🙈",
  "У кого карты? 🃏",
  "Я за сладким 🍩",
  "Давайте сделаем фото 📸"
];

function spawnBubbles(container, count = 40) {
  const placedBubbles = [];

  function isOverlapping(x, y, w, h) {
    return placedBubbles.some(b => !(x + w < b.x || b.x + b.w < x || y + h < b.y || b.y + b.h < y));
  }

  for (let i = 0; i < count; i++) {
    const bubble = document.createElement("div");
    bubble.className = "fh-bubble";
    bubble.textContent = FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
    bubble.style.position = "absolute";
    bubble.style.visibility = "hidden";
    bubble.style.animationDelay = `${Math.random() * 5}s`;
    bubble.style.background = Math.random() > 0.5 ? 'var(--brand-600)' : 'var(--brand-700)';
    container.appendChild(bubble);

    const { width: w, height: h } = bubble.getBoundingClientRect();
    let x, y, attempts = 0;
    do {
      x = Math.random() * (container.clientWidth - w);
      y = Math.random() * (container.clientHeight - h);
      attempts++;
    } while (isOverlapping(x, y, w, h) && attempts < 50);

    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.visibility = "visible";
    placedBubbles.push({ x, y, w, h });

    setInterval(() => {
      bubble.textContent = FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
    }, 10000 + Math.random() * 5000);
  }
}

// ---- BOOTSTRAP (один раз) -----------------------------------
if (!window.FH) window.FH = {};
if (window.FH.__booted) { /* уже проинициализировано */ }
else {
  window.FH.__booted = true;

  // -------- Supabase: получить клиент (через существующий _supabase.js)
  // ожидается window.supabase уже сконфигурирован
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

  // --- Навигационные кнопки (делегирование)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const to = btn.getAttribute('data-link');
    if (to === 'home') location.hash = '#home';
    else if (to === 'profile') location.hash = '#profile';   // сейчас просто якорь, UI можно расширять
    else if (to === 'settings') location.hash = '#settings'; // якорь
  });

  // --- Обработчики форм логина/регистрации
  (function bindAuth() {
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

        try {
          const supa = getSupabase();
          let ok = false, session = null;

          if (kind === 'login') {
            const { data, error } = await supa.auth.signInWithPassword({ email: `${nickname}@local`, password });
            if (!error) { ok = true; session = data.session; }
          } else {
            const { data, error } = await supa.auth.signUp({ email: `${nickname}@local`, password });
            if (!error) {
              // повторный вход для единообразия
              const r = await supa.auth.signInWithPassword({ email: `${nickname}@local`, password });
              session = r.data.session; ok = !r.error;
            }
          }

          if (ok && session) {
            setSavedSession({ user: session.user, access_token: session.access_token });
            location.hash = '#home'; // триггерит route()
            await route();
          }
        } catch (err) { /* можно показать тост */ }
      });
    }
    handle(loginForm, 'login');
    handle(signupForm, 'signup');
  })();

  // ---- Фоновые «смс» (сетка + локальные орбиты)
  (function bubbles() {
    const root = document.querySelector('.fh-bubbles');
    if (!root) return;

    function init() {
      root.innerHTML = '';
      spawnBubbles(root, 40);
    }

    const reinit = (() => {
      let t;
      return () => { clearTimeout(t); t = setTimeout(init, 120); };
    })();

    init();
    window.addEventListener('resize', reinit, { passive:true });
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', route);
  window.addEventListener('hashchange', route);
}

