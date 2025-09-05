import { supa, signInSmart, signUpWithNickname, onAuthChanged } from './api.js';

const SCREENS = ['auth','home','profile','settings','create','join','wishlist'];
const qs = (s, r=document)=>r.querySelector(s);
const qa = (s, r=document)=>Array.from(r.querySelectorAll(s));

/* ---------- ROUTER + SCROLL ---------- */
function toggleScrollFor(id){
  const el = qs('#screen-'+id);
  const wantAuto = el?.dataset.scroll === 'auto';
  const overflowed = el ? el.scrollHeight > window.innerHeight : false;
  document.body.classList.toggle('allow-scroll', !!(wantAuto || overflowed));
}

function showScreen(id){
  const target = 'screen-'+(SCREENS.includes(id)?id:'home');
  qa('.screen').forEach(s=>{
    const vis = s.id === target;
    s.classList.toggle('visible', vis);
    s.setAttribute('aria-hidden', String(!vis));
  });
  toggleScrollFor(id);
}

function bindNav(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('[data-link]');
    if (!a) return;
    e.preventDefault();
    const dest = a.getAttribute('data-link');
    if (SCREENS.includes(dest)) showScreen(dest);
  });
}

/* ---------- BUBBLES (без наложений) ---------- */
const BUBBLE_TEXTS = [
  'Друзья, до встречи 🌿','Я приду в 9 ⏰','Кто возьмёт колу? 🥤','Я за хлебом 🥖',
  'Поставлю чайник 🫖','Ребят, постучите в дверь 🚪','Я возьму пиццу 🍕','Добавил плейлист 🎶',
  'Нужны свечи 🕯️','Спойлер: будет торт 🎂'
];

function startBubbles(){
  const host = qs('.fh-bubbles');
  if (!host) return;

  host.innerHTML = `<div class="grid" aria-hidden="true"></div>`;
  const grid = qs('.fh-bubbles .grid');

  const COLS = Math.max(3, Math.floor((window.innerWidth - 120) / 260));
  const ROWS = Math.max(6, Math.floor((window.innerHeight - 160) / 60));
  const slots = new Array(ROWS * COLS).fill(null);

  function randSlot(){
    // ищем свободную клетку
    const free = slots.map((v,i)=>v?null:i).filter(v=>v!==null);
    if (!free.length) return -1;
    return free[Math.floor(Math.random()*free.length)];
  }

  function placeChip(){
    const i = randSlot();
    if (i<0) return; // места нет — подождём следующего цикла
    const text = BUBBLE_TEXTS[Math.floor(Math.random()*BUBBLE_TEXTS.length)];
    const el = document.createElement('div');
    el.className = 'chip';
    el.textContent = text;

    // позиция в grid
    const r = Math.floor(i / COLS) + 1;
    const c = (i % COLS) + 1;
    el.style.gridRow = r;
    el.style.gridColumn = c;

    slots[i] = el;
    grid.appendChild(el);

    const life = 3200 + Math.random()*1200;
    setTimeout(()=>{
      el.style.animation = 'chipOut var(--chip-fade-out) ease forwards';
      setTimeout(()=>{
        grid.removeChild(el);
        slots[i] = null;
      }, 420);
    }, life);
  }

  // начальное наполнение
  for (let k=0; k<Math.min(ROWS*COLS*0.4, 28); k++) setTimeout(placeChip, Math.random()*800);

  // таймер появления
  clearInterval(startBubbles._t);
  startBubbles._t = setInterval(placeChip, 260);
}

window.addEventListener('resize', ()=>startBubbles());

