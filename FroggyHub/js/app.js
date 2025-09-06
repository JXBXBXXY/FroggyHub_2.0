import { supa, getSession, onAuthState, signIn, signUpWithNickname, signOut, getProfile, joinEvent } from './api.js';

const LINKS = {
  home: '/FroggyHub/index.html',
  menu: '/FroggyHub/lobby.html',
  profile: '/FroggyHub/profile.html',
};

const elTabs   = document.querySelectorAll('[data-auth-tab]');
const panes    = document.querySelectorAll('.auth-pane[data-pane]');
const formLogin  = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const errBox   = document.getElementById('auth-error');

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-auth-tab]');
  if (!t) return;
  const target = t.getAttribute('data-auth-tab');
  for (const b of elTabs) b.classList.toggle('is-active', b === t);
  for (const p of panes) {
    const on = p.dataset.pane === target;
    p.hidden = !on;
    p.classList.toggle('visible', on);
  }
  if (errBox) { errBox.textContent = ''; errBox.hidden = true; }
});

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = (formLogin.nickname.value || '').trim();
  const password = formLogin.password.value;
  try {
    const r = await signIn({ login: nickname, password });
    if (!r) throw new Error('Не удалось войти');
    location.href = '/FroggyHub/lobby.html';
  } catch (err) {
    if (errBox) { errBox.textContent = err.message || 'Ошибка входа'; errBox.hidden = false; }
  }
});

formSignup?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = (formSignup.nickname.value || '').trim();
  const email    = (formSignup.email.value || '').trim();
  const password = formSignup.password.value;
  try {
    const r = await signUpWithNickname({ nickname, email, password });
    if (r?.error) throw r.error;
    location.href = '/FroggyHub/lobby.html';
  } catch (err) {
    if (errBox) { errBox.textContent = err.message || 'Ошибка регистрации'; errBox.hidden = false; }
  }
});

function setAuthState(isAuthed) {
  document.body.classList.toggle('authed', !!isAuthed);
  document.body.classList.toggle('guest', !isAuthed);
  for (const el of document.querySelectorAll('[data-auth-only]')) el.hidden = !isAuthed;
  for (const el of document.querySelectorAll('[data-guest-only]')) el.hidden = !!isAuthed;
}

function wireNav() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const key = btn.getAttribute('data-link');
    const href = LINKS[key];
    if (href) { e.preventDefault(); location.href = href; }
  });
}

let fhCloudsRoot;
function ensureCloudsRoot() {
  if (fhCloudsRoot && document.body.contains(fhCloudsRoot)) return fhCloudsRoot;
  if (fhCloudsRoot?.parentNode) fhCloudsRoot.parentNode.removeChild(fhCloudsRoot);
  fhCloudsRoot = document.createElement('div');
  fhCloudsRoot.id = 'fh-message-clouds';
  fhCloudsRoot.setAttribute('aria-hidden', 'true');
  fhCloudsRoot.style.pointerEvents = 'none';
  fhCloudsRoot.style.zIndex = '0';
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
let chips = [], rafId = 0, chipsSpawned = false;
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
  cancelAnimationFrame(rafId);
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
    rafId=requestAnimationFrame(tick);
  }
  rafId=requestAnimationFrame(tick);
}

let rzT;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    for (const c of chips) {
      c.x = clamp(c.x, FH.MARGIN, innerWidth - c.w - FH.MARGIN);
      c.y = clamp(c.y, FH.MARGIN, innerHeight - c.h - FH.MARGIN);
      c.el.style.transform = `translate3d(${c.x}px,${c.y}px,0)`;
    }
  }, 200);
}, { passive: true });

async function boot() {
  wireNav();
  try { ensureCloudsRoot(); spawnChips(); } catch {}

  const session = await getSession();
  setAuthState(!!session);
  if (!session && !location.pathname.endsWith('/index.html')) {
    location.href = LINKS.home;
    return;
  }
  onAuthState((sess) => setAuthState(!!sess));

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="logout"]');
    if (!btn) return;
    await signOut();
    location.href = LINKS.home;
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

  if (location.pathname.endsWith('/profile.html')) {
    const p = await getProfile();
    if (p) {
      document.getElementById('profile-nickname')?.replaceChildren(document.createTextNode(p.nickname ?? '—'));
      document.getElementById('profile-email')?.replaceChildren(document.createTextNode(p.email ?? '—'));
      document.getElementById('profile-created')?.replaceChildren(document.createTextNode(p.created_at?.slice(0,10) ?? '—'));
    }
  }
}

document.addEventListener('DOMContentLoaded', boot);

