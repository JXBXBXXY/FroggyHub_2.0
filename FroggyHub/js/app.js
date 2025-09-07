// app.js — навигация + «скелет» потоков Owner/Guest
import {
  supa, getSession, onAuthState,
  signIn, signUpWithNickname, signOut,
  getProfile, joinEvent
} from './api.js';

/* ------------------ Утилиты ------------------ */
const LINKS = {
  home: '/index.html',
  menu: '/lobby.html',
  profile: '/profile.html',
  settings: '/profile.html',      // временно, пока нет отдельной страницы
  'event-edit': '/event-edit.html'
};
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
const path   = () => location.pathname.replace(/\/+$/, '/');
const params = () => Object.fromEntries(new URLSearchParams(location.search).entries());
const isPage = (name) => path().endsWith(`/${name}`);

function setAuthState(isAuthed) {
  document.body.classList.toggle('authed', !!isAuthed);
  document.body.classList.toggle('guest', !isAuthed);
  qsa('[data-auth-only]').forEach(el => el.hidden = !isAuthed);
  qsa('[data-guest-only]').forEach(el => el.hidden = !!isAuthed);
}
function goto(href) { location.href = href; }
function copy(text) { try { navigator.clipboard?.writeText(text); } catch {} }

/* ------------------ Floating chips (фон) ------------------ */
const FH_MESSAGES = [
  "Я приду к 19:00 ✨","Я возьму пиццу 🍕","Кто возьмёт колу? 🥤",
  "Ребят, постучите в дверь 🚪","Буду позже 🙈","Добавил плейлист 🎶",
  "Кто возьмет настолки? 🎲","Буду через 15 минут ⏳","Я за пивом 🍺",
  "Буду online 💻","Встречаемся у метро 🚉","Я за мороженым 🍦",
  "Принесу колонку 📢","Сделаем фото 📸","Не забудьте зарядки 🔌",
  "Привезу попкорн 🍿","Подготовлю викторину ❓","Нужен штопор?",
  "Устроим караоке","Кто возьмет тарелки?","Заберу пиццу по пути",
  "Я за салатом","Буду с +1","Берите тёплые вещи","Давайте играть в мафию",
  "Принесу проектор","У меня есть проектор","Привезу настольный футбол",
  "Привезу фрукты","Кто за лимонадом?","Друзья, до встречи",
  "У кого есть карты?","Привезу геймпад","Я за хлопьями",
  "Я возьму сок","Приеду на час раньше","Кто возьмёт кофе?","Где паркуемся? 🅿️"
];
let fhRoot=null, chips=[], rafId=0, vw=0, vh=0;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const rnd=(a,b)=>Math.random()*(b-a)+a;
function ensureFH(){
  if (!fhRoot){
    fhRoot = document.getElementById('fh-message-clouds') || (()=> {
      const d=document.createElement('div'); d.id='fh-message-clouds'; d.setAttribute('aria-hidden','true');
      d.style.pointerEvents='none'; document.body.prepend(d); return d;
    })();
  } return fhRoot;
}
function spawnChips(count=null){
  const root=ensureFH(); if (!root) return;
  root.innerHTML=''; chips=[];
  vw=innerWidth; vh=innerHeight;
  const n = count ?? Math.min(FH_MESSAGES.length, vw<420?10:vw<768?16:24);
  const arr = [...FH_MESSAGES].sort(()=>Math.random()-0.5).slice(0,n);
  arr.forEach(t=>{
    const el=document.createElement('div'); el.className='fh-chip'; el.textContent=t; root.appendChild(el);
    const r=el.getBoundingClientRect();
    const c={el, w:r.width||140, h:r.height||40, x:rnd(20,vw-160), y:rnd(20,vh-60), vx:rnd(-.08,.08), vy:rnd(-.08,.08)};
    chips.push(c); el.style.transform=`translate3d(${c.x}px, ${c.y}px, 0)`;
  });
}
function updateChips(){
  const m=20;
  for (const c of chips){
    c.x+=c.vx; c.y+=c.vy;
    if (c.x<=m||c.x+c.w>=vw-m){ c.vx*=-1; c.x=Math.max(m,Math.min(c.x,vw-c.w-m)); }
    if (c.y<=м||c.y+c.h>=vh-м){ c.vy*=-1; c.y=Math.max(m,Math.min(c.y,vh-c.h-m)); }
    c.el.style.transform=`translate3d(${c.x}px, ${c.y}px, 0)`;
  }
  for (let i=0;i<chips.length;i++)for(let j=i+1;j<chips.length;j++){
    const a=chips[i], b=chips[j];
    if (a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y){
      [a.vx,b.vx]=[b.vx,a.vx]; [a.vy,b.vy]=[b.vy,a.vy];
    }
  }
}
function tick(){ updateChips(); rafId=requestAnimationFrame(tick); }
function startFH(){ cancelAnimationFrame(rafId); if (REDUCED_MOTION) return; spawnChips(); rafId=requestAnimationFrame(tick); }
addEventListener('resize',()=>{ clearTimeout(startFH._t); startFH._t=setTimeout(()=>spawnChips(chips.length),250); });
document.addEventListener('visibilitychange',()=> document.hidden?cancelAnimationFrame(rafId):startFH());
document.addEventListener('DOMContentLoaded',()=> setTimeout(startFH,100));

