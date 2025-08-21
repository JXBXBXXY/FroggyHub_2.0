// ИНИТ от повторного запуска
if (window.__FROGGY_BOOTED__) { console.debug('[boot] already'); }
window.__FROGGY_BOOTED__ = true;

// ===== Мелкие утилиты =====
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

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

// ===== Делегируем клики по кнопкам навигации =====
document.addEventListener('click', (e)=>{
  const go = e.target.closest('[data-go]');
  if (!go) return;
  e.preventDefault();
  e.stopPropagation();
  const to = go.dataset.go;
  if (SCREENS.includes(to)) {
    showScreen(to);
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
if (joinForm) {
  joinForm.addEventListener('submit', async (e)=>{
    e.preventDefault(); e.stopPropagation();
    const code = ($('#join-code')?.value || '').trim();
    if (!code) return;
    // здесь вызов проверки кода/загрузки события
    // после успешной проверки уходим на экран app (или сразу final — по вашей логике)
    showScreen('app');
  });
}

// ===== Выход (только на экране профиля виден) =====
$('#btn-logout')?.addEventListener('click', (e)=>{
  e.preventDefault();
  clearToken();
  showScreen('auth');
});

// ===== Стартовое состояние =====
showScreen(getToken() ? 'lobby' : 'auth');
