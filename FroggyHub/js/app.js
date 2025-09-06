import { signIn, signUpWithNickname, resetPassword, signOut, getSession, onAuthState, joinEvent } from './api.js';

let fhCloudsRoot;
function ensureCloudsRoot() {
  if (fhCloudsRoot && document.body.contains(fhCloudsRoot)) return fhCloudsRoot;
  if (fhCloudsRoot?.parentNode) fhCloudsRoot.parentNode.removeChild(fhCloudsRoot);
  fhCloudsRoot = document.createElement('div');
  fhCloudsRoot.id = 'fh-message-clouds';
  fhCloudsRoot.setAttribute('aria-hidden', 'true');
  fhCloudsRoot.style.pointerEvents = 'none';
  document.body.prepend(fhCloudsRoot);
  return fhCloudsRoot;
}

// ===== Floating chips (background) =====
const FH_MESSAGES = [
  'Я приду к 19:00 ✨','Я возьму пиццу 🍕','Кто возьмёт колу? 🥤','Ребят, постучите в дверь 🚪',
  'Буду позже 🙈','Добавил плейлист 🎶','Кто возьмет настолки? 🎲','Буду через 15 минут ⏳',
  'Я за пивом 🍺','Буду online 💻','Встречаемся у метро 🚉','Я за мороженым 🍦','Принесу колонку 📢',
  'Сделаем фото 📸','Не забудьте зарядки 🔌','Привезу попкорн 🍿','Подготовлю викторину ❓'
];
const FH = {
  MAX: 20, MARGIN: 20, PLACE_TRIES: 40, MIN_DIST: 120,
  MIN_V: .045, MAX_V: .09, JITTER: .00012, KICK: .12
};
let chips = [], animId = 0, chipsSpawned = false;
function rand(a,b){return Math.random()*(b-a)+a}
function clamp(v,a,b){return Math.min(Math.max(v,a),b)}
function spawnChips(){
  if (chipsSpawned) return;
  chipsSpawned = true;
  const root = ensureCloudsRoot();
  const pool = [...FH_MESSAGES];
  for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0; [pool[i],pool[j]]=[pool[j],pool[i]]}
  const list = pool.slice(0,FH.MAX);
  const W = innerWidth, H = innerHeight;

  function canPlace(cx,cy,w,h){
    if (cx-w/2 < FH.MARGIN || cy-h/2 < FH.MARGIN) return false;
    if (cx+w/2 > W-FH.MARGIN || cy+h/2 > H-FH.MARGIN) return false;
    for(const c of chips){
      const dx=cx-(c.x+c.w/2), dy=cy-(c.y+c.h/2);
      if (dx*dx+dy*dy < FH.MIN_DIST*FH.MIN_DIST) return false;
    }
    return true;
  }
  function nonZeroV(){
    const a=rand(0,Math.PI*2), s=rand(FH.MIN_V,FH.MAX_V);
    return {vx:Math.cos(a)*s, vy:Math.sin(a)*s};
  }

  list.forEach(msg=>{
    const el=document.createElement('div');
    el.className='fh-chip'; el.textContent=msg; root.appendChild(el);
    const r=el.getBoundingClientRect(); const w=r.width||140, h=r.height||40;
    let placed=false, x=FH.MARGIN, y=FH.MARGIN;
    for(let t=0; t<FH.PLACE_TRIES && !placed; t++){
      const cx=rand(FH.MARGIN+w/2, W-FH.MARGIN-w/2);
      const cy=rand(FH.MARGIN+h/2, H-FH.MARGIN-h/2);
      if (canPlace(cx,cy,w,h)){x=cx-w/2; y=cy-h/2; placed=true;}
    }
    if(!placed){ x=clamp(rand(FH.MARGIN, W-w-FH.MARGIN), FH.MARGIN, W-w-FH.MARGIN);
                 y=clamp(rand(FH.MARGIN, H-h-FH.MARGIN), FH.MARGIN, H-h-FH.MARGIN); }
    const {vx,vy}=nonZeroV();
    chips.push({el,x,y,w,h,vx,vy,stuck:0});
    el.style.transform=`translate3d(${x}px,${y}px,0)`;
  });
  startFloat();
}
function startFloat(){
  cancelAnimationFrame(animId);
  let last=performance.now();
  function tick(now){
    const dt=now-last; last=now;
    const W=innerWidth, H=innerHeight;
    for(const c of chips){
      c.vx += rand(-FH.JITTER,FH.JITTER)*dt;
      c.vy += rand(-FH.JITTER,FH.JITTER)*dt;
      const sp=Math.hypot(c.vx,c.vy);
      if (sp < FH.MIN_V){ const a=rand(0,Math.PI*2); c.vx=Math.cos(a)*FH.MIN_V; c.vy=Math.sin(a)*FH.MIN_V; }
      else if (sp > FH.MAX_V){ c.vx=(c.vx/sp)*FH.MAX_V; c.vy=(c.vy/sp)*FH.MAX_V; }
      c.x += c.vx*dt; c.y += c.vy*dt;

      if (c.x < FH.MARGIN){ c.x=FH.MARGIN; c.vx=Math.abs(c.vx); }
      if (c.y < FH.MARGIN){ c.y=FH.MARGIN; c.vy=Math.abs(c.vy); }
      if (c.x > W-c.w-FH.MARGIN){ c.x=W-c.w-FH.MARGIN; c.vx=-Math.abs(c.vx); }
      if (c.y > H-c.h-FH.MARGIN){ c.y=H-c.h-FH.MARGIN; c.vy=-Math.abs(c.vy); }

      const nearL=c.x<=FH.MARGIN+1, nearR=c.x>=W-c.w-FH.MARGIN-1;
      const nearT=c.y<=FH.MARGIN+1, nearB=c.y>=H-c.h-FH.MARGIN-1;
      if ((nearL||nearR) && (nearT||nearB)){
        c.stuck+=dt; if (c.stuck>100){ c.vx+=(nearL?FH.KICK:-FH.KICK); c.vy+=(nearT?FH.KICK:-FH.KICK); c.stuck=0; }
      } else c.stuck=Math.max(0,c.stuck-dt);

      c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
    }
    animId=requestAnimationFrame(tick);
  }
  animId=requestAnimationFrame(tick);
}
addEventListener('resize', ()=> chips.forEach(c=>{
  c.x = clamp(c.x, FH.MARGIN, innerWidth - c.w - FH.MARGIN);
  c.y = clamp(c.y, FH.MARGIN, innerHeight - c.h - FH.MARGIN);
  c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
}), {passive:true});

