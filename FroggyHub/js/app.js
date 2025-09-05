import { supa } from './api.js';
window.supa = supa;

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

// ---- bubbles control ----
function startBubbles() {
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
}

// какие экраны у нас есть
const SCREENS = ['auth','home','join','create','wishlist','final','profile','settings'];

function qs(s, r = document) { return r.querySelector(s); }
function qa(s, r = document) { return Array.from(r.querySelectorAll(s)); }

// централизованный показ экрана
function showScreen(name) {
  SCREENS.forEach(id => {
    const el = qs(`#screen-${id}`);
    if (!el) return;
    const vis = id === name;
    el.classList.toggle('visible', vis);
    el.setAttribute('aria-hidden', String(!vis));
  });

  // скролл только на вишлисте
  document.body.classList.toggle('allow-scroll', name === 'wishlist');

  // поддерживаем адресную строку
  if (name) {
    const target = `#${name}`;
    if (location.hash !== target) history.replaceState(null, '', target);
  }
}

// хранилище сессии в рантайме
window.FH = window.FH || {};
FH.session = null;

// слушатель auth состояния (если у тебя уже есть — оставь, только вызови showScreen)
export function onAuthChanged(cb) {
  if (!window.supa) { cb(null); return; }
  return window.supa.auth.onAuthStateChange((_e, s) => cb(s));
}

// начальная загрузка
async function bootstrap() {
  // чипсы запускаются один раз (если есть функция старта — оставь как было)
  if (typeof startBubbles === 'function') startBubbles();

  // пробуем восстановить сессию
  if (window.supa) {
    try {
      const { data } = await window.supa.auth.getSession();
      FH.session = data?.session ?? null;
    } catch { FH.session = null; }
  }

  // если есть #wishlist/#create и т.п. — применим, иначе auth/home
  const wanted = (location.hash || '').replace('#','') || (FH.session ? 'home' : 'auth');
  showScreen(FH.session ? (wanted || 'home') : 'auth');

  // следим за изменением auth
  onAuthChanged(async (session) => {
    FH.session = session;
    if (session) showScreen('home'); else showScreen('auth');
  });

  // клики по навигационным кнопкам
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-link]');
    if (!a) return;
    e.preventDefault();
    const dest = a.getAttribute('data-link');
    if (!dest) return;
    // если не залогинен — держим только на auth
    if (!FH.session && dest !== 'auth') return showScreen('auth');
    showScreen(dest);
  });

  // реакция на изменение хеша (ручной ввод)
  window.addEventListener('hashchange', () => {
    const h = (location.hash || '').replace('#','');
    if (!FH.session && h !== 'auth') return showScreen('auth');
    showScreen(h || (FH.session ? 'home' : 'auth'));
  });

  // обработчик формы логина
  const authForm = qs('#auth-form');
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.supa) return;
      const fd = new FormData(authForm);
      const login = String(fd.get('login') || '').trim();
      const password = String(fd.get('password') || '').trim();
      if (!login || !password) return;
      try {
        // если login похож на email — логинимся по email
        const isEmail = /\S+@\S+\.\S+/.test(login);
        let email = login;
        if (!isEmail) {
          // ник -> получаем email (rpc или твой хелпер; ниже — защита)
          if (window.supa.rpc) {
            const { data, error } = await supa.rpc('get_email_by_nickname', { p_nickname: login });
            if (error) throw error;
            if (!data?.email) throw new Error('Пользователь не найден');
            email = data.email;
          } else {
            throw new Error('Нет RPC для поиска по нику');
          }
        }
        const { data, error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        FH.session = data?.session ?? null;
        showScreen('home');
      } catch (err) {
        console.warn('[auth/login]', err);
        // покажи ошибку пользователю, если есть box
        const box = authForm.querySelector('.form-error');
        if (box) box.textContent = err.message || 'Не удалось войти';
      }
    });
  }

  // обработчик формы регистрации (если нужна)
  const regForm = qs('#register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.supa) return;
      const fd = new FormData(regForm);
      const nickname = String(fd.get('nickname') || '').trim();
      const email    = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '').trim();
      if (!nickname || !email || !password) return;
      try {
        const { data, error } = await supa.auth.signUp({
          email, password,
          options: { data: { nickname } }
        });
        if (error) throw error;
        // после регистрации — сразу логин или верификация почты
        showScreen('home');
      } catch (err) {
        console.warn('[auth/register]', err);
        const box = regForm.querySelector('.form-error');
        if (box) box.textContent = err.message || 'Не удалось зарегистрироваться';
      }
    });
  }
}

bootstrap();