/* ---------- AUTH FORMS ---------- */
function bindAuthForms(){
  const form = qs('#auth-form');
  const err = qs('#login-status');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    err.textContent = '';
    try{
      const fd = new FormData(form);
      const login = fd.get('login');
      const password = fd.get('password');
      const res = await signInSmart({ login, password });
      if (res?.session) showScreen('home');
    }catch(ex){ err.textContent = ex.message || 'Ошибка авторизации'; }
  });

  const reg = qs('#register-form');
  const regErr = qs('#register-status');
  if (reg){
    reg.addEventListener('submit', async (e)=>{
      e.preventDefault();
      regErr.textContent = '';
      try{
        const fd = new FormData(reg);
        await signUpWithNickname({
          nickname: fd.get('nickname'),
          email: fd.get('email'),
          password: fd.get('password')
        });
        showScreen('home');
      }catch(ex){ regErr.textContent = ex.message || 'Ошибка регистрации'; }
    });
  }
}

/* ---------- BOOT ---------- */
async function bootstrap(){
  // фоновые чипы
  // startBubbles();

  // рутинг и формы
  bindNav();
  bindAuthForms();

  // слушаем смену сессии; без конфига supabase — просто стартуем на auth
  onAuthChanged((s)=> showScreen(s ? 'home' : 'auth'));
  // первичный рендер
  showScreen('auth');
}
bootstrap();

