import { supa, signInSmart, signUpWithNickname, getSession, signOut, onAuthChanged } from './api.js';

// Вспомогалки выборки
const qs = (s, r=document) => r.querySelector(s);
const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

const SCREENS = ['auth','home','profile','settings','create','join'];
const SCREEN_IDS = Object.fromEntries(SCREENS.map(n=>[n, `#screen-${n}`]));

/** Показ экрана + обновление hash */
function showScreen(name){
  const id = SCREEN_IDS[name] || name; // допускаем передачу '#screen-…'
  qa('.screen').forEach(el=>{
    const visible = ('#'+el.id) === id;
    el.classList.toggle('visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  // hash только для не-auth
  const target = id.startsWith('#') ? id.slice(1) : id;
  if (!target.includes('auth')) {
    const newHash = '#'+(SCREENS.includes(target.replace('screen-','')) ? target.replace('screen-','') : target);
    if (location.hash !== newHash) history.replaceState(null, '', newHash);
  }
}

/** Навигация по клику на элементы с [data-link] */
function bindNav(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('[data-link]');
    if(!a) return;
    e.preventDefault();
    const to = a.getAttribute('data-link');
    if (SCREENS.includes(to)) showScreen(to);
  });
}

/** Привязка форм авторизации (id="auth-form") и регистрации (id="register-form") */
function bindAuthForms(){
  const loginForm = qs('#auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const login = fd.get('login');
      const password = fd.get('password');
      const errBox = loginForm.querySelector('.form-error');
      try{
        errBox && (errBox.textContent = '');
        await signInSmart({ login, password });
        showScreen('home');
      }catch(err){
        console.warn('[auth:login]', err);
        errBox && (errBox.textContent = err?.message || 'Ошибка входа');
        loginForm.classList.add('shake');
        setTimeout(()=>loginForm.classList.remove('shake'), 600);
      }
    });
  }

  const regForm = qs('#register-form');
  if (regForm){
    regForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(regForm);
      const nickname = fd.get('nickname');
      const email = fd.get('email'); // можно пустым — сгенерим из никнейма
      const password = fd.get('password');
      const errBox = regForm.querySelector('.form-error');
      try{
        errBox && (errBox.textContent = '');
        await signUpWithNickname({ nickname, email, password });
        // после успешной регистрации пробуем залогинить:
        await signInSmart({ login: email || nickname, password });
        showScreen('home');
      }catch(err){
        console.warn('[auth:register]', err);
        errBox && (errBox.textContent = err?.message || 'Ошибка регистрации');
        regForm.classList.add('shake');
        setTimeout(()=>regForm.classList.remove('shake'), 600);
      }
    });
  }
}

/** Инициализация приложения */
async function bootstrap(){
  bindNav();
  bindAuthForms();
  startBubbles();

  // первичная отрисовка
  const session = await getSession().catch(()=>null);
  showScreen(session ? 'home' : 'auth');

  // слушаем изменения авторизации
  onAuthChanged((s)=>{
    showScreen(s ? 'home' : 'auth');
  });
}

// запускаемся один раз
if (!window.__FH_BOOT__) {
  window.__FH_BOOT__ = true;
  bootstrap();
}

// CALM bubbles
const messages = window.FH_MESSAGES || [
  "Друзья, до встречи 🌿","Я за пивом 🍺","Я приду в 9 🕘","Поставлю чайник 🫖","Заберу пиццу по пути 🍕",
  "Кто возьмет колу? 🥤","Добавил плейлист 🎶","Буду +1 🙂","Я за печеньем 🍪","Кто на метро 🚇"
];

function jitterGrid(cols=8, rows=6, margin=16) {
  const w = innerWidth;
  const style = getComputedStyle(document.documentElement);
  const topGap = parseFloat(style.getPropertyValue('--fh-bubbles-top-gap'))||0;
  const bottomGap = parseFloat(style.getPropertyValue('--fh-bubbles-bottom-gap'))||0;
  const h = innerHeight - topGap - bottomGap;
  const cellW = Math.max(160, (w - margin*2) / cols);
  const cellH = Math.max(56,  (h - margin*2) / rows);
  const pts = [];
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    const x = margin + c*cellW + (Math.random()-0.5)*cellW*0.25;
    const y = topGap + margin + r*cellH + (Math.random()-0.5)*cellH*0.25;
    pts.push({x,y});
  }
  return {pts, cellW, cellH};
}

function createChip(msg) {
  const el = document.createElement('div');
  el.className = 'chip';
  el.textContent = msg;
  el.style.position = 'absolute';
  el.style.padding = '6px 14px';
  el.style.borderRadius = '999px';
  el.style.background = 'rgba(23, 65, 53, .85)';
  el.style.boxShadow = '0 2px 10px rgba(0,0,0,.25)';
  el.style.color = 'var(--chip-fg, #e9ffe8)';
  el.style.fontSize = '14px';
  el.style.opacity = '0';
  return el;
}

let bubblesState = { slots: [], idx: 0, holder: null };
function layoutChips() {
  const holder = bubblesState.holder || document.querySelector('.fh-bubbles');
  if (!holder) return;
  holder.replaceChildren();
  const { pts } = jitterGrid(9, 6, 24);
  bubblesState.slots = pts;
  bubblesState.holder = holder;

  const N = Math.min(pts.length, 28);
  for (let i=0; i<N; i++) {
    const msg = messages[(i + Math.floor(Math.random()*messages.length)) % messages.length];
    const chip = createChip(msg);
    const p = pts[i];
    chip.style.left = `${p.x}px`;
    chip.style.top  = `${p.y}px`;
    holder.appendChild(chip);
    requestAnimationFrame(()=> chip.style.opacity = '1');
  }
  // жизненный цикл
  cycleChips();
}

function cycleChips() {
  const holder = bubblesState.holder;
  if (!holder) return;
  const chips = [...holder.children];
  chips.forEach((chip, i) => {
    const delay = 800 + Math.random()*1800; // между волнами
    setTimeout(() => {
      chip.style.opacity = '0';
      chip.style.transform = `translate(${(Math.random()-0.5)*30}px, ${(Math.random()-0.5)*30}px)`;
      setTimeout(() => {
        // выбрать новый свободный слот
        const p = bubblesState.slots[(i + 3 + Math.floor(Math.random()*7)) % bubblesState.slots.length];
        chip.textContent = messages[Math.floor(Math.random()*messages.length)];
        chip.style.left = `${p.x}px`;
        chip.style.top  = `${p.y}px`;
        chip.style.transform = 'translate(0,0)';
        chip.style.opacity = '1';
      }, 600);
    }, 3000 + delay);
  });
  // перезапуск цикла раз в 6–8 секунд
  setTimeout(cycleChips, 6000 + Math.random()*2000);
}

function startBubbles() {
  layoutChips();
  addEventListener('resize', () => {
    // мягко переложить сетку при ресайзе
    clearTimeout(startBubbles.__t);
    startBubbles.__t = setTimeout(layoutChips, 200);
  });
}

