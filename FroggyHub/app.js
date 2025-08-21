// ИНИТ от повторного запуска
if (window.__FROGGY_BOOTED__) { console.debug('[boot] already'); }
window.__FROGGY_BOOTED__ = true;

// ===== Мелкие утилиты =====
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

// --- API helpers ---
const API = {
  async createEvent(payload){
    const res = await fetch('/.netlify/functions/event-create', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...authHeader() },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error||'Ошибка создания');
    return data.event;
  },
  async joinByCode(code){
    const res = await fetch('/.netlify/functions/event-join', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error||'Код не найден');
    return data.event;
  },
  async loadEventByCode(code){
    const res = await fetch(`/.netlify/functions/event-one?code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error||'Не найдено');
    return data.event;
  }
};

function authHeader(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const toast = (msg)=>alert(msg);

// токен
const TOKEN_KEY = 'FH_JWT';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = t => localStorage.setItem(TOKEN_KEY, t);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ===== Показ экранов =====
const SCREENS = ['auth','lobby','app','final','profile'];
function showScreen(id){
  SCREENS.forEach(name=>{
    const node = document.getElementById(`screen-${name}`);
    if (!node) return;
    node.hidden = (name !== id);
  });
  document.body.dataset.screen = id;
  // «Выйти» только на профиле
  const logoutBtn = $('#btn-logout');
  if (logoutBtn) logoutBtn.hidden = (id !== 'profile');
  console.debug('[screen] ->', id);
}

// ===== Состояние события и навигация =====
const State = { currentEvent:null, mode:'create' };

document.addEventListener('click', async (e)=>{
  const btn = e.target.closest('[data-go]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const go = btn.dataset.go;
  const mode = btn.dataset.mode;
  if (mode){ document.body.dataset.mode = mode; State.mode = mode; }
  if (SCREENS.includes(go)) {
    showScreen(go);
  }
});

// ===== Авто-маршрут после логина =====
async function doLogin(nickname, password){
  const res = await fetch('/.netlify/functions/local-login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ nickname, password }),
  });
  const data = await res.json();
  if (data?.token) {
    setToken(data.token);
    showScreen('lobby');
    return true;
  }
  throw new Error(data?.error || 'Ошибка входа');
}

// Подвяжем существующую форму логина, если она на странице
const loginForm = document.getElementById('login-form') || $('#form-login');
if (loginForm) {
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const nick = $('#login-nickname', loginForm) || $('[name="nickname"]', loginForm);
    const pass = $('#login-password', loginForm) || $('[name="password"]', loginForm);
    if (!nick?.value || !pass?.value) return;
    try {
      await doLogin(nick.value.trim(), pass.value);
    } catch (err) {
      alert(err.message || 'Ошибка входа');
    }
  }, { once:false });
}

// ===== Лобби: создать / присоединиться =====
$('#btn-create')?.addEventListener('click', (e)=>{ e.preventDefault(); showScreen('app'); });

const joinForm = $('#join-form');
if (joinForm) joinForm.addEventListener('submit', e=>e.preventDefault());

// запуск «создать событие»
const saveBtn = $('#btn-save-event') || $('[data-action="save-event"]') || $('[data-role="next"]');
if (saveBtn) saveBtn.addEventListener('click', onSaveEvent);

async function onSaveEvent(){
  try{
    const title = ($('#event-title')?.value || $('#title')?.value || 'Моё событие').trim();
    const date  = ($('#event-date')?.value || $('#date')?.value || '').trim();
    const time  = ($('#event-time')?.value || $('#time')?.value || '').trim();
    const address = ($('#event-address')?.value || $('#address')?.value || '').trim();
    const dress_code = ($('#event-dress')?.value || $('#dress')?.value || '').trim();
    const bring = ($('#event-bring')?.value || $('#bring')?.value || '').trim();
    const comment = ($('#event-comment')?.value || $('#comment')?.value || '').trim();
    const wishlist = collectWishlist();

    const ev = await API.createEvent({ title, date, time, address, dress_code, bring, comment, wishlist });
    State.currentEvent = ev;
    renderFinal(ev);
    toast('Событие создано');
    showScreen('final');
  }catch(e){ alert(e.message||'Ошибка'); }
}

// присоединиться по коду
const joinBtn = $('#btn-join');
if (joinBtn) joinBtn.addEventListener('click', onJoinByCode);
async function onJoinByCode(){
  try{
    const code = ($('#join-code')?.value||'').trim();
    if (!/^\d{6}$/.test(code)) throw new Error('Введите 6-значный код');
    const ev = await API.joinByCode(code);
    State.currentEvent = ev;
    renderFinal(ev);
    toast('Подключено');
    showScreen('final');
  }catch(e){ alert(e.message||'Код не найден'); }
}

function collectWishlist(){
  return $$('.wish-row').map(row=>{
    const title = $('input[name="wish-title"]', row)?.value?.trim();
    const url   = $('input[name="wish-url"]', row)?.value?.trim();
    return title ? { title, url } : null;
  }).filter(Boolean);
}

// итоговый экран
function renderFinal(ev){
  const codeEl = $('#final-code'); if (codeEl) codeEl.textContent = ev.code || '—';
  setText('#final-when', formatWhen(ev));
  setText('#final-address', ev.address || '—');
  setText('#final-dress', ev.dress_code || '—');
  setText('#final-bring', ev.bring || '—');
  setText('#final-comment', ev.comment || '—');
  startCountdown(ev.date, ev.time);
  const copy = $('#btn-copy-invite');
  if (copy) copy.onclick = ()=>copyInvite(ev);
}
function setText(sel,val){ const n=$(sel); if(n) n.textContent=val; }
function formatWhen(ev){ if(!ev?.date||!ev?.time) return '—'; return `${ev.date} • ${ev.time}`; }

function copyInvite(ev){
  const text=`Привет! Приглашаю тебя на "${ev.title}" 👋\nКогда: ${formatWhen(ev)}\nАдрес: ${ev.address||'—'}\nДресс-код: ${ev.dress_code||'—'}\nЧто взять: ${ev.bring||'—'}\nКод для входа: ${ev.code}\nЗайди на FroggyHub и введи код.`;
  navigator.clipboard.writeText(text).then(()=>toast('Приглашение скопировано'));
}

// таймер
let timerId;
function startCountdown(date, time){
  if (!date || !time) return;
  const target = new Date(`${date}T${time}:00`);
  const outTime = $('#countdown-time');
  const outMeta = $('#countdown-meta');
  clearInterval(timerId);
  const tick=()=>{
    const diff = target - new Date();
    if (diff<=0){ if(outTime) outTime.textContent='00:00'; if(outMeta) outMeta.textContent=''; clearInterval(timerId); return; }
    const d = Math.floor(diff/86400000);
    const h = Math.floor((diff%86400000)/3600000);
    const m = Math.floor((diff%3600000)/60000);
    if(outTime) outTime.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    if(outMeta) outMeta.textContent = d>0 ? `${d} дн.` : '';
  };
  tick(); timerId=setInterval(tick,30000);
}

// ===== Выход (только на экране профиля виден) =====
$('#btn-logout')?.addEventListener('click', (e)=>{
  e.preventDefault();
  clearToken();
  showScreen('auth');
});

// ===== Стартовое состояние =====
showScreen(getToken() ? 'lobby' : 'auth');
