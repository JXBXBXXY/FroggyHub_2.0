import { supa } from './api.js';


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
  // --- Старт
document.addEventListener('DOMContentLoaded', route);
}

// ==== BUBBLE ENGINE ===================================================
(function initBubbles(){
  const stage = document.querySelector('.fh-bubbles');
  if (!stage || stage.__ready) return; stage.__ready = true;

  // Сообщения (можно дополнять)
  const MESSAGES = [
    'Кто возьмёт колу? 🥤','Буду с +1 🙂','Зайду за напитками 🛒','Я купил шарики 🎈',
    'Забронировал столик 🍽️','Приеду на час раньше ⏱️','Давайте играть в мафию 😎',
    'Кто возьмёт гитару? 🎸','Нужны свечи 🕯️','Принесу проектор 📽️','Я на машине 🚗',
    'Возьму пледы 🧣','Давайте сделаем фото 📸','Где паркуемся? 🅿️','Я за пиццу 🍕',
    'Кто возьмёт посуду? 🍽️','Я за салатом 🥗','Кто на десерт? 🧁','Поделитесь адресом 🗺️',
    'Скиньте код 🔐','У кого карты? 🃏','Буду онлайн 💻','У меня есть проектор 🔌',
    'Привезу настольный футбол ⚽️','Возьму настолки 🎲'
  ];

  // Настройки
  const LIFE_MS = 3200;         // жизнь 3.2s
  const FADE_MS = 380;          // затухание/появление
  const ORBIT = 8;              // орбитальное дрожание (px)
  const GAP = 14;               // отступ «анти-оверлап»
  const EXCLUDE_MARGIN = 24;    // буфер вокруг карточки

  // Сколько пузырей по площади
  function targetCount(){
    const area = innerWidth * innerHeight;
    if (area > 1.6e6) return 84;         // ~> 1600x1000
    if (area > 9e5)  return 64;          // ~> 1366x768
    if (area > 5e5)  return 44;          // tablets
    return 28;                           // mobile
  }

  // Получить bbox области, куда нельзя ставить (карта авторизации)
  function getExclude(){
    const card = document.querySelector('.auth-wrapper, .fh-card');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return {
      left:  Math.max(0, r.left  - EXCLUDE_MARGIN),
      top:   Math.max(0, r.top   - EXCLUDE_MARGIN),
      right: Math.min(innerWidth,  r.right + EXCLUDE_MARGIN),
      bottom:Math.min(innerHeight, r.bottom+ EXCLUDE_MARGIN)
    };
  }

  // Построить сетку для размещения без пересечений
  function buildGrid(){
    const cols = Math.max(6, Math.floor(innerWidth  / 220)); // ширина ячейки ~220
    const rows = Math.max(6, Math.floor(innerHeight / 120)); // высота  ~120
    const cw = innerWidth / cols, ch = innerHeight / rows;
    const cells = [];
    const exclude = getExclude();
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const cx = x*cw, cy = y*ch;
        const rect = { left:cx, top:cy, right:cx+cw, bottom:cy+ch, cx:cx+cw/2, cy:cy+ch/2 };
        // отсечь область карточки
        if (exclude && !(rect.right < exclude.left || rect.left > exclude.right ||
                         rect.bottom < exclude.top || rect.top > exclude.bottom)) {
          continue;
        }
        cells.push({x, y, rect, taken:false});
      }
    }
    return {cells, cw, ch};
  }

  let grid = buildGrid();

  // Создать/поддерживать нужное число пузырей
  const want = targetCount();
  const bubbles = [];
  for (let i=0;i<want;i++){
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    stage.appendChild(el);
    bubbles.push({el, t0: performance.now() + Math.random()*LIFE_MS});
  }

  // Выбор свободной ячейки, близкой к idx (для равномерности)
  function pickCell(seedIdx = 0){
    const free = grid.cells.filter(c => !c.taken);
    if (!free.length) return null;
    const idx = Math.min(free.length-1, Math.floor(seedIdx % free.length));
    return free[idx];
  }

  // Расстановка без пересечений + «джиттер»
  function place(el, cell){
    const {rect} = cell;
    cell.taken = true;
    const jx = (Math.random()-.5) * (grid.cw*0.25);
    const jy = (Math.random()-.5) * (grid.ch*0.25);
    const x = Math.round(rect.cx + jx);
    const y = Math.round(rect.cy + jy);
    el.style.setProperty('--tx', x+'px');
    el.style.setProperty('--ty', y+'px');
  }

  // Переразметка сетки при ресайзе (debounce)
  let rezTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(rezTimer);
    rezTimer = setTimeout(() => {
      grid = buildGrid();
      // пересадить текущие пузыри на ближайшие свободные ячейки
      grid.cells.forEach(c => c.taken = false);
      bubbles.forEach((b, i) => {
        const cell = pickCell(i*1.7) || grid.cells[i % grid.cells.length];
        if (!cell) return;
        place(b.el, cell);
        b.el.classList.add('is-in');
      });
    }, 120);
  }, {passive:true});

  // Анимация «жизни» + орбита
  function tick(now){
    grid.cells.forEach(c => c.taken = false);
    bubbles.forEach((b, i) => {
      const alive = (now - b.t0) % (LIFE_MS + FADE_MS*2);
      const el = b.el;

      // цикл: fade-in -> live -> fade-out
      if (alive < FADE_MS) {
        // вход
        if (!el.classList.contains('is-in')) el.classList.add('is-in');
      } else if (alive > FADE_MS + LIFE_MS) {
        // выход
        el.classList.remove('is-in');
      }

      // если только что «родился» или «телепортируется» — дать новую ячейку
      if (!el.__cell || !el.classList.contains('is-in') && alive < FADE_MS/2){
        const cell = pickCell(i*2.3) || grid.cells[i % grid.cells.length];
        if (cell){
          place(el, cell);
          el.__cell = cell;
        }
      } else {
        // пометить ячейку занятой, чтобы другие не пересекались
        el.__cell && (el.__cell.taken = true);
      }

      // орбитальное дрожание
      const a = now/1000 * (0.6 + (i%7)/10);
      const ox = Math.cos(a + i)*ORBIT;
      const oy = Math.sin(a*1.1 + i*0.7)*ORBIT;
      el.style.transform = `translate3d(calc(var(--tx) + ${ox}px), calc(var(--ty) + ${oy}px), 0)`;
    });

    requestAnimationFrame(tick);
  }

  // Первичное появление
  requestAnimationFrame(() => {
    grid.cells.forEach(c => c.taken = false);
    bubbles.forEach((b,i) => {
      const cell = pickCell(i*1.3) || grid.cells[i % grid.cells.length];
      if (cell){ place(b.el, cell); b.el.classList.add('is-in'); }
    });
    requestAnimationFrame(tick);
  });
})();

