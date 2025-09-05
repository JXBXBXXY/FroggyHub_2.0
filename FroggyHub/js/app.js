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
  'Я возьму мороженое 🍦',
  'Поставлю плейлист вечера 🎵',
  'Привезу настольный хоккей 🏒',
  'Я беру карты Таро 🃏',
  'Прихвачу селфи-палку 🤳',
  'Запасуся маршмеллоу 🍡',
  'Буду на самокате 🛴',
  'Захвачу настольный дартс 🎯',
  'У кого есть мяч? 🏀',
  'Привезу лампу лаву 🪔',
  'Я с домашним лимонадом 🍹',
  'Захвачу гитару-бас 🎸',
  'Принесу плейстейшен 🎮',
  'Кто возьмёт микрофон? 🎙️',
  'Я куплю фейерверки 🎆',
  'Привезу попкорн 🍿',
  'Зайду за напитками 🍻',
  'Подготовлю викторину ❓',
  'Привезу селфи-зону 📸',
  'Захвачу набор для рисования 🎨',
  'Кто принесёт настольные игры? 🎲'
];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickMessage() {
  return FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
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
  const screens = document.querySelectorAll('.screen');
  function showScreen(name){
    screens.forEach(s=>s.classList.remove('visible'));
    const el=document.getElementById(`screen-${name}`);
    if(el) el.classList.add('visible');
  }

  // --- Простенький роутер
  async function route() {
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
      showScreen('auth');
      return;
    }

    showScreen('home');
  }

  // --- Навигационные кнопки (делегирование)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const to = btn.getAttribute('data-link');
    if (to === 'home') showScreen('home');
    else if (to === 'profile') showScreen('profile');
    else if (to === 'settings') showScreen('settings');
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
            showScreen('home');
          }
        } catch (err) { /* можно показать тост */ }
      });
    }
    handle(loginForm, 'login');
    handle(signupForm, 'signup');
  })();

  // ---- Фоновые «смс» без перекрытия
  (function initBubblesNoOverlap() {
    const container = document.querySelector('.fh-bubbles');
    if (!container) return;

    // подготовка и генерация пузырей
    container.innerHTML = '';
    const MAX = window.innerWidth >= 1200 ? 36 : window.innerWidth >= 900 ? 26 : 16;
    for (let i = 0; i < MAX; i++) {
      const el = document.createElement('div');
      el.className = 'fh-bubble';
      el.textContent = pickMessage();
      container.appendChild(el);
    }

    const GAP = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-gap')) || 12;
    const PAD = 8;
    const MAX_JITTER = prefersReduced ? 0 : 4;
    const MAX_RELAX_STEPS = 8;
    const VIEW_W = container.clientWidth;
    const VIEW_H = container.clientHeight;

    const nodes = Array.from(container.querySelectorAll('.fh-bubble'));
    if (!nodes.length) return;

    const items = nodes.map((el, i) => {
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      return { el, i, w, h, x: 0, y: 0, ax: 0, ay: 0, jx: 0, jy: 0 };
    });

    // pack по «полкам»
    let cursorX = GAP, cursorY = GAP, rowH = 0;
    for (const it of items) {
      const w = it.w + GAP + PAD * 2;
      const h = it.h + GAP + PAD * 2;

      if (cursorX + w > VIEW_W - GAP) {
        cursorX = GAP;
        cursorY += rowH;
        rowH = 0;
      }
      it.ax = cursorX + PAD;
      it.ay = cursorY + PAD;
      it.x = it.ax;
      it.y = it.ay;

      cursorX += w;
      rowH = Math.max(rowH, h);
    }

    function relaxOnce() {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          const ax2 = a.x, ay2 = a.y, aw = a.w, ah = a.h;
          const bx2 = b.x, by2 = b.y, bw = b.w, bh = b.h;

          const overlapX = Math.max(0, Math.min(ax2 + aw + GAP, bx2 + bw + GAP) - Math.max(ax2 - GAP, bx2 - GAP) - (aw + bw));
          const overlapY = Math.max(0, Math.min(ay2 + ah + GAP, by2 + bh + GAP) - Math.max(ay2 - GAP, by2 - GAP) - (ah + bh));

          if (overlapX > 0 || overlapY > 0) {
            const pushX = overlapX * 0.5 * (a.x <= b.x ? -1 : 1);
            const pushY = overlapY * 0.5 * (a.y <= b.y ? -1 : 1);
            a.x += pushX;  a.y += pushY;
            b.x -= pushX;  b.y -= pushY;
            a.x = Math.max(GAP, Math.min(a.x, VIEW_W - GAP - a.w));
            b.x = Math.max(GAP, Math.min(b.x, VIEW_W - GAP - b.w));
            a.y = Math.max(GAP, Math.min(a.y, VIEW_H - GAP - a.h));
            b.y = Math.max(GAP, Math.min(b.y, VIEW_H - GAP - b.h));
          }
        }
      }
    }
    for (let i = 0; i < MAX_RELAX_STEPS; i++) relaxOnce();

    for (const it of items) {
      it.el.style.left = `${it.x}px`;
      it.el.style.top  = `${it.y}px`;
      it.el.style.transform = `translate3d(0,0,0)`;
      it.el.style.opacity = '1';
    }

    let t0 = performance.now();
    function tick(now) {
      const dt = (now - t0) / 1000;
      t0 = now;

      for (const it of items) {
        const ang = (now * 0.0002) + it.i * 0.37;
        const jx = Math.cos(ang) * MAX_JITTER;
        const jy = Math.sin(ang * 1.2) * MAX_JITTER;
        let nx = it.ax + jx;
        let ny = it.ay + jy;
        it.x += (nx - it.x) * 0.08;
        it.y += (ny - it.y) * 0.08;
        it.x = Math.max(GAP, Math.min(it.x, VIEW_W - GAP - it.w));
        it.y = Math.max(GAP, Math.min(it.y, VIEW_H - GAP - it.h));
      }

      relaxOnce();

      for (const it of items) {
        it.el.style.transform = `translate3d(${Math.round(it.x)}px, ${Math.round(it.y)}px, 0)`;
      }

      requestAnimationFrame(tick);
    }
    for (const it of items) {
      it.el.style.left = '0px';
      it.el.style.top  = '0px';
      it.el.style.position = 'absolute';
    }
    requestAnimationFrame(tick);

    let rAf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(rAf);
      rAf = requestAnimationFrame(() => initBubblesNoOverlap());
    }, { passive: true });
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', route);
}

