// app.js — навигация + поток Owner/Guest + пост-онбординг события
import {
  supa, getSession, onAuthState,
  signIn, signUpWithNickname, signOut,
  joinEvent
} from './api.js';

/* ------------------ Утилиты ------------------ */
const LINKS = {
  home: '/index.html',
  menu: '/lobby.html',
  profile: '/profile.html',
  settings: '/profile.html',
  'event-edit': '/event-edit.html',
  'wishlist-setup': '/wishlist-setup.html',
  'event-summary': '/event-summary.html',
  'event-analytics': '/event-analytics.html'
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

/* ------------------ Фоновая анимация (чипы) ------------------ */
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
    const el=document.createElement('div');
    el.className='fh-chip';
    el.textContent=t;
    const x=rnd(20,vw-160), y=rnd(20,vh-60);
    el.style.left=`${x}px`;
    el.style.top=`${y}px`;
    el.style.transform='translate3d(0,0,0)';
    root.appendChild(el);
    const r=el.getBoundingClientRect();
    const c={el, w:r.width||140, h:r.height||40, x, y, vx:rnd(-.08,.08), vy:rnd(-.08,.08)};
    chips.push(c);
  });
}
// --- FIXED LOGIC BELOW ---
function updateChips(){
  const m = 20;
  for (const c of chips){
    c.x += c.vx; c.y += c.vy;

    if (c.x <= m || c.x + c.w >= vw - m){
      c.vx *= -1;
      c.x = Math.max(m, Math.min(c.x, vw - c.w - m));
    }
    if (c.y <= m || c.y + c.h >= vh - m){
      c.vy *= -1;
      // было: Math.min(c.y, vh - m)
      c.y = Math.max(m, Math.min(c.y, vh - c.h - m));
    }
    c.el.style.left = `${c.x}px`;
    c.el.style.top  = `${c.y}px`;
  }

  for (let i = 0; i < chips.length; i++)
    for (let j = i + 1; j < chips.length; j++){
      const a = chips[i], b = chips[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y){
        [a.vx, b.vx] = [b.vx, a.vx];
        [a.vy, b.vy] = [b.vy, a.vy];
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

/* ------------------ Logout ------------------ */
document.addEventListener('click', async (e)=>{
  const b=e.target.closest('[data-action="logout"]'); if (!b) return;
  await signOut(); goto(LINKS.home);
});

/* ------------------ Boot & роутинг ------------------ */
async function boot() {
  const session = await getSession();
  const authed = !!session;
  setAuthState(authed);

  // --- Safe redirects ---
  // If auth client is unavailable (no Supabase creds) — do NOT enforce redirects.
  const AUTH_AVAILABLE = !!supa;

  // Authenticated users who land on the root should go to menu.
  if (AUTH_AVAILABLE && authed && (path() === '/' || path().endsWith('/index.html'))) {
    goto(LINKS.menu);
    return;
  }

  // IMPORTANT:
  // Do NOT redirect guests away from non-index pages.
  // Each page already performs its own checks and shows alerts without navigation.
  // (So we intentionally removed: if (!authed && not index) goto home;)

  // --- Routes init as before ---
  if (isPage('lobby.html')) await initLobby();

  if (isPage('event-edit.html')) {
    await initEventEdit();
  }

  if (isPage('wishlist-setup.html')) await initWishlistSetup();
  if (isPage('event-summary.html')) await initEventSummary();

  if (isPage('event-analytics.html')) await initEventAnalytics();

  if (isPage('profile.html')) await initProfile();

  onAuthState((sess) => setAuthState(!!sess));
}
document.addEventListener('DOMContentLoaded', () => { boot().catch?.(console.error); });

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

/* ------------------ Создание события ------------------ */

function renderEventEditInto(target = document.body) {
  const existed = qs('#editForm');
  if (existed) return existed;

  const tpl = `
  <main class="page event-edit">
    <section class="card">
      <h1>Создание события</h1>
      <form id="editForm" autocomplete="off">
        <div class="grid">
          <label>Название
            <input type="text" id="eventTitle" name="title" placeholder="Название события" required />
          </label>
          <label>Дата и время
            <input type="datetime-local" id="eventDate" name="datetime" required />
          </label>
          <label>Место
            <input type="text" id="eventPlace" name="place" placeholder="Адрес или ссылка" />
          </label>
          <label>Описание
            <textarea id="eventDesc" name="desc" rows="3" placeholder="Кратко о событии"></textarea>
          </label>
        </div>
        <div class="actions">
          <button type="button" class="btn" data-link="menu">Отмена</button>
          <button type="submit" class="btn primary" id="saveEvent">Сохранить</button>
        </div>
      </form>
    </section>
  </main>`;
  const wrap = document.createElement('div');
  wrap.innerHTML = tpl.trim();
  const main = wrap.firstElementChild;
  // вставляем сразу после шапки
  const header = qs('header.topbar');
  if (header && header.parentNode) {
    header.parentNode.insertBefore(main, header.nextSibling);
  } else {
    target.appendChild(main);
  }
  return main.querySelector('#editForm');
}

async function initEventEdit() {
  // если формы нет — создать
  let form = qs('#editForm') || renderEventEditInto(document.body);
  if (!form) {
    console.warn('[event-edit] form not found and failed to render');
    return;
  }
  const saveBtn = qs('#saveEvent');

  // Если нужно — префилл (например, из query)
  const q = new URLSearchParams(location.search);
  if (q.get('title')) qs('#eventTitle').value = q.get('title');
  // другие поля можно дополнить по необходимости

  // Сабмит
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: qs('#eventTitle')?.value?.trim(),
        datetime: qs('#eventDate')?.value,
        place: qs('#eventPlace')?.value?.trim(),
        desc: qs('#eventDesc')?.value?.trim(),
      };
      if (!payload.title || !payload.datetime) {
        alert('Заполните название и дату/время');
        return;
      }
      // saveEvent — существующая функция/эндпоинт (оставь как было, если уже есть)
      const code = await saveEvent(payload); // должен вернуть код события
      if (code) goto(`/event-summary.html?code=${encodeURIComponent(code)}`);
    } catch (err) {
      console.error('[event-edit] save failed', err);
      alert('Не удалось сохранить событие');
    }
  });

  // На всякий — кнопка "Сохранить" кликает submit формы
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = '1';
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      form.requestSubmit?.();
    });
  }
}

