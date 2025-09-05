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
  startBubbles();

  // рутинг и формы
  bindNav();
  bindAuthForms();

  // слушаем смену сессии; без конфига supabase — просто стартуем на auth
  onAuthChanged((s)=> showScreen(s ? 'home' : 'auth'));
  // первичный рендер
  showScreen('auth');
}
bootstrap();