/* ------------------ Auth вкладки (index.html) ------------------ */
(function wireAuthTabs(){
  const tabs = qsa('[data-auth-tab]'); const panes = qsa('.auth-pane[data-pane]'); const err = qs('#auth-error');
  document.addEventListener('click',(e)=>{
    const t=e.target.closest('[data-auth-tab]'); if (!t) return;
    const key=t.getAttribute('data-auth-tab');
    tabs.forEach(b=>b.classList.toggle('is-active', b===t));
    panes.forEach(p=>{ const on=p.dataset.pane===key; p.hidden=!on; p.classList.toggle('visible', on); });
    if (err){ err.textContent=''; err.hidden=true; }
  });

  const fLogin = qs('#form-login');
  const fSignup = qs('#form-signup');

  fLogin?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const nickname = (fLogin.nickname.value||'').trim();
    const password = fLogin.password.value;
    try{
      const r = await signIn({ login:nickname, password });
      if (!r) throw new Error('Не удалось войти');
      goto(LINKS.menu);
    }catch(er){ if (err){ err.textContent=er.message||'Ошибка входа'; err.hidden=false; } }
  });

  fSignup?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const nickname = (fSignup.nickname.value||'').trim();
    const email    = (fSignup.email.value||'').trim();
    const password = fSignup.password.value;
    try{
      const r = await signUpWithNickname({ nickname, email, password });
      if (r?.error) throw r.error;
      goto(LINKS.menu);
    }catch(er){ if (err){ err.textContent=er.message||'Ошибка регистрации'; err.hidden=false; } }
  });
})();

/* ------------------ Навигация верхних кнопок ------------------ */
document.addEventListener('click',(e)=>{
  const b=e.target.closest('[data-link]'); if (!b) return;
  e.preventDefault();
  const to = LINKS[b.getAttribute('data-link')];
  if (to) goto(to);
});

/* ------------------ Logout ------------------ */
document.addEventListener('click', async (e)=>{
  const b=e.target.closest('[data-action="logout"]'); if (!b) return;
  await signOut(); goto(LINKS.home);
});

/* ------------------ Guard + page boot ------------------ */
async function boot() {
  const session = await getSession();
  const authed = !!session;
  setAuthState(authed);

  // редиректы, чтобы не было «пустой страницы»
  if (authed && (path() === '/' || path().endsWith('/index.html'))) { goto(LINKS.menu); return; }
  if (!authed && !(path() === '/' || path().endsWith('/index.html'))) { goto(LINKS.home); return; }

  // роуты страниц
  if (isPage('lobby.html')) await initLobby();
  if (isPage('event-edit.html')) await initEventEdit();
  if (isPage('event-analytics.html')) await initEventAnalytics();
  if (isPage('profile.html')) await initProfile();

  onAuthState((sess) => setAuthState(!!sess));
}
document.addEventListener('DOMContentLoaded', boot);

