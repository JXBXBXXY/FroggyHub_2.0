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
function createJitteredGrid({ cols, rows, jitter, margin }) {
  const anchors = [];
  const w = window.innerWidth - margin * 2;
  const h = window.innerHeight - margin * 2;
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      anchors.push({
        x: margin + c * cw + cw / 2 + (Math.random() * 2 - 1) * jitter,
        y: margin + r * ch + ch / 2 + (Math.random() * 2 - 1) * jitter,
      });
    }
  }
  return anchors;
}

let GRID = createJitteredGrid({
  cols: 10, rows: 8, jitter: 18, margin: 48
});

const MAX = window.innerWidth >= 1200 ? 36 : window.innerWidth >= 900 ? 26 : 16;

function spawnChips(root){
  root.innerHTML='';
  const chips=[];
  for(let i=0;i<MAX;i++){
    const anchor=GRID[Math.floor(Math.random()*GRID.length)];
    chips.push(createChip(root, anchor));
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>updateChips(chips, root)));
}

function createChip(root, anchor){
  const el=document.createElement('div');
  el.className='fh-chip chip-enter';
  el.textContent=pickMessage();
  const offset=()=> (Math.random()<0.5?-1:1)*(12+Math.random()*12);
  const sx=offset(), sy=offset();
  el.style.transform=`translate(${anchor.x+sx}px, ${anchor.y+sy}px)`;
  root.appendChild(el);
  requestAnimationFrame(()=>{
    el.classList.add('chip-enter-active');
    el.style.transform=`translate(${anchor.x}px, ${anchor.y}px)`;
  });
  el.addEventListener('transitionend',()=>el.classList.remove('chip-enter','chip-enter-active'),{once:true});
  return{
    el,
    anchor:{...anchor},
    phase:Math.random()*Math.PI*2,
    omega:prefersReduced?0:(0.08+Math.random()*0.10),
    radius:6+Math.random()*8,
    life:performance.now()+3500+Math.random()*1000,
    leaving:false,
    x:anchor.x,
    y:anchor.y
  };
}

function updateChips(chips, root){
  const now=performance.now();
  const cellSize=80;
  const hash=new Map();

  chips.forEach(chip=>{
    if(chip.leaving) return;
    chip.phase+=chip.omega*(prefersReduced?0:(now-(chip.prev||now))/1000);
    chip.prev=now;
    chip.x=chip.anchor.x+chip.radius*Math.cos(chip.phase);
    chip.y=chip.anchor.y+chip.radius*Math.sin(chip.phase);
    const gx=Math.floor(chip.x/cellSize);
    const gy=Math.floor(chip.y/cellSize);
    const key=gx+','+gy;
    if(!hash.has(key)) hash.set(key,[]);
    hash.get(key).push(chip);
  });

  chips.forEach(chip=>{
    if(chip.leaving) return;
    const gx=Math.floor(chip.x/cellSize);
    const gy=Math.floor(chip.y/cellSize);
    for(let dx=-1;dx<=1;dx++){
      for(let dy=-1;dy<=1;dy++){
        const list=hash.get((gx+dx)+','+(gy+dy));
        if(!list) continue;
        for(const other of list){
          if(other===chip || other.leaving) continue;
          const dxv=chip.x-other.x;
          const dyv=chip.y-other.y;
          const dist=Math.hypot(dxv,dyv);
          const minDist=24;
          if(dist>0 && dist<minDist){
            const push=(minDist-dist)/2;
            const nx=dxv/dist;
            const ny=dyv/dist;
            chip.x+=nx*push;
            chip.y+=ny*push;
            other.x-=nx*push;
            other.y-=ny*push;
          }
        }
      }
    }
  });

  chips.forEach(chip=>{
    chip.el.style.transform=`translate(${chip.x}px, ${chip.y}px)`;
    if(Math.random()<0.1){
      const mult=0.96+Math.random()*0.04;
      chip.el.style.opacity=0.9*mult;
    } else {
      chip.el.style.opacity=0.9;
    }
    if(!chip.leaving && now>chip.life){
      chip.leaving=true;
      const offset=()=> (Math.random()<0.5?-1:1)*(12+Math.random()*12);
      const sx=offset(), sy=offset();
      chip.el.style.transform=`translate(${chip.x+sx}px, ${chip.y+sy}px)`;
      chip.el.classList.add('chip-leave');
      chip.el.offsetWidth;
      chip.el.classList.add('chip-leave-active');
      const t=350+Math.random()*150;
      setTimeout(()=>{
        if (chip.el && chip.el.parentNode) chip.el.parentNode.removeChild(chip.el);
        const anchor=GRID[Math.floor(Math.random()*GRID.length)];
        const n=createChip(root, anchor);
        chips.splice(chips.indexOf(chip),1,n);
      },t);
    }
  });

  requestAnimationFrame(()=>updateChips(chips, root));
}

function desiredBubbleCount(){
  return MAX;
}

function debounce(fn, wait=100){
  let t; return (...args)=>{clearTimeout(t); t=setTimeout(()=>fn.apply(this,args),wait);};
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
    if (!supa) {
      console.warn("[auth] Supabase is not configured");
      return null;
    }
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
          if (!supa) {
            console.warn("[auth] Supabase is not configured");
            return null;
          }
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

  // ---- Фоновые «смс» (сетка + локальные орбиты)
  (function bubbles() {
    const root = document.querySelector('.fh-bubbles');
    if (!root) return;

    spawnChips(root);

    window.addEventListener('resize', debounce(() => {
      GRID = createJitteredGrid({ cols:10, rows:8, jitter:18, margin:48 });
      const box = document.querySelector('.fh-bubbles');
      if (!box) return;
      box.innerHTML = '';
      spawnChips(box);
    }, 200));
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', route);
}

