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

  // Ensure bubbles layer exists and populated, then kick visibility
  (function ensureBubbles() {
    const stage = document.querySelector('.fh-bubbles');
    if (!stage) return;

    // если уже отрисованы > 20 — ничего не делаем
    if (stage.querySelectorAll('.fh-bubble').length > 20) {
      // На всякий случай: снимем «невидимость», если она зависла
      stage.querySelectorAll('.fh-bubble').forEach(n => n.classList.add('is-in'));
      return;
    }

    const messages = [
      'Кто возьмёт колу? 🥤','Буду с +1 🙂','Зайду за напитками 🛒',
      'Я купил шарики 🎈','Забронировал столик 🍽️','Приеду на час раньше ⏱️',
      'Давайте играть в мафию 😎','Кто возьмёт гитару? 🎸','Нужны свечи 🕯️',
      'Принесу проектор 📽️','Я на машине 🚗','Возьму пледы 🧣',
      'Давайте сделаем фото 📸','Где паркуемся? 🅿️','Я за пиццу 🍕',
      'Кто возьмёт посуду? 🍽️','Я за салатом 🥗','Кто на десерт? 🧁',
      'Поделитесь адресом 🗺️','Скиньте код 🔐','У кого карты? 🃏'
    ];

    // Сколько хотим сразу
    const COUNT = 60;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < COUNT; i++) {
      const b = document.createElement('div');
      b.className = 'fh-bubble';
      b.textContent = messages[Math.floor(Math.random() * messages.length)];
      // временно за экран, чтобы не мигали
      b.style.setProperty('--tx', '-9999px');
      b.style.setProperty('--ty', '-9999px');
      frag.appendChild(b);
    }
    stage.appendChild(frag);

    // Дай браузеру вставить DOM, затем включи «видимость» — сразу,
    // чтобы они не остались прозрачными
    requestAnimationFrame(() => {
      stage.querySelectorAll('.fh-bubble').forEach(n => n.classList.add('is-in'));
    });
  })();

  // ===== BUBBLES: grid + no-overlap + fade swap =====
  (function bubblesManager() {
    const stage = document.querySelector('.fh-bubbles');
    if (!stage) return;

    // параметры
    const GAP = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-gap')) || 12;
    const JITTER = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-jitter')) || 4;
    const SWAP_INTERVAL_MS = 3200;     // каждые ~3.2с
    const SWAP_BATCH = 6;              // сколько пузырей меняем за тик
    const RELAX_STEPS = 6;             // шагов разведения после новой раскладки
    const nodes = Array.from(stage.querySelectorAll('.fh-bubble'));
    if (!nodes.length) return;

    // измеряем
    const items = nodes.map((el, i) => {
      el.style.left = '0px'; el.style.top = '0px';
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      el.style.transform = 'translate3d(-9999px,-9999px,0)';
      return { el, i, w, h, ax: 0, ay: 0, x: 0, y: 0 };
    });

    function stageSize() { return { W: stage.clientWidth, H: stage.clientHeight }; }

    // строим сетку якорей под средний размер пузыря + GAP
    function makeAnchors() {
      const { W, H } = stageSize();
      const avgW = items.reduce((s, it) => s + it.w, 0) / items.length;
      const avgH = items.reduce((s, it) => s + it.h, 0) / items.length;
      const cellW = Math.max(120, Math.round(avgW + GAP * 2));
      const cellH = Math.max(48,  Math.round(avgH + GAP * 2));

      const cols = Math.max(1, Math.floor(W / cellW));
      const rows = Math.max(1, Math.floor(H / cellH));
      const anchors = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = Math.round((c + 0.5) * (W / cols));
          const cy = Math.round((r + 0.5) * (H / rows));
          // лёгкий джиттер якоря, чтоб не было идеальной сетки
          const jx = (Math.random() * 2 - 1) * (cellW * 0.15);
          const jy = (Math.random() * 2 - 1) * (cellH * 0.15);
          anchors.push({ x: clamp(cx + jx, GAP, W - GAP), y: clamp(cy + jy, GAP, H - GAP) });
        }
      }
      return anchors;
    }

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    // быстрая проверка пересечений прямоугольников с зазором GAP
    function isOverlap(a, b) {
      return !(a.x + a.w + GAP <= b.x ||
               b.x + b.w + GAP <= a.x ||
               a.y + a.h + GAP <= b.y ||
               b.y + b.h + GAP <= a.y);
    }

    // «полочное» начальное размещение + релаксация (разведение)
    function placeWithoutOverlap(targets) {
      // 1) начально просто проставим центры по ближайшим якорям
      const rects = items.map((it, idx) => {
        const t = targets[idx % targets.length];
        return { idx, x: Math.round(t.x - it.w / 2), y: Math.round(t.y - it.h / 2), w: it.w, h: it.h };
      });

      // 2) несколько итераций разведения
      for (let s = 0; s < RELAX_STEPS; s++) {
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const A = rects[i], B = rects[j];
            if (isOverlap(A, B)) {
              const dx = ((A.x + A.w / 2) <= (B.x + B.w / 2)) ? -1 : 1;
              const dy = ((A.y + A.h / 2) <= (B.y + B.h / 2)) ? -1 : 1;
              A.x += dx; B.x -= dx;
              A.y += dy; B.y -= dy;
            }
          }
        }
      }

      // 3) применяем
      for (const R of rects) {
        const it = items[R.idx];
        it.ax = clamp(R.x, GAP, stage.clientWidth  - GAP - it.w);
        it.ay = clamp(R.y, GAP, stage.clientHeight - GAP - it.h);
        it.x = it.ax; it.y = it.ay;
        it.el.style.setProperty('--tx', it.x + 'px');
        it.el.style.setProperty('--ty', it.y + 'px');
        it.el.classList.add('is-in');
      }
    }

    // начальная раскладка
    let anchors = shuffle(makeAnchors());
    placeWithoutOverlap(anchors);

    // анимация лёгкого «дрожания» вокруг якорей (не нарушаем GAP)
    let t0 = performance.now();
    function tick(now) {
      const dt = (now - t0) / 1000; t0 = now;
      for (const it of items) {
        const ang = now * 0.00025 + it.i * 0.61;
        const jx = Math.cos(ang) * JITTER;
        const jy = Math.sin(ang * 1.33) * JITTER;
        const nx = clamp(it.ax + jx, GAP, stage.clientWidth  - GAP - it.w);
        const ny = clamp(it.ay + jy, GAP, stage.clientHeight - GAP - it.h);
        // плавно к цели
        it.x += (nx - it.x) * 0.12;
        it.y += (ny - it.y) * 0.12;
        it.el.style.setProperty('--tx', Math.round(it.x) + 'px');
        it.el.style.setProperty('--ty', Math.round(it.y) + 'px');
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // циклическая «жизнь»: fade-swap части пузырей
    setInterval(() => {
      // обновим сетку якорей и возьмём случайные позиции
      anchors = shuffle(makeAnchors());

      // выберем батч для обновления (частично — выглядят как «перемешивание»)
      const batch = shuffle([...items]).slice(0, Math.min(SWAP_BATCH, items.length));

      // иногда делаем настоящий swap: меняем местами якоря двух тузов
      if (items.length >= 2 && Math.random() < 0.5) {
        const a = items[Math.floor(Math.random() * items.length)];
        const b = items[Math.floor(Math.random() * items.length)];
        const tmpX = a.ax, tmpY = a.ay;
        a.ax = b.ax; a.ay = b.ay;
        b.ax = tmpX; b.ay = tmpY;
      }

      // остальным — новые точки с разведением
      const targetRects = batch.map((it, idx) => {
        const t = anchors[(it.i + idx * 3) % anchors.length];
        return { idx: it.i, x: Math.round(t.x - it.w / 2), y: Math.round(t.y - it.h / 2), w: it.w, h: it.h };
      });

      // разведём внутри батча
      for (let s = 0; s < RELAX_STEPS; s++) {
        for (let i = 0; i < targetRects.length; i++) {
          for (let j = i + 1; j < targetRects.length; j++) {
            const A = targetRects[i], B = targetRects[j];
            if (isOverlap(A, B)) {
              const dx = ((A.x + A.w / 2) <= (B.x + B.w / 2)) ? -1 : 1;
              const dy = ((A.y + A.h / 2) <= (B.y + B.h / 2)) ? -1 : 1;
              A.x += dx; B.x -= dx;
              A.y += dy; B.y -= dy;
            }
          }
        }
      }

      // плавный цикл: затухание → перенос → проявление
      batch.forEach((it) => it.el.classList.remove('is-in'));
      setTimeout(() => {
        for (const R of targetRects) {
          const it = items[R.idx];
          it.ax = clamp(R.x, GAP, stage.clientWidth  - GAP - it.w);
          it.ay = clamp(R.y, GAP, stage.clientHeight - GAP - it.h);
          // мгновенно ставим новые якоря, фактическая позиция «догонит» через tick()
          it.el.style.setProperty('--tx', Math.round(it.x) + 'px');
          it.el.style.setProperty('--ty', Math.round(it.y) + 'px');
        }
        // проявляемся
        requestAnimationFrame(() => batch.forEach((it) => it.el.classList.add('is-in')));
      }, 450); // тайм под CSS transition
    }, SWAP_INTERVAL_MS);

    // перераскладка при ресайзе
    let resizeId;
    window.addEventListener('resize', () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => {
        anchors = shuffle(makeAnchors());
        placeWithoutOverlap(anchors);
      }, 150);
    });

    function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', route);
}