/* ------------------ Lobby (создать / присоединиться) ------------------ */
async function initLobby(){
  document.addEventListener('click', async (e)=>{
    if (e.target?.id !== 'btnJoin') return;
    const code = qs('#joinCode')?.value?.trim();
    if (!code || code.length < 6) return alert('Введите 6-значный код');
    try {
      const res = await joinEvent({ code });
      if (res?.success && res?.url) { goto(res.url); return; }
      goto(`/event-analytics.html?code=${encodeURIComponent(code)}&guest=1`);
    } catch (err) {
      alert(err.message || 'Не удалось присоединиться');
    }
  });
}

/* ------------------ Создание/редактирование события ------------------ */
function genCode(){ const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++) s+=a[(Math.random()*a.length)|0]; return s; }

async function initEventEdit(){
  const sess = await getSession();
  if (!sess?.user?.id) return alert('Нужна авторизация');

  // 1. Получаем pid текущего пользователя
  const { data: prof, error: profErr } = await supa
    .from('profiles')
    .select('pid')
    .eq('id', sess.user.id)   // id = UUID
    .single();

  if (profErr || !prof) {
    return alert('Не удалось найти профиль пользователя');
  }

  // 2. Формируем payload
  const payload = {
    title: qs('#editTitle')?.value?.trim() || 'Событие',
    date: qs('#editDate')?.value || null,
    time: qs('#editTime')?.value || null,
    address: qs('#editAddress')?.value || '',
    notes: qs('#editNotes')?.value || '',
    dress: qs('#editDress')?.value || '',
    bring: qs('#editBring')?.value || '',
    host_user_id: prof.pid   // ✅ bigint
  };

  let code = genCode();

  const { data, error } = await supa
    .from('events')
    .insert([{ ...payload, code }])
    .select('*')
    .single();

  if (error) return alert(error.message || 'Не удалось создать событие');

  goto(`/event-analytics.html?code=${encodeURIComponent(data.code)}&owner=1`);
}

/* ------------------ Страница события (аналитика/гость) ------------------ */
async function initEventAnalytics(){
  if (!supa) return;
  const p = params();
  const code = p.code?.trim();
  if (!code) { qs('#error')?.replaceChildren(document.createTextNode('Код события не указан')); return; }

  const { data: ev, error } = await supa.from('events').select('*').eq('code', code).single();
  if (error || !ev) { qs('#error')?.replaceChildren(document.createTextNode('Событие не найдено')); return; }

  qs('#eventTitle')?.replaceChildren(document.createTextNode(ev.title || 'Событие'));
  qs('#eventDate')?.replaceChildren(document.createTextNode(ev.date || '—'));
  qs('#eventTime')?.replaceChildren(document.createTextNode(ev.time || '—'));
  qs('#eventAddr')?.replaceChildren(document.createTextNode(ev.address || '—'));

  const sess = await getSession();
  const isOwner = !!(sess?.user?.id && ev.host_user_id === sess.user.id) || p.owner === '1'; // <— ВАЖНО
  qs('#editEventBtn')?.classList.toggle('hidden', !isOwner);

  renderRSVP(ev.id);
  renderWishlist(ev.id);

  qs('#backBtn')?.addEventListener('click', ()=> goto(LINKS.menu));
  qs('#editEventBtn')?.addEventListener('click', ()=> goto(`/event-edit.html?code=${encodeURIComponent(code)}`));

  if (isOwner) {
    qs('#eventTitle')?.addEventListener('click', ()=>{ copy(code); toast('Код скопирован'); });
  }
}