// ==== Ambient Bubbles ==================================================
const FH_BUBBLES = (() => {
  // Тексты можно брать из твоего текущего массива сообщений.
  // Если он уже есть (например FH_MESSAGES) — используй его. Иначе — fallback:
  const MESSAGES = (window.FH_MESSAGES && window.FH_MESSAGES.length)
    ? window.FH_MESSAGES
    : [
      'Друзья, до встречи 🌿', 'Кто возьмёт колу? 🥤', 'Я за десерт 🍰', 'Буду с +1 🙂',
      'Я купил шарики 🎈', 'Нужны свечи 🕯', 'Закажем такси? 🚕', 'Принесу проектор 📽️',
      'Кто на лимонад? 🍋', 'Кто возьмёт тарелки? 🍽️'
    ];

  const state = {
    el: null,
    chips: [],
    grid: [],
    cellW: 280,       // базовая ширина ячейки (адаптивно пересчитаем)
    cellH: 44,        // базовая высота чипа
    cols: 0,
    rows: 0,
    excludeRects: [], // сюда добавим auth-карточку
    timer: null,
    poolSize: 48      // максимум видимых
  };

  function init(){
    state.el = document.getElementById('fh-message-clouds');
    if(!state.el) return;

    // рассчитываем сетку
    computeGrid();
    collectExclusions();

    // создаём стартовые чипы
    const count = Math.min(state.poolSize, Math.max(18, Math.floor(state.cols * state.rows * 0.45)));
    for(let i=0;i<count;i++){
      const chip = document.createElement('div');
      chip.className = 'fh-chip';
      chip.textContent = pickMessage();
      chip.style.setProperty('--seed', (Math.random()*2).toFixed(2));
      state.el.appendChild(chip);
      state.chips.push(chip);
    }
    layoutAll();
    cycle();

    // события
    window.addEventListener('resize', onResize, { passive: true });
    const ro = new ResizeObserver(() => { onResize(); });
    const auth = document.querySelector('#screen-auth .card, #auth-card, .auth-card');
    if(auth) ro.observe(auth);
  }

  function pickMessage(){
    return MESSAGES[(Math.random()*MESSAGES.length)|0];
  }

  function computeGrid(){
    const padTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-top-gap')) || 72;
    const padBot = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-bottom-gap')) || 64;
    const gapX   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-gap-x')) || 20;
    const gapY   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bubble-gap-y')) || 18;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // делаем ширину ячейки адаптивной
    state.cellW = Math.max(220, Math.min(360, Math.floor(vw/6)));
    state.cellH = 44;

    const usableW = vw - gapX;
    const usableH = vh - padTop - padBot - gapY;

    state.cols = Math.max(2, Math.floor(usableW / (state.cellW + gapX)));
    state.rows = Math.max(3, Math.floor(usableH / (state.cellH + gapY)));

    // подготавливаем сетку центров
    state.grid = [];
    for(let r=0; r<state.rows; r++){
      for(let c=0; c<state.cols; c++){
        const x = Math.round((gapX/2) + c*(state.cellW+gapX) + (Math.random()*12-6)); // джиттер
        const y = Math.round(padTop + (gapY/2) + r*(state.cellH+gapY) + (Math.random()*10-5));
        state.grid.push({x,y, used:false});
      }
    }
  }

  function collectExclusions(){
    state.excludeRects = [];
    // auth-карточка
    const authPanel = document.querySelector('#screen-auth .card, #auth-card, .auth-card');
    if(authPanel){
      const r = authPanel.getBoundingClientRect();
      // чуть расширим, чтобы вокруг было пространство
      const m = 24;
      state.excludeRects.push({left:r.left-m, top:r.top-m, right:r.right+m, bottom:r.bottom+m});
    }
  }

  function rectsOverlap(a,b){
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function placeChip(chip){
    // Сначала сбросим «занятость»
    state.grid.forEach(g => g.used=false);

    // Текущие занятые прямоугольники: все уже размещённые чипы, + исключения
    const busy = [...state.excludeRects];
    for(const c of state.chips){
      if(c===chip || !c._rect) continue;
      busy.push(c._rect);
    }

    // попробуем до N раз найти свободную ячейку
    for(let k=0;k<60;k++){
      const slot = state.grid[(Math.random()*state.grid.length)|0];
      if(slot.used) continue;

      // оценим размер чипа (примерно — пока без DOM-перемеривания)
      const w = Math.min(state.cellW, Math.max(120, (chip.textContent.length*7 + 24)));
      const h = state.cellH;

      const rect = {
        left: slot.x,
        top:  slot.y,
        right: slot.x + w,
        bottom: slot.y + h
      };

      // проверка на пересечения
      let ok = true;
      for(const b of busy){
        if(rectsOverlap(rect, b)){ ok=false; break; }
      }
      if(!ok) continue;

      // ок — применяем
      chip.style.left = rect.left + 'px';
      chip.style.top  = rect.top  + 'px';
      chip.style.width = w + 'px';
      chip._rect = rect;
      slot.used = true;
      return true;
    }
    return false;
  }

  function layoutAll(){
    // Сначала скрываем всё (без резких анимаций)
    state.chips.forEach(ch => { ch.classList.remove('show'); ch.style.opacity = '0'; });

    // Расставляем
    for(const ch of state.chips){
      if(placeChip(ch)){
        // задержка проявления — для «рождения»
        requestAnimationFrame(() => {
          ch.classList.add('show');
        });
      }
    }
  }

  // каждые 2.5–3.5с случайную порцию чипов «переставляем» через затухание
  function cycle(){
    clearTimeout(state.timer);
    const batch = Math.max(2, Math.round(state.chips.length * 0.12)); // 10–15%
    const picks = new Set();
    while(picks.size < batch){
      picks.add( state.chips[(Math.random()*state.chips.length)|0] );
    }
    picks.forEach(chip => {
      chip.classList.remove('show');          // уйти в fade-out
      setTimeout(() => {
        chip.textContent = pickMessage();     // сменить фразу
        placeChip(chip);                       // найти новое место
        requestAnimationFrame(() => chip.classList.add('show')); // fade-in
      }, 400); // время затухания синхронизировано с CSS transition
    });

    const next = 2500 + (Math.random()*1200|0);
    state.timer = setTimeout(cycle, next);
  }

  function onResize(){
    computeGrid();
    collectExclusions();
    layoutAll();
  }

  return { init };
})();

// Инициализация после существующего bootstrapa приложения
document.addEventListener('DOMContentLoaded', () => {
  // Запускаем фоновые пузыри, но только если есть контейнер экранов
  FH_BUBBLES.init();
});
