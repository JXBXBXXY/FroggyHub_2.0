import { getSession, signOut, signIn, signUpWithNickname, resetPassword } from './api.js';

/* --- auth gate --- */
function setAuthed(on){
  document.body.classList.toggle('authed', !!on);
  document.body.classList.toggle('guest', !on);
}
async function gate(){
  try{
    const sess = await getSession();
    setAuthed(!!sess);

    const here = (location.pathname.split('/').pop() || '').toLowerCase();
    const isLogin = here === '' || here === 'index.html' || here === 'login.html';

    if (!sess && !isLogin) location.href = './login.html';
    if (sess && isLogin)  location.href = './lobby.html';
  }catch(e){
    setAuthed(false);
  }
}

/* logout */
document.addEventListener('click', (e)=>{
  const a = e.target.closest('#btn-logout');
  if (!a) return;
  e.preventDefault();
  signOut()?.finally(()=>location.href='./');
});

/* --- tabs on login page --- */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t===btn));
  const key = btn.dataset.tab;
  document.querySelectorAll('[data-pane]').forEach(p=>p.hidden = (p.dataset.pane !== key));
});

/* --- forms --- */
document.addEventListener('submit', async (e)=>{
  // Login
  if (e.target.id === 'formLogin'){
    e.preventDefault();
    const login = document.getElementById('loginLogin').value.trim();
    const password = document.getElementById('loginPassword').value;
    const out = document.getElementById('loginErr'); out.textContent='';
    try{
      const { error } = await signIn({ login, password });
      if (error) throw error;
      location.href='./lobby.html';
    }catch(err){ out.textContent = err.message || 'Не удалось войти'; }
  }

  // Signup
  if (e.target.id === 'formSignup'){
    e.preventDefault();
    const nickname = document.getElementById('suNickname').value.trim();
    const email    = document.getElementById('suEmail').value.trim();
    const password = document.getElementById('suPass').value;
    const out = document.getElementById('signupErr'); out.textContent='';
    try{
      const { error } = await signUpWithNickname({ nickname, email, password });
      if (error) throw error;
      location.href='./lobby.html';
    }catch(err){ out.textContent = err.message || 'Регистрация не удалась'; }
  }

  // Reset
  if (e.target.id === 'formReset'){
    e.preventDefault();
    const email = document.getElementById('rpEmail').value.trim();
    const ok = document.getElementById('resetOk'); const err = document.getElementById('resetErr');
    ok.textContent = err.textContent = '';
    try{
      const { error } = await resetPassword(email);
      if (error) throw error;
      ok.textContent = 'Письмо отправлено ✉️';
    }catch(ex){ err.textContent = ex.message || 'Не удалось отправить письмо'; }
  }
});

/* --- message chips --- */
const FH_MESSAGES = [
  'Я приду к 19:00 ✨','Я возьму пиццу 🍕','Кто возьмёт колу? 🥤','Буду позже 🙈',
  'Добавил плейлист 🎶','Я за хлебом 🍞','Кто за лимнадом? 🍋','Увидимся у входа 🚪',
  'Зайду за напитками 🍻','Давайте фильм посмотрим 🎬','Встречаемся у метро 🚉'
];

function placeMessageCloudsBehind() {
  let root = document.getElementById('fh-message-clouds');
  if (!root) {
    root = document.createElement('div');
    root.id = 'fh-message-clouds';
    root.setAttribute('aria-hidden', 'true');
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '0';
    root.style.pointerEvents = 'none';
    document.body.prepend(root);
  }
  // очистить и накидать чипов
  root.innerHTML = '';
  FH_MESSAGES.slice(0, 16).forEach((t) => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = t;
    el.style.position = 'absolute';
    el.style.left = Math.round(Math.random()*80 + 10) + 'vw';
    el.style.top = Math.round(Math.random()*70 + 10) + 'vh';
    root.appendChild(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  gate();
  placeMessageCloudsBehind();
});
