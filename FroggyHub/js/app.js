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
(function bubblesInit(){
  const stage = document.querySelector('.fh-bubbles');
  if (!stage || stage.__init) return; stage.__init = true;

  const MESSAGES = [
    'Кто возьмёт колу? 🥤','Буду с +1 🙂','Заберу пиццу по пути 🍕','Я на машине 🚗',
    'У кого карты? 🃏','Принесу проектор 📽️','Давайте сделаем фото 📸','Буду онлайн 💻',
    'Зайду за напитками 🛒','Кто возьмёт посуду? 🍽️','Нужны свечи 🕯️','Привезу настолки 🎲',
    'Приеду раньше ⏱️','Где паркуемся? 🅿️','Давайте сегодня тусовку? ✨','Я за салатом 🥗'
  ];

  // параметры анимации
  const LIFE = 3200;      // «жизнь» чипа
  const FADE = 380;       // фейд
  const PAD = 14;         // зазор между чипами
  const ORBIT = 8;        // небольшое «дыхание» вокруг точки

  // оценка размеров чипа для сетки
  const probe = document.createElement('div');
  probe.className = 'fh-bubble is-in';
  probe.style.position='absolute';
  probe.style.visibility='hidden';
  probe.textContent='Давайте сделаем фото 📸';
  stage.appendChild(probe);
  const BH = Math.max(32, probe.getBoundingClientRect().height);
  const BW = Math.max(160, probe.getBoundingClientRect().width);
  probe.remove();

  function authRect(){
    const card = document.querySelector('.auth-wrapper, .fh-card');
    if(!card) return null;
    const r = card.getBoundingClientRect();
    const m = 24; // маленькая «буферная зона» вокруг карточки
    return {left:r.left-m, top:r.top-m, right:r.right+m, bottom:r.bottom+m};
  }

  // Построение сетки с «буфером» и маской занятых соседей
  function buildGrid(){
    const ex = authRect();
    const cols = Math.max(6, Math.floor(innerWidth / (BW + PAD*2)));
    const rows = Math.max(6, Math.floor(innerHeight / (BH + PAD*2)));
    const cw = innerWidth / cols, ch = innerHeight / rows;

    const cells = [];
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const cx = x*cw + cw/2;
        const cy = y*ch + ch/2;
        const left = cx - BW/2 - PAD, top = cy - BH/2 - PAD,
              right = cx + BW/2 + PAD, bottom = cy + BH/2 + PAD;

        // не заходим в область карточки авторизации
        if (ex && !(right < ex.left || left > ex.right || bottom < ex.top || top > ex.bottom)) continue;

        cells.push({x, y, cx, cy, taken:false});
      }
    }
    return {cells, cols, rows, cw, ch};
  }

  let grid = buildGrid();
  const TARGET = Math.min(grid.cells.length, 72); // не больше количества доступных ячеек

  // запрещаем соседние клетки (чтобы чипы не соприкасались)
  function markNeighborhood(cell, mark){
    for (const c of grid.cells){
      if (Math.abs(c.x - cell.x) <= 1 && Math.abs(c.y - cell.y) <= 1){
        c.taken = mark;
      }
    }
  }

  function freeCells(){
    return grid.cells.filter(c => !c.taken);
  }

  // создаём DOM-чипы
  const chips = Array.from({length: TARGET}, (_,i)=>{
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = MESSAGES[Math.floor(Math.random()*MESSAGES.length)];
    stage.appendChild(el);
    return {el, cell:null, t0: performance.now() + i*60};
  });

  // размещение в свободной ячейке (без соседей)
  function place(chip){
    const pool = freeCells();
    if (!pool.length) return;
    const cell = pool[Math.floor(Math.random()*pool.length)];
    chip.cell = cell;
    markNeighborhood(cell, true);

    // случайный легкий сдвиг внутри ячейки
    const jx = (Math.random()-.5) * (grid.cw - BW - PAD*2);
    const jy = (Math.random()-.5) * (grid.ch - BH - PAD*2);
    setPos(chip.el, cell.cx + jx, cell.cy + jy);
    chip.el.classList.add('is-in');
  }

  function setPos(el, cx, cy){
    // орбита дышит в RAF, базовые координаты — дата-атрибуты
    el.dataset.baseX = String(cx);
    el.dataset.baseY = String(cy);
    el.style.setProperty('--tx', `${Math.round(cx)}px`);
    el.style.setProperty('--ty', `${Math.round(cy)}px`);
  }

  // первичное размещение
  for(const chip of chips) place(chip);

  // цикл: выцветаем → освобождаем ячейку → берём новую
  function tick(now){
    for(const chip of chips){
      const age = now - chip.t0;
      if (age > LIFE){
        chip.t0 = now;
        // fade-out
        chip.el.classList.remove('is-in');
        const old = chip.cell;
        if (old){ markNeighborhood(old, false); chip.cell = null; }
        // подождать fade, затем показать в новой ячейке
        setTimeout(()=>place(chip), FADE);
      }else{
        // лёгкая орбита
        const bx = Number(chip.el.dataset.baseX||0);
        const by = Number(chip.el.dataset.baseY||0);
        const ox = Math.sin(now/900 + bx*0.001)*ORBIT;
        const oy = Math.cos(now/1100 + by*0.001)*ORBIT;
        chip.el.style.setProperty('--tx', `${Math.round(bx+ox)}px`);
        chip.el.style.setProperty('--ty', `${Math.round(by+oy)}px`);
      }
    }
    raf = requestAnimationFrame(tick);
  }
  let raf = requestAnimationFrame(tick);

  // перестройка на ресайз/ориентацию
  let rto;
  addEventListener('resize', ()=>{
    clearTimeout(rto);
    rto = setTimeout(()=>{
      cancelAnimationFrame(raf);
      grid = buildGrid();
      // снять все блокировки и раскидать заново
      grid.cells.forEach(c=>c.taken=false);
      for(const chip of chips){ chip.el.classList.remove('is-in'); }
      setTimeout(()=>{ for(const chip of chips){ place(chip); } raf = requestAnimationFrame(tick); }, FADE);
    }, 120);
  }, {passive:true});
})();