// ===== Navigation by data-link =====
const NAV = {
  home: 'index.html',
  login: 'login.html',
  menu: 'lobby.html',
  hub: 'hub.html',
  profile: 'profile.html',
  'event-edit': 'event-edit.html',
  analytics: 'event-analytics.html'
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  const key = a.getAttribute('data-link');
  const href = NAV[key];
  if (href) {
    e.preventDefault();
    location.href = href;
  }
});

// ===== Auth handlers =====
async function handleLogin() {
  const login = document.querySelector('#loginLogin')?.value?.trim();
  const password = document.querySelector('#loginPassword')?.value;
  const err = document.querySelector('#loginError');
  if (!login || !password) return err && (err.textContent = 'Заполните поля');
  err && (err.textContent = '');
  try {
    const { data, error } = await signIn({ login, password });
    if (error) throw error;
    location.href = 'lobby.html';
  } catch (e) {
    err && (err.textContent = e.message || 'Ошибка входа');
  }
}
document.addEventListener('click', (e) => {
  if (e.target?.id === 'btnLogin') handleLogin();
});

async function handleSignup() {
  const nickname = document.querySelector('#signupNickname')?.value?.trim();
  const email    = document.querySelector('#signupEmail')?.value?.trim();
  const password = document.querySelector('#signupPassword')?.value;
  const err = document.querySelector('#signupError');
  if (!nickname || !email || !password) return err && (err.textContent = 'Заполните поля');
  err && (err.textContent = '');
  try {
    const { data, error } = await signUpWithNickname({ nickname, email, password });
    if (error) throw error;
    location.href = 'lobby.html';
  } catch (e) {
    err && (err.textContent = e.message || 'Ошибка регистрации');
  }
}
document.addEventListener('click', (e) => {
  if (e.target?.id === 'btnSignup') handleSignup();
});

async function handleReset() {
  const email = document.querySelector('#resetEmail')?.value?.trim();
  const err = document.querySelector('#resetError');
  if (!email) return err && (err.textContent = 'Укажите email');
  err && (err.textContent = '');
  try {
    const { data, error } = await resetPassword(email);
    if (error) throw error;
    err && (err.textContent = 'Письмо отправлено, проверьте почту');
  } catch (e) {
    err && (err.textContent = e.message || 'Ошибка сброса');
  }
}
document.addEventListener('click', (e) => {
  if (e.target?.id === 'btnReset') handleReset();
});

document.addEventListener('click', (e) => {
  if (e.target?.dataset?.action === 'logout') {
    e.preventDefault();
    signOut()?.finally(() => location.href = 'index.html');
  }
});

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab[data-tab]');
  if (!tab) return;
  const name = tab.dataset.tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t === tab));
  document.querySelectorAll('.auth-pane').forEach(p => p.classList.toggle('visible', p.id.toLowerCase().includes(name)));
});

document.addEventListener('click', async (e) => {
  if (e.target?.id !== 'btnJoin') return;
  const code = document.querySelector('#joinCode')?.value?.trim();
  if (!code || code.length < 6) return alert('Введите 6-значный код');
  try {
    const res = await joinEvent({ code });
    if (res?.success && res?.url) {
      location.href = res.url;
    } else {
      alert(res?.error || 'Не удалось присоединиться');
    }
  } catch (err) {
    alert(err.message || 'Ошибка');
  }
});

function handleAuth(session) {
  const authed = !!session;
  document.body.classList.toggle('authed', authed);
  document.body.classList.toggle('guest', !authed);
  const page = location.pathname.split('/').pop();
  const guestPages = ['index.html','login.html',''];
  if (authed && guestPages.includes(page)) {
    location.href = 'lobby.html';
  } else if (!authed && !guestPages.includes(page)) {
    location.href = 'index.html';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try { spawnChips(); } catch {}
  try {
    const session = await getSession();
    handleAuth(session);
  } catch {
    handleAuth(null);
  }
});


onAuthState?.(handleAuth);