/* ------------------ Страница события (аналитика/только владелец) ------------------ */

async function initEventAnalytics(){
  if (!supa) return;
  const p = params();
  const code = p.code?.trim();
  if (!code) { qs('#error')?.replaceChildren(document.createTextNode('Код события не указан')); return; }

  const { data: ev, error } = await supa.from('events').select('*').eq('code', code).single();
  if (error || !ev) { qs('#error')?.replaceChildren(document.createTextNode('Событие не найдено')); return; }

  // проверяем владельца
  const sess = await getSession();
  let myPid = null;
  if (sess?.user?.id) {
    const { data: me } = await supa.from('profiles').select('pid').eq('id', sess.user.id).single();
    myPid = me?.pid ?? null;
  }
  // ИЗМЕНЕНИЕ: теперь только pid совпадает
  const isOwner = (myPid != null && Number(ev.host_user_id) === Number(myPid));

  if (!isOwner) { alert('Доступ к аналитике есть только у создателя события'); goto(LINKS.menu); return; }

  qs('#eventTitle')?.replaceChildren(document.createTextNode(ev.title || 'Событие'));
  qs('#eventDate')?.replaceChildren(document.createTextNode(ev.date || '—'));
  qs('#eventTime')?.replaceChildren(document.createTextNode(ev.time || '—'));
  qs('#eventAddr')?.replaceChildren(document.createTextNode(ev.address || '—'));
  qs('#editEventBtn')?.classList.toggle('hidden', !isOwner);

  // FIX: дождаться загрузки списков
  await renderRSVP(ev.id);
  await renderWishlist(ev.id);

  qs('#backBtn')?.addEventListener('click', ()=> goto(LINKS.menu));
  qs('#editEventBtn')?.addEventListener('click', ()=> goto(`${LINKS['event-edit']}?code=${encodeURIComponent(code)}`));
}