/* Минимальный список гостей (только чтение для скелета) */
async function renderRSVP(event_id){
  const list = qs('#visitorsList'); if (!list) return;
  const { data } = await supa.from('rsvps').select('nickname,status').eq('event_id', event_id);
  list.innerHTML = '';
  (data||[]).forEach(r=>{
    const li=document.createElement('li');
    li.className='ea-item';
    li.textContent = `${r.nickname || 'Гость'} — ${statusEmoji(r.status)}`;
    list.appendChild(li);
  });
  const yes = (data||[]).filter(x=>x.status==='yes').length;
  const maybe = (data||[]).filter(x=>x.status==='maybe').length;
  const no = (data||[]).filter(x=>x.status==='no').length;
  qs('#rsvpYesCount') && (qs('#rsvpYesCount').textContent = String(yes));
  qs('#rsvpMaybeCount') && (qs('#rsvpMaybeCount').textContent = String(maybe));
  qs('#rsvpNoCount') && (qs('#rsvpNoCount').textContent = String(no));
}
function statusEmoji(s){ return s==='yes'?'🟢 Иду':s==='maybe'?'🟡 Возможно':'🔴 Не иду'; }

/* Минимальный wishlist (только чтение для скелета) */
async function renderWishlist(event_id){
  const list = qs('#wishlistList'); if (!list) return;
  const { data } = await supa.from('gifts').select('title,taken_by').eq('event_id', event_id);
  list.innerHTML='';
  (data||[]).forEach(g=>{
    const li=document.createElement('li');
    li.className='wl-item';
    li.textContent = g.title || 'Подарок';
    if (g.taken_by) li.textContent += ' — 🔒 занято';
    list.appendChild(li);
  });
  const free = (data||[]).filter(x=>!x.taken_by).length;
  const taken = (data||[]).filter(x=>x.taken_by).length;
  qs('#giftFreeCount') && (qs('#giftFreeCount').textContent = String(free));
  qs('#giftTakenCount') && (qs('#giftTakenCount').textContent = String(taken));
}

/* ------------------ Профиль: актуальные / прошедшие ------------------ */
async function initProfile(){
  if (!supa) return;
  const sess = await getSession(); if (!sess?.user?.id) return;
  const uid = sess.user.id;
  const today = new Date().toISOString().slice(0,10);

  const { data: mine } = await supa.from('events')
    .select('id,title,date,code')
    .eq('host_user_id', uid)  // <— ВАЖНО
    .order('date', { ascending: true });

  const { data: guestIn } = await supa.from('rsvps')
    .select('event_id,events(id,title,date,code)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  const container = qs('.container'); if (!container) return;
  const card=document.createElement('div'); card.className='card';
  const h2=document.createElement('h2'); h2.textContent='Мои события';
  card.appendChild(h2);

  function sect(title, items){
    const d=document.createElement('div'); const hh=document.createElement('h3'); hh.textContent=title; d.appendChild(hh);
    const ul=document.createElement('ul');
    (items||[]).forEach(ev=>{
      const e = ev.events || ev;
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href=`/event-analytics.html?code=${encodeURIComponent(e.code)}`;
      a.textContent=`${e.title} — ${e.date||'—'}`;
      li.appendChild(a); ul.appendChild(li);
    });
    d.appendChild(ul); return d;
  }

  const upcoming = (mine||[]).filter(e=>!e.date || e.date >= today);
  const past     = (mine||[]).filter(e=> e.date && e.date <  today);

  card.appendChild(sect('Владелец — ближайшие', upcoming));
  card.appendChild(sect('Владелец — прошедшие', past));
  card.appendChild(sect('Гость', (guestIn||[])));

  container.appendChild(card);
}

/* ------------------ Мини-тост ------------------ */
function toast(msg){
  const t = qs('#toast'); if (!t) return; t.textContent=msg; t.hidden=false;
  clearTimeout(toast._t); toast._t=setTimeout(()=>{ t.hidden=true; }, 2000);
}