/* ------------------ Списки (read-only) ------------------ */
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
  const yes   = (data||[]).filter(x=>x.status==='yes').length;
  const maybe = (data||[]).filter(x=>x.status==='maybe').length;
  const no    = (data||[]).filter(x=>x.status==='no').length;
  const y = qs('#rsvpYesCount'), m = qs('#rsvpMaybeCount'), n = qs('#rsvpNoCount');
  y && (y.textContent = String(yes));
  m && (m.textContent = String(maybe));
  n && (n.textContent = String(no));
}
function statusEmoji(s){ return s==='yes'?'🟢 Иду':s==='maybe'?'🟡 Возможно':'🔴 Не иду'; }

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
  const free  = (data||[]).filter(x=>!x.taken_by).length;
  const taken = (data||[]).filter(x=>x.taken_by).length;
  const f = qs('#giftFreeCount'), t = qs('#giftTakenCount');
  f && (f.textContent = String(free));
  t && (t.textContent = String(taken));
}

/* ------------------ Профиль ------------------ */
async function initProfile(){
  if (!supa) return;
  const sess = await getSession(); if (!sess?.user?.id) return;

  const { data: me } = await supa.from('profiles').select('pid').eq('id', sess.user.id).single();
  const myPid = me?.pid; if (!myPid) return;

  const today = new Date().toISOString().slice(0,10);

  const { data: mine } = await supa.from('events')
    .select('id,title,date,code')
    .eq('host_user_id', myPid)
    .order('date', { ascending: true });

  const { data: guestIn } = await supa.from('rsvps')
    .select('event_id,events(id,title,date,code)')
    .eq('user_id', sess.user.id)
    .order('created_at', { ascending: false });

  const container = qs('.container'); if (!container) return;
  const card=document.createElement('div'); card.className='card';
  const h2=document.createElement('h2'); h2.textContent='Мои события';
  card.appendChild(h2);

  function sect(title, items){
    const d=document.createElement('div');
    const hh=document.createElement('h3'); hh.textContent=title; d.appendChild(hh);
    const ul=document.createElement('ul');
    (items||[]).forEach(ev=>{
      const e = ev.events || ev;
      const li=document.createElement('li');
      const a=document.createElement('a');
      // Гость: не ведём в аналитику, просто текст
      if (title === 'Гость') {
        a.textContent = `${e.title} — ${e.date||'—'}`;
        a.classList.add('disabled-link');
        a.title = 'Аналитика доступна только создателю события';
      } else {
        a.href=`/event-analytics.html?code=${encodeURIComponent(e.code)}&owner=1`;
        a.textContent=`${e.title} — ${e.date||'—'}`;
      }
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

/* ------------------ Wishlist Setup (после создания события) ------------------ */
async function initWishlistSetup(){
  const p = params();
  const code = (p.code || '').trim();
  const errEl = document.getElementById('wlError');
  const listEl = document.getElementById('giftList');
  const freeEl = document.getElementById('giftFreeCount');
  const takenEl = document.getElementById('giftTakenCount');
  const addBtn = document.getElementById('giftAdd');
  const nextBtn = document.getElementById('giftNext');
  const skipBtn = document.getElementById('giftSkip');
  const inputEl = document.getElementById('giftInput');

  function showErr(m){ if(errEl){ errEl.textContent=m||''; } }

  if (!code){ showErr('Код события не указан'); return; }

  // грузим событие
  const { data: ev, error: evErr } = await supa.from('events').select('*').eq('code', code).single();
  if (evErr || !ev){ showErr('Событие не найдено'); return; }
  document.getElementById('wlTitle')?.replaceChildren(document.createTextNode(`Вишлист: ${ev.title || 'Событие'}`));

  // проверка владельца
  const sess = await getSession();
  let isOwner = false;
  if (sess?.user?.id){
    const { data: me } = await supa.from('profiles').select('pid').eq('id', sess.user.id).single();
    isOwner = me?.pid != null && Number(ev.host_user_id) === Number(me.pid);
  }
  if (!isOwner){ showErr('Только владелец может редактировать вишлист'); return; }

  async function renderList(){
    const { data: gifts } = await supa.from('gifts').select('id,title,taken_by').eq('event_id', ev.id).order('id', { ascending: true });
    listEl.innerHTML = '';
    let free=0, taken=0;
    (gifts||[]).forEach(g=>{
      const li=document.createElement('li');
      li.className='wl-item';
      li.textContent = g.title || 'Подарок';
      if (g.taken_by){ li.textContent += ' — 🔒 занято'; taken++; } else { free++; }
      listEl.appendChild(li);
    });
    if (freeEl)  freeEl.textContent  = String(free);
    if (takenEl) takenEl.textContent = String(taken);
  }

  async function addGift(){
    showErr('');
    const title = (inputEl?.value || '').trim();
    if (!title){ showErr('Введите название подарка'); return; }
    const { error } = await supa.from('gifts').insert([{ event_id: ev.id, title }]);
    if (error){ showErr(error.message || 'Не удалось добавить'); return; }
    inputEl.value = '';
    await renderList();
  }

  addBtn?.addEventListener('click', addGift);
  inputEl?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addGift(); }});

  nextBtn?.addEventListener('click', ()=>{
    location.href = `/event-summary.html?code=${encodeURIComponent(code)}`;
  });
  skipBtn?.addEventListener('click', ()=>{
    location.href = `/event-summary.html?code=${encodeURIComponent(code)}`;
  });

  await renderList();
}

/* ------------------ Event Summary (итоги + код приглашения) ------------------ */
async function initEventSummary(){
  const p = params();
  const code = (p.code || '').trim();
  const errEl = document.getElementById('sumError');

  function showErr(m){ if(errEl){ errEl.textContent=m||''; } }

  if (!code){ showErr('Код события не указан'); return; }

  const { data: ev, error } = await supa.from('events').select('*').eq('code', code).single();
  if (error || !ev){ showErr('Событие не найдено'); return; }

  // только владелец видит эту страницу как финальный шаг
  const sess = await getSession();
  let isOwner = false;
  if (sess?.user?.id){
    const { data: me } = await supa.from('profiles').select('pid').eq('id', sess.user.id).single();
    isOwner = me?.pid != null && Number(ev.host_user_id) === Number(me.pid);
  }
  if (!isOwner){ showErr('Только владелец может просматривать итоговую информацию'); return; }

  const setText = (id, val)=> document.getElementById(id)?.replaceChildren(document.createTextNode(val ?? '—'));

  setText('sumTitle', ev.title || 'Событие');
  setText('sumDate', ev.date || '—');
  setText('sumTime', ev.time || '—');
  setText('sumAddr', ev.address || '—');
  setText('sumNotes', ev.notes || '—');
  setText('sumCode', ev.code || '—');

  const copyBtn = document.getElementById('sumCopy');
  copyBtn?.addEventListener('click', ()=> {
    navigator.clipboard?.writeText(ev.code || '');
    const t = document.getElementById('toast');
    if (t){ t.textContent='Код скопирован'; t.hidden=false; clearTimeout(copyBtn._t); copyBtn._t=setTimeout(()=>{ t.hidden=true; }, 1500); }
  });

  const toAnalBtn = document.getElementById('toAnalytics');
  toAnalBtn?.addEventListener('click', ()=>{
    location.href = `/event-analytics.html?code=${encodeURIComponent(code)}`;
  });
}

/* --- Navigation via data-link (no page reload) --- */
document.addEventListener('click', (e) => {
  const linkEl = e.target.closest('[data-link]');
  if (linkEl) {
    e.preventDefault();
    const key = linkEl.getAttribute('data-link');
    const href = LINKS[key];
    if (href) goto(href);
    return;
  }

  // Join by code button
  const joinBtn = e.target.closest('[data-action="join"]');
  if (joinBtn) {
    e.preventDefault();
    triggerJoinByCode();
  }
});

// Handle Enter inside the join input without submitting a form
document.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  if (e.key === 'Enter' && active && active.id === 'join-code') {
    e.preventDefault();
    triggerJoinByCode();
  }
});

// Safety: block any accidental form submits around the join UI
document.addEventListener('submit', (e) => {
  if (e.target.querySelector && e.target.querySelector('#join-code')) {
    e.preventDefault();
    triggerJoinByCode();
  }
});

function triggerJoinByCode() {
  const input = document.getElementById('join-code');
  const code = input ? input.value.trim() : '';
  if (!code) return;
  if (typeof joinByCode === 'function') {
    return joinByCode(code);
  }
  goto(`/event-summary.html?code=${encodeURIComponent(code)}`);
}
