import { nf, getToken, setToken, clearToken, joinEvent } from './js/api.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// expose Supabase client factory and config (was in index.html)
window.createClient = createClient;
window.SUPABASE_URL = "https://smamhlfzserjkdfhthwhdv.supabase.co";
window.PROXY_SUPABASE_URL = location.origin + '/supabase';
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYW1obGZ6ZXJqa2RmaHR3aGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzQ0MzYsImV4cCI6MjA3MDcxMDQzNn0.PwRF3OAtlpJ7zu2lsIb46V7XLINlyhfC97Jgbu--Vv4";

const API = {
  async createEvent(payload) {
    const res = await fetch('/.netlify/functions/event-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
    return data.event; // { id, join_code, code }
  },
  async getEventByCode(code) {
    const res = await fetch('/.netlify/functions/event-one?code=' + encodeURIComponent(code));
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
    return data.event; // объект события + wishlist
  }
};

let __booted = false;
window.addEventListener('DOMContentLoaded', () => {
  if (__booted) return;
  __booted = true;
  init();
});

const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg, ms = 1800) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

window.__FH__ = window.__FH__ || {};
const ST = window.__FH__;
ST.createType = ST.createType || null;     // 'business' | 'party'
ST.createDraft = ST.createDraft || {};     // шаг 1: условия
ST.createReqs  = ST.createReqs  || {};     // шаг 2: требования

function onDelegated(selector, type, handler, options){
  document.addEventListener(type, (e)=>{
    const el = e.target.closest(selector);
    if(!el) return;
    handler(e, el);
  }, options || false);
}

const COOKIE_KEY = 'FH_COOKIE_OK';

function authHeader(){
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
const authHeaders = authHeader;

async function addWish(code, title, url){
  const res = await fetch('/.netlify/functions/wishlist-add', {
    method:'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ code, title, url })
  });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
}

async function claimWish(id, nickname){
  const res = await fetch('/.netlify/functions/wishlist-claim', {
    method:'POST',
    headers: { 'Content-Type':'application/json', ...authHeader() },
    body: JSON.stringify({ id, nickname })
  });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
}

function show(name){
  document.querySelectorAll('section[id^="screen-"]').forEach(s => {
    s.hidden = s.id !== `screen-${name}`;
  });
  document.body.dataset.screen = name;
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) navMenu.hidden = (name === 'menu' || name === 'auth');
  console.log('[screen] =>', name);
  if (name === 'final') {
    const right = document.getElementById('final-right');
    if (right) right.hidden = true;
    const wrap = document.querySelector('.final-wrap');
    if (wrap) document.body.dataset.final = 'single';
  }
}

async function boot(){
  const token = getToken();
  if(!token){
    document.documentElement.classList.add('auth-required');
    show('auth');
    return;
  }

  const me = await nf('profile');
  if(me?.success && me?.user){
    window.__me = me.user;
    document.documentElement.classList.remove('auth-required');
    document.documentElement.classList.add('auth-ok');
    show('menu');
  }else{
    document.documentElement.classList.add('auth-required');
    show('auth');
  }
}

boot();

// ---- Logout wiring (single place) ----
function wireLogout() {
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.logout === 'function') {
        window.logout();
      }
    });
  });
}
wireLogout();

if(!localStorage.getItem(COOKIE_KEY)) $('#cookie-banner').hidden = false;

$('#cookie-accept')?.addEventListener('click', ()=>{
  localStorage.setItem(COOKIE_KEY,'1');
  $('#cookie-banner').hidden = true;
});

async function apiPost(fnPath, payload) {
  const res = await fetch(`/.netlify/functions${fnPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = await res.text();
    try { const j = JSON.parse(msg); msg = j.error || j.message || msg; } catch {}
    throw new Error(msg || res.statusText);
  }
  return res.json();
}

const LS_NICK = 'fh:nickname';

document.querySelectorAll('input, textarea, select').forEach(el=>{
  el.classList.add('input');
});

['create-event','join-open','login-btn','signup-btn','btn-logout'].forEach(id=>{
  const el = document.getElementById(id);
  console.debug('[btn]', id, 'present=', !!el);
});

async function fetchMyEvents() {
  const res = await fetch('/.netlify/functions/events-mine', {
    headers: { Authorization: `Bearer ${getToken() || ''}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Не удалось загрузить события');
  return Array.isArray(data) ? data : (data.items || []);
}

function splitEventsByDate(items) {
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = [], past = [];
  for (const ev of items) {
    const d = new Date(ev.date + 'T' + (ev.time || '00:00'));
    (d >= today ? upcoming : past).push(ev);
  }
  upcoming.sort((a,b)=> (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));
  past.sort((a,b)=> (b.date + (b.time||'')).localeCompare(a.date + (a.time||'')));
  return { upcoming, past };
}

function eventRow(ev) {
  const title = ev.title || 'Без названия';
  const when  = ev.date ? (ev.time ? `${ev.date} · ${ev.time}` : ev.date) : '—';
  return `
    <div class="event-item" data-card-id="${ev.id}" data-code="${ev.code || ''}">
      <div>
        <div><strong>${title}</strong></div>
        <div class="event-item__meta">${when}${ev.code ? ` · код: ${ev.code}` : ''}</div>
      </div>
      <div class="event-item__actions">
        <button class="btn btn--sm" data-open-id="${ev.id}">Открыть</button>
        ${ev.is_host ? `<button class="btn btn--sm btn--danger" data-delete-id="${ev.id}">Удалить</button>` : ''}
      </div>
    </div>
  `;
}

async function renderProfile() {
  const listUpcoming = $('#profile-upcoming');
  const listPast = $('#profile-past');
  if (!listUpcoming || !listPast) return;
  listUpcoming.innerHTML = listPast.innerHTML = 'Загрузка...';
  try {
    const items = await fetchMyEvents();
    const { upcoming, past } = splitEventsByDate(items);
    listUpcoming.innerHTML = upcoming.length ? upcoming.map(eventRow).join('') : '<div class="muted">Нет ближайших</div>';
    listPast.innerHTML = past.length ? past.map(eventRow).join('') : '<div class="muted">Нет прошедших</div>';
  } catch (e) {
    listUpcoming.innerHTML = listPast.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

// Навигация по атрибуту data-go
document.addEventListener('click', (e)=>{
  const go = e.target.closest('[data-go]');
  if (!go) return;
  if (go.matches('#create-event, [data-go="app"][data-mode="create"]')) return;
  e.preventDefault();
  const dest = go.getAttribute('data-go');
  if (dest === 'settings') return;
  show(dest);
  if (dest === 'profile') openProfileScreen();
  if (dest === 'app') {
    const mode = go.getAttribute('data-mode') || null;
    setWizardMode?.(mode || 'create');
    requestAnimationFrame(() => document.querySelector('#screen-app input, #screen-app textarea')?.focus());
  }
});

$('#create-event')?.addEventListener('click', () => openTypeModal(true));
function openTypeModal(open){ $('#typeModal').hidden = !open; }
document.addEventListener('keydown', e=>{ if(e.key==='Escape') openTypeModal(false); });
$('#typeModal').addEventListener('click', e=>{
  if(e.target.classList.contains('modal-backdrop') || e.target.closest('[data-close]')) openTypeModal(false);
});

// --- Создание события: состояние и шаги ---
const state = {
  create: {
    type: null,
    base: {},
    reqs: {},
    wishlist: [],
    code: null,
  }
};

const guest = { code:null, nickname:null, event:null };

$('#join-btn')?.addEventListener('click', async ()=>{
  const code = ($('#join-code')?.value||'').trim();
  if(code.length!==6){ toast?.('Введите корректный код'); return; }
  try {
    const ev = await API.getEventByCode(code);
    guest.code = code;
    guest.event = ev;
    show('join-name');
  } catch (e) {
    toast?.('Событие не найдено');
  }
});

$('#form-join-name')?.addEventListener('submit', async e=>{
  e.preventDefault();
  guest.nickname = $('#jnick').value.trim();
  if(!guest.nickname) return;
  try {
    const r = await joinEvent({ code: guest.code, nickname: guest.nickname });
    if (!r.success) throw new Error(r.error || 'Join failed');
    renderJoinWl(); show('join-wishlist');
  } catch (err) {
    toast?.(err.message || 'Ошибка');
  }
});

function renderJoinWl(){
  const box = $('#join-wish-box'); if(!box) return;
  const wl = guest.event?.wishlist||[];
  box.innerHTML = wl.map(it=>`
    <div class="wish-item">
      <div>${it.title}${it.url? ` · <a href="${it.url}" target="_blank">ссылка</a>`:''}</div>
      <div>
        ${it.claimed_by? `<span style="opacity:.6">занято ${it.claimed_by}</span>`
                        : `<button class="btn btn-sm" data-claim="${it.id}">Заберу</button>`}
      </div>
    </div>
  `).join('') || '<div style="opacity:.7">Список пуст</div>';
}

document.addEventListener('click', async e=>{
  const c = e.target.closest('[data-claim]'); if(!c) return;
  const id = +c.dataset.claim;
  const item = guest.event.wishlist.find(x=>x.id===id);
  if(item && !item.claimed_by){
    try {
      await claimWish(id, guest.nickname);
      item.claimed_by = guest.nickname; renderJoinWl();
    } catch (err) {
      toast?.(err.message || 'Не удалось');
    }
  }
});

$('#btn-join-final')?.addEventListener('click', ()=>{
  const ev = Object.assign({ code: guest.code }, guest.event);
  populateFinal(ev);
  show('final');
});

function setCreateType(t){
  state.create.type = t;
  $('#create-title').textContent = t==='business' ? 'Параметры деловой встречи' : 'Параметры праздника';
  $('#label-place').firstChild.textContent = t==='business' ? 'Место проведения' : 'Локация';
  $('#c-title').placeholder = t==='business' ? 'Название встречи' : 'Название праздника';
}

function six(){ return String(Math.floor(100000 + Math.random()*900000)); }

// модалка “тип встречи”
document.addEventListener('click', e=>{
  const btnType = e.target.closest('#typeModal [data-type]');
  if(!btnType) return;
  const kind = btnType.getAttribute('data-type');
  setCreateType(kind);
  openTypeModal(false);
  show('create-conditions');
});

// шаг 1 → шаг 2
$('#form-create-1')?.addEventListener('submit', e=>{
  e.preventDefault();
  state.create.base = {
    title: $('#c-title').value.trim(),
    date:  $('#c-date').value,
    time:  $('#c-time').value,
    place: $('#c-place').value.trim(),
  };
  if(!state.create.base.title || !state.create.base.date) { toast?.('Заполните название и дату'); return; }
  show('create-reqs');
});

// шаг 2 → wishlist
$('#form-create-2')?.addEventListener('submit', e=>{
  e.preventDefault();
  state.create.reqs = {
    dress:   $('#r-dress').value.trim(),
    bring:   $('#r-bring').value.trim(),
    comment: $('#r-comment').value.trim(),
  };
  renderWishlistCreate(); show('wishlist');
});

// wishlist: рендер/добавление
function renderWishlistCreate(){
  const box = $('#wishlist-box'); if(!box) return;
  box.innerHTML = state.create.wishlist.map(it=>`
    <div class="wish-item">
      <div>${it.title}${it.url? ` · <a href="${it.url}" target="_blank">ссылка</a>`:''}</div>
      <div><button class="btn btn-sm" data-del="${it.id}">Удалить</button></div>
    </div>
  `).join('') || '<div style="opacity:.7">Пока пусто</div>';
}
let _wid = 1;
$('#form-wish-add')?.addEventListener('submit', e=>{
  e.preventDefault();
  const t=$('#w-title').value.trim(); const u=$('#w-url').value.trim();
  if(!t) return;
  state.create.wishlist.push({id:_wid++, title:t, url:u||'', claimed_by:null});
  $('#w-title').value=''; $('#w-url').value=''; renderWishlistCreate();
});
document.addEventListener('click', e=>{
  const del = e.target.closest('[data-del]');
  if(del){ const id=+del.dataset.del; state.create.wishlist = state.create.wishlist.filter(x=>x.id!==id); renderWishlistCreate(); }
});

// финал
$('#btn-create-final')?.addEventListener('click', async ()=>{
  try {
    const draft = {
      type: state.create.type,
      title: state.create.base.title,
      date: state.create.base.date,
      time: state.create.base.time,
      address: state.create.base.place,
      dress: state.create.reqs.dress,
      bring: state.create.reqs.bring,
      comment: state.create.reqs.comment
    };
    const ev = await API.createEvent(draft);
    state.create.code = ev.code;
    for (const w of state.create.wishlist) {
      try { await addWish(ev.code, w.title, w.url); } catch {}
    }
    const full = await API.getEventByCode(ev.code);
    populateFinal(full);
    show('final');
  } catch (err) {
    toast?.(err.message || 'Не удалось создать');
  }
});

function populateFinal(ev){
  state.event = ev; state.code = ev.code;
  $('#final-title').textContent = ev.title || 'Событие';
  $('#invite-title').textContent = ev.title || 'Событие';
  $('#final-code').textContent = ev.code || '—';

  const whenText = [ev.date, ev.time].filter(Boolean).join(' ');
  $('#final-when').textContent = whenText || '—';
  $('#final-address').textContent = ev.address || '—';
  $('#final-dress').textContent = ev.dress || '—';
  $('#final-bring').textContent = ev.bring || '—';
  $('#final-comment').textContent = ev.comment || '—';

  $('#chip-date').textContent = ev.date || '—';
  const chipTime = $('#chip-time');
  if(ev.time){ chipTime.textContent = ev.time; chipTime.hidden = false; } else { chipTime.hidden = true; }
  const chipPlace = $('#chip-place');
  if(ev.address){ chipPlace.textContent = ev.address; chipPlace.hidden = false; } else { chipPlace.hidden = true; }

  $('#invite-desc').textContent = ev.comment || 'Описание / детали.';

  const wlBox = $('#invite-wishlist');
  wlBox.innerHTML = (ev.wishlist || []).map(it =>
    `<li>${it.title || '—'}${it.claimed_by ? ' — занято' : ''}${it.url ? ` • <a href="${it.url}" target="_blank">ссылка</a>` : ''}</li>`
  ).join('');

  let picked = null;
  const myNick = guest.nickname || null;
  if(myNick && ev.wishlist){
    const mine = ev.wishlist.find(w=> (w.claimed_by||'').toLowerCase() === myNick.toLowerCase());
    if(mine){ picked = mine.title; }
  }
  const pickedRow = $('#final-picked-row');
  if(picked){ $('#final-picked').textContent = picked; pickedRow.hidden = false; }
  else { pickedRow.hidden = true; }
}

async function openFinal(code){
  const event = await API.getEventByCode(code);
  populateFinal(event);
  show('final');
}

$('#btn-copy-invite')?.addEventListener('click', ()=>{ if(state.event) copyInvite(state.event); });

async function apiFetch(path, init={}){
  init.headers = Object.assign({'Content-Type':'application/json'}, authHeaders(), init.headers||{});
  const res = await fetch(`/.netlify/functions/${path}`, init);
  const data = await res.json().catch(()=>({}));
  if (!res.ok || data?.success===false) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

async function loadProfileAndEvents(){
  const prof = await apiFetch('profile-get');
  $('#profile-nick').textContent = prof.nickname || '—';
  if (prof.avatar_url) {
    $('#avatar-img').src = prof.avatar_url;
    $('#avatar-upload').textContent = 'Изменить аватар';
  } else {
    $('#avatar-upload').textContent = 'Загрузить аватар';
  }
  renderEventsColumn('#profile-upcoming', []);
  renderEventsColumn('#profile-past', []);
}

function splitEvents(list){
  const now = new Date();
  const parse = (e)=>{
    const dt = new Date(`${e.date || ''}T${(e.time||'00:00')}:00`);
    return isFinite(dt) ? dt : new Date(8640000000000000);
  };
  const upcoming = [], past = [];
  for (const e of list){
    (parse(e) >= now ? upcoming : past).push(e);
  }
  upcoming.sort((a,b)=> new Date(`${a.date}T${a.time||'00:00'}`) - new Date(`${b.date}T${b.time||'00:00'}`));
  past.sort((a,b)=> new Date(`${b.date}T${b.time||'00:00'}`) - new Date(`${a.date}T${a.time||'00:00'}`));
  return { upcoming, past };
}

function renderEventsColumn(sel, items){
  const box = $(sel); if (!box) return;
  box.innerHTML = items.map(e => `
    <div class="event-item" data-open-event="${e.code || e.id}">
      <div>
        <div class="event-title">${e.title || '—'}</div>
        <div class="event-meta">${e.date || '—'} ${e.time || ''} · ${e.address || '—'}</div>
      </div>
      <div class="event-actions">
        <button class="btn btn-sm" data-open-event="${e.code || e.id}">Открыть</button>
      </div>
    </div>
  `).join('') || '<div style="opacity:.7">Пока пусто</div>';
}

document.addEventListener('click', async (e)=>{
  const trg = e.target.closest('[data-open-event]');
  if (!trg) return;
  const key = trg.getAttribute('data-open-event');
  try{
    const q = isNaN(+key) ? `events-get?code=${encodeURIComponent(key)}` : `events-get?id=${key}`;
  const { event } = await apiFetch(q);
  if (typeof openFinal === 'function')      await openFinal(event.code);
  else if (typeof openEvent === 'function')  await openEvent(event);
  else {
        const ft=$('#final-title'); if(ft) ft.textContent = event.title || '—';
        show('app');
      }
    }catch(err){ alert(err.message || 'Не удалось открыть событие'); }
  });

  $('#avatar-upload')?.addEventListener('click', ()=> $('#avatar-file')?.click());
  $('#avatar-file')?.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0]; if (!file) return;
    const b64 = await fileToBase64Resized(file, 512);
    try{
      const { url } = await apiFetch('avatar-upload', { method:'POST', body: JSON.stringify({ image: b64 }) });
      $('#avatar-img').src = url;
      $('#avatar-upload').textContent = 'Изменить аватар';
    }catch(err){ alert(err.message || 'Не удалось загрузить аватар'); }
  });

  async function fileToBase64Resized(file, max){
    const img = await new Promise(r => { const i=new Image(); i.onload=()=>r(i); i.src=URL.createObjectURL(file); });
    const scale = Math.min(1, max/Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width*scale));
    const h = Math.max(1, Math.round(img.height*scale));
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    return c.toDataURL('image/jpeg', 0.9);
  }

  const appState = window.__APP_STATE__ ?? (window.__APP_STATE__ = { currentEvent: null });

function init() {
  document.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('[data-delete-id]');
    if (delBtn) {
      e.preventDefault();
      const id = delBtn.dataset.deleteId;
      delBtn.disabled = true;
      try {
        const res = await fetch('/.netlify/functions/event-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ id })
        }).then(r => r.json());
        if (res?.success) {
          document.querySelectorAll(`[data-card-id="${id}"]`).forEach(n => n.remove());
          toast('Удалено');
        } else {
          toast('Не удалось удалить');
          delBtn.disabled = false;
        }
      } catch {
        toast('Ошибка сети');
        delBtn.disabled = false;
      }
      return;
    }

    const openBtn = e.target.closest('[data-open-id]');
    if (openBtn) {
      e.preventDefault();
      const id = openBtn.dataset.openId;
      if (typeof openEvent === 'function') openEvent(id);
    }
  });
}

// --- API: события ---
const apiLegacy = {
  events: {
    async create() {
      // сервер создаёт код, даты и т.п. из текущего драфта/формы; при необходимости передай поля
      const res = await fetch('/.netlify/functions/event-create-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({}), // если есть форма драфта — подставь сюда
      });
      const data = await res.json();
      if (!res.ok || !data?.id) throw new Error(data?.error || 'Не удалось создать событие');
      return data; // { id, code, ... }
    },
    async byCode(code) {
      const res = await fetch('/.netlify/functions/event-one-v2?code=' + encodeURIComponent(code), {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data?.event?.id) throw new Error(data?.error || 'Код не найден');
      return data.event;
    },
    async load(id) {
      const res = await fetch('/.netlify/functions/event-one-v2?id=' + encodeURIComponent(id), {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data?.event?.id) throw new Error(data?.error || 'Событие не найдено');
      return data.event;
    },
  },
};

async function renderEvent(eventIdOrObj) {
  const ev = typeof eventIdOrObj === 'object' ? eventIdOrObj : await apiLegacy.events.load(eventIdOrObj);
  appState.currentEvent = ev;
  // заполни поля экрана события
  $('#event-code')?.replaceChildren(document.createTextNode(ev.code ?? '—'));
  $('#event-when')?.replaceChildren(document.createTextNode(ev.date && ev.time ? `${ev.date} · ${ev.time}` : '—'));
  $('#event-address')?.replaceChildren(document.createTextNode(ev.address ?? '—'));
  $('#event-dress')?.replaceChildren(document.createTextNode(ev.dress_code ?? '—'));
  $('#event-bring')?.replaceChildren(document.createTextNode(ev.to_bring ?? '—'));
  $('#event-comment')?.replaceChildren(document.createTextNode(ev.comment ?? '—'));
}

async function openEvent(id) {
  await renderEvent(id);
  show('app');
}

// Обработчики create/join удалены: навигация осуществляется через общий делегат

function withBusy(btn, fn){
  return async (...a)=>{
    if(!btn) return fn(...a);
    const t=btn.textContent; btn.disabled=true; btn.textContent='Подождите…';
    try{ return await fn(...a); } finally{ btn.disabled=false; btn.textContent=t; }
  };
}

async function callFn(name, payload){
  const url = `/.netlify/functions/${name}`;
  console.log('[fetch]', name, {url, payload});
  const res = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload??{})});
  const data = await res.json().catch(()=> ({}));
  if(!res.ok || data?.ok===false){
    const msg = data?.error || data?.message || `Ошибка ${name}`;
    console.error('[fn:error]', name, res.status, data);
    throw new Error(msg);
  }
  console.log('[fn:ok]', name, data);
  return data;
}

const getNickname = ()=> localStorage.getItem(LS_NICK)||'';
const setNickname = (n)=> {
  localStorage.setItem(LS_NICK, n);
  const badge = $('[data-user-badge]');
  if(badge) badge.textContent = n||'гость';
};
setNickname(getNickname());

/* ---------- Supabase init with proxy fallback ---------- */
const DEBUG_AUTH = !!window.DEBUG_AUTH;
const dbgAuth = (...args) => { if (DEBUG_AUTH) console.debug('[auth]', ...args); };
const DEBUG_EVENTS = !!window.DEBUG_EVENTS;

function probeDirect(url){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  return fetch(url + '/auth/v1/health', { method: 'HEAD', signal: ctrl.signal })
    .then(res => { clearTimeout(timer); return res.ok; })
    .catch(() => { clearTimeout(timer); return false; });
}

async function ensureSupabase(){
  if(window.__supabaseClient){ return window.__supabaseClient; }

  if(!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY){
    throw new Error('Supabase URL or anon key not configured');
  }

  while(typeof window.createClient !== 'function'){
    await new Promise(r => setTimeout(r,50));
  }

  let mode = sessionStorage.getItem('sb_mode');
  let baseUrl;
  if(mode){
    baseUrl = mode === 'proxy' ? window.PROXY_SUPABASE_URL : window.SUPABASE_URL;
  }else{
    const ok = await probeDirect(window.SUPABASE_URL);
    if(ok){
      baseUrl = window.SUPABASE_URL;
      mode = 'direct';
    }else{
      baseUrl = window.PROXY_SUPABASE_URL;
      mode = 'proxy';
    }
    sessionStorage.setItem('sb_mode', mode);
  }

  const sb = window.createClient(baseUrl, window.SUPABASE_ANON_KEY, {
    auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
  window.__supabaseClient = sb;
  window.supabase = sb;
  return sb;
}

async function switchToProxyAndRetry(action){
  sessionStorage.setItem('sb_mode','proxy');
  window.__supabaseClient = null;
  const sb = await ensureSupabase();
  return await action(sb);
}

window.ensureSupabase = ensureSupabase;

const clearNickname = () => setNickname('');

function renderUserBadge({ nickname, email } = {}) {
  const badge = document.querySelector('[data-user-badge]');
  if (!badge) return;
  const name = (nickname && nickname.trim()) || getNickname() || (email || '').split('@')[0] || 'гость';
  badge.textContent = name;
}

function sendAuthTelemetry(kind, mode){
  try{
    if(DEBUG_AUTH) return;
    fetch('/.netlify/functions/auth-telemetry',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ kind, mode: mode || sessionStorage.getItem('sb_mode') || 'direct', ua:navigator.userAgent, ts:Date.now() }),
      keepalive:true
    }).catch(()=>{});
  }catch(_){ /* ignore */ }
}

async function withTimeout(promiseFactory, ms, label){
  const controller = new AbortController();
  const p = promiseFactory(controller.signal);
  const t = setTimeout(() => controller.abort('timeout'), ms);
  try{
    return await p;
  }catch(err){
    if(controller.signal.aborted){
      const e = new Error(label || 'timeout');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  }finally{
    clearTimeout(t);
  }
}

async function callFnEx(name, { method='POST', body, headers={} } = {}, { timeoutMs=15000, retryOnceOnNetwork=true } = {}) {
  const url = `/.netlify/functions/${name}`;
  const auth = await (typeof authHeader === 'function' ? authHeader() : {});
  const doFetch = (signal) => fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...auth, ...headers },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  try {
    const res = await withTimeout((signal)=>doFetch(signal), timeoutMs, `${name.toUpperCase()}_TIMEOUT`);
    if (!res.ok) {
      const text = await res.text().catch(()=> '');
      const err = new Error(text || res.statusText); err.status = res.status; throw err;
    }
    return await res.json().catch(()=> ({}));
  } catch (e) {
    const net = (e.name==='AbortError' || e.code==='TIMEOUT' || /Failed to fetch|NetworkError/i.test(String(e)));
    if (net && retryOnceOnNetwork) {
      try {
        const res = await withTimeout((signal)=>doFetch(signal), timeoutMs, `${name.toUpperCase()}_TIMEOUT_RETRY`);
        if (!res.ok) { const t = await res.text().catch(()=> ''); const er = new Error(t||res.statusText); er.status=res.status; throw er; }
        return await res.json().catch(()=> ({}));
      } catch (e2) { e.original = e2; throw e; }
    }
    throw e;
  }
}

function explainFnError(err){
  if (err.status===401||err.status===403) return 'Нет прав. Войдите заново.';
  if (err.status===409) return 'Конфликт данных. Попробуйте снова.';
  if (err.code==='TIMEOUT') return 'Сервер не отвечает. Повторите попытку.';
  if (/Failed to fetch|NetworkError/i.test(String(err))) return 'Проблема со связью. Проверьте интернет.';
  return 'Ошибка сервера. Попробуйте позже.';
}

function formatAuthError(e){
  console.error(e);
  const msg = e?.message || '';
  const st = e?.status;
  if(st === 400 || st === 401 || msg === 'Invalid login credentials') return 'Неверная почта или пароль';
  if(st === 429 || /rate limit/i.test(msg)) return 'Слишком много попыток, попробуйте позже';
  if(st === 500) return 'Сервис недоступен, повторите позже';
  if(msg === 'User already registered') return 'Пользователь с этой почтой уже существует';
  if(e?.code === 'TIMEOUT' || (e instanceof TypeError && /Failed to fetch|network/i.test(msg))){
    sendAuthTelemetry('auth_failed_fetch');
    return 'Не удалось связаться с сервером авторизации. Попробуйте вход по ссылке.';
  }
  return 'Ошибка входа: ' + (msg || String(e));
}

function isFetchErr(e){
  const msg = e?.message || '';
  return e?.code === 'TIMEOUT' || (e instanceof TypeError && /Failed to fetch/i.test(msg));
}

function validateAuthForm(fields, mode){
  const errors={};
  const email=(fields.email||'').trim().toLowerCase();
  if(!email) errors.email='Введите почту';
  else if(!/^\S+@\S+\.\S+$/.test(email)) errors.email='Некорректная почта';
  const pass=fields.password||'';
  if(!pass) errors.password='Введите пароль';
  else if(pass.length<4) errors.password='Пароль слишком короткий';
  if(mode==='signup'){
    const pass2=fields.password2||'';
    if(!pass2) errors.password2='Повторите пароль';
    else if(pass2!==pass) errors.password2='Пароли не совпадают';
    const nick=(fields.nickname||'').trim();
    if(!nick) errors.nickname='Введите имя';
  }
  return { ok:Object.keys(errors).length===0, errors };
}

function clearFieldError(input){
  if(!input) return;
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');
  const errId='err-'+input.id;
  input.removeAttribute('aria-describedby');
  const el=document.getElementById(errId);
  if(el) el.remove();
}

function showFieldError(input,msg){
  if(!input) return;
  let errId='err-'+input.id;
  let err=document.getElementById(errId);
  if(!err){
    err=document.createElement('div');
    err.id=errId;
    err.className='field-error';
    input.insertAdjacentElement('afterend',err);
  }
  err.textContent=msg;
  input.classList.add('is-invalid');
  input.setAttribute('aria-invalid','true');
  input.setAttribute('aria-describedby',errId);
  const onInput=()=>{clearFieldError(input);input.removeEventListener('input',onInput);};
  input.addEventListener('input',onInput);
}

function showFormError(el,msg){ if(el) el.textContent=msg; }
function clearFormError(el){ if(el) el.textContent=''; }

function applyValidationErrors(mode, errors){
  const map= mode==='login'
    ? { email:'loginEmail', password:'loginPass' }
    : { nickname:'regName', email:'regEmail', password:'regPass', password2:'regPass2' };
  Object.entries(errors).forEach(([k,v])=>{
    const el=document.getElementById(map[k]);
    showFieldError(el,v);
  });
  const firstKey=Object.keys(errors)[0];
  if(firstKey){
    const firstEl=document.getElementById(map[firstKey]);
    firstEl?.scrollIntoView({ behavior:'smooth', block:'center' });
    if(!reduceMotion) firstEl?.classList.add('shake');
    setTimeout(()=>firstEl?.classList.remove('shake'),200);
    setTimeout(()=>firstEl?.focus(),100);
    const ann = mode==='login'?$('#loginAnnounce'):$('#regAnnounce');
    if(ann) ann.textContent=errors[firstKey];
  }
}

/* ---------- ПОЛЬЗОВАТЕЛИ / СЕССИЯ ---------- */
const USERS_KEY = 'froggyhub_users_v1';
const SESSION_KEY = 'froggyhub_session_email';
const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
const saveUsers = () => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const setSession = (email) => localStorage.setItem(SESSION_KEY, email);
const getSession = () => localStorage.getItem(SESSION_KEY);
let currentUser = null;
let lastSession = null;
let rebindTried = false;
let manualSignOut = false;

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
const randBytes = (len=16) => crypto.getRandomValues(new Uint8Array(len));

async function pbkdf2Hash(password, saltHex, iterations=150_000){
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(h=>parseInt(h,16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name:'PBKDF2', hash:'SHA-256', salt, iterations },
    key,
    256
  );
  return toHex(bits);
}

function timingSafeEqual(aHex, bHex){
  if (aHex.length !== bHex.length) return false;
  let diff = 0;
  for (let i=0; i<aHex.length; i++) diff |= aHex.charCodeAt(i) ^ bHex.charCodeAt(i);
  return diff === 0;
}

async function sha256(pass){
  const buf=await crypto.subtle.digest('SHA-256', enc.encode(pass));
  return toHex(buf);
}

async function doLogout(msg){
  const sb = await ensureSupabase();
  manualSignOut = true;
  try{ await sb.auth.signOut(); }catch(_){ }
  manualSignOut = false;
  try{ await fetch('/.netlify/functions/local-logout'); }catch(_){ }
  clearNickname();
  renderUserBadge({ nickname:'', email:'' });
  sessionStorage.removeItem('sb_mode');
  sessionStorage.removeItem('pendingCreate');
  localStorage.removeItem(COOKIE_TEMP_KEY);
  localStorage.removeItem(SESSION_KEY);
  clearToken();
  if(msg){
    sessionBanner.textContent = msg;
    sessionBanner.hidden = false;
  }else{
    sessionBanner.hidden = true;
  }
  show('#screen-auth');
  setAuthState('login');
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function buildInviteUrl(code){
  const url = new URL(location.href);
  url.searchParams.set('code', code);
  return url.toString();
}

async function shareInvite(code){
  const link = buildInviteUrl(code);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'FroggyHub', text: 'Присоединяйся к событию', url: link });
      return;
    } catch (_) {}
  }
  await navigator.clipboard.writeText(link);
  toast('Ссылка скопирована: ' + link);
}

/* ---------- УТИЛИТЫ ---------- */
const sessionBanner = document.getElementById('sessionBanner');
function toggleAuthButtons(disabled){
  document.querySelectorAll('[data-requires-auth]').forEach(btn=>{
    if(disabled) btn.setAttribute('disabled',''); else btn.removeAttribute('disabled');
  });
}
toggleAuthButtons(true);
function trapFocus(node){
  const f=node.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
  if(!f.length) return () => {};
  const first=f[0], last=f[f.length-1];
  const handler=e=>{
    if(e.key!=='Tab') return;
    if(e.shiftKey && document.activeElement===first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement===last){ first.focus(); e.preventDefault(); }
  };
  node.addEventListener('keydown',handler);
  return ()=>node.removeEventListener('keydown',handler);
}
function showById(idToShow){
  const map = {'#screen-auth':'auth', '#screen-menu':'menu', '#screen-app':'app', '#screen-profile':'profile'};
  if (map[idToShow]) return show(map[idToShow]);
  ['#screen-auth','#screen-menu','#screen-app','#screen-profile'].forEach(id=>{
    const el=$(id); if(!el) return; el.hidden = (id!==idToShow);
  });
}

function showAuthPane(kind){
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginPane = document.getElementById('pane-login');
  const registerPane = document.getElementById('pane-register');
  const isLogin = kind === 'login';
  loginTab?.classList.toggle('is-active', isLogin);
  loginTab?.setAttribute('aria-selected', isLogin ? 'true' : 'false');
  registerTab?.classList.toggle('is-active', !isLogin);
  registerTab?.setAttribute('aria-selected', !isLogin ? 'true' : 'false');
  loginPane?.classList.toggle('is-hidden', !isLogin);
  registerPane?.classList.toggle('is-hidden', isLogin);
  const pane = isLogin ? loginPane : registerPane;
  const focusEl = pane?.querySelector('input,button,select,textarea,[tabindex="0"]');
  focusEl?.focus();
  document.getElementById(`pane-${kind}`)?.scrollIntoView({behavior:'smooth', block:'start'});
}

// табы логин/регистрация — после твоей логики переключения
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const chips = document.getElementById('authSteps')?.querySelectorAll('.chip');

function setAuthStep(mode){ // mode: 'login' | 'register' | 'profile'
  if(!chips) return;
  chips.forEach(ch => ch.classList.remove('chip-on'));
  const active = (mode === 'profile')
      ? document.querySelector('.chip[data-step="profile"]')
      : document.querySelector('.chip[data-step="1"]');
  active?.classList.add('chip-on');
}

// после успешного входа/регистрации, когда показываешь профиль
function openProfileScreen(){
  setAuthStep('profile');
  loadProfileAndEvents().catch(console.error);
}

// --- Auth state management ---
let authState = 'login';
let loginBtn, regBtn;
let isAuthPending = false;
let dbgLogin, dbgSignup;
const resetEmailBlock = document.getElementById('resetEmailBlock');
const resetPassBlock = document.getElementById('resetPassBlock');
function updateRegBtnState(){
  if(!regBtn) return;
  const { ok } = validateAuthForm({
    nickname: document.getElementById('regName')?.value,
    email: document.getElementById('regEmail')?.value,
    password: document.getElementById('regPass')?.value,
    password2: document.getElementById('regPass2')?.value
  }, 'signup');
  if(ok){ regBtn.disabled=false; regBtn.removeAttribute('aria-disabled'); }
  else { regBtn.disabled=true; regBtn.setAttribute('aria-disabled','true'); }
  updateAuthDebug();
}

function updateAuthDebug(){
  if(!DEBUG_AUTH) return;
  const sbMode = sessionStorage.getItem('sb_mode') || 'direct';
  const btn = authState === 'signup' ? regBtn : loginBtn;
  let overlay = false;
  if(btn){
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
    overlay = !!(el && el !== btn && !btn.contains(el));
  }
  const msg = `state:${authState} loginDisabled:${!!loginBtn?.disabled} signupDisabled:${!!regBtn?.disabled} pending:${isAuthPending} sbMode:${sbMode} overlay:${overlay}`;
  if(dbgLogin) dbgLogin.textContent = msg;
  if(dbgSignup) dbgSignup.textContent = msg;
  dbgAuth(msg);
}

function setAuthState(state){
  const prev = authState;
  authState = state;
  const panes = { login: document.getElementById('paneLogin'), signup: document.getElementById('paneSignup'), reset: document.getElementById('paneReset') };
  Object.entries(panes).forEach(([name,pane])=>{
    const active = name===state;
    if(pane){
      pane.hidden = !active;
      if('inert' in pane){ pane.inert = !active; }
      else if(!active){ pane.setAttribute('inert',''); } else { pane.removeAttribute('inert'); }
      if(!active){
        pane.querySelectorAll('.is-invalid').forEach(el=>el.classList.remove('is-invalid'));
        pane.querySelectorAll('.form-error').forEach(el=>el.textContent='');
        pane.querySelectorAll('input').forEach(inp=>{
          if(name==='login' && prev==='login' && state==='reset' && inp.id==='loginEmail') return;
          inp.value='';
        });
      }
    }
  });
  const tabs = { login: document.getElementById('tabLogin'), signup: document.getElementById('tabSignup') };
  Object.entries(tabs).forEach(([name,tab])=>{
    if(tab){
      const active = name===state;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active? 'true':'false');
    }
  });
  sessionStorage.setItem('auth_state', state);
  const params = new URLSearchParams(location.search);
  params.set('auth', state);
  history.replaceState(null,'', location.pathname + '?' + params.toString() + location.hash);
  const panel = panes[state];
  const focusMap = { login:'loginEmail', signup:'regName', reset:'resetEmail' };
  document.getElementById(focusMap[state])?.focus({ preventScroll:true });
  if(prev==='login' && state==='reset'){
    const email = document.getElementById('loginEmail')?.value;
    if(email) document.getElementById('resetEmail').value = email;
  }
  if(state==='reset'){
    resetEmailBlock.hidden = false;
    resetPassBlock.hidden = true;
  }
  if(state==='signup'){
    if(loginBtn){ loginBtn.disabled=false; loginBtn.textContent='Войти'; loginBtn.removeAttribute('aria-disabled'); }
    if(regBtn){ regBtn.textContent='Зарегистрироваться'; }
    updateRegBtnState();
  }else{
    if(regBtn){ regBtn.disabled=false; regBtn.textContent='Зарегистрироваться'; regBtn.removeAttribute('aria-disabled'); }
    if(loginBtn){ loginBtn.disabled=false; loginBtn.textContent='Войти'; loginBtn.removeAttribute('aria-disabled'); }
  }
  panel?.scrollIntoView({ behavior:'smooth', block:'center' });
  updateAuthDebug();
}

tabLogin?.addEventListener('click', () => { showAuthPane('login'); setAuthStep('login'); });
tabRegister?.addEventListener('click', () => { showAuthPane('register'); setAuthStep('register'); });
showAuthPane('login');
setAuthStep('login');

const forgotBtn = document.getElementById('showReset');
const forgotBlock = document.getElementById('resetPassBlock');
forgotBtn?.addEventListener('click',()=>{
  const state = forgotBtn.getAttribute('data-forgot') === 'true';
  if(state){
    forgotBtn.setAttribute('data-forgot','false');
    forgotBlock?.classList.add('is-hidden');
  }else{
    forgotBtn.setAttribute('data-forgot','true');
    forgotBlock?.classList.remove('is-hidden');
    forgotBlock?.querySelector('input,button,select,textarea,[tabindex="0"]')?.focus();
  }
});

// local auth helpers
const showErr = (where, e)=>console.error(`[${where}]`, e?.status, e?.message || e);

const call = async (path, body)=>{
  try{
    const res = await fetch(`/.netlify/functions/${path}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok || !data.ok){
      const err = new Error(data?.error || `${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }catch(err){
    err.status = err.status || 0;
    throw err;
  }
};

function setBusy(zone,on){
  const b = zone==='reg' ? document.getElementById('btn-register') : document.getElementById('btn-login');
  if(!b) return;
  b.disabled = !!on;
  b.textContent = on ? (zone==='reg'?'Регистрируем…':'Входим…') : (zone==='reg'?'Зарегистрироваться':'Войти');
}

function setStatus(zone,msg){
  const id = zone==='reg' ? 'reg-status' : 'login-status';
  const el = document.getElementById(id);
  if(el){ el.textContent = msg||''; }
}

function goToLobby(){
  show('#screen-menu');
}

async function handleRegister(){
  const nickname = document.getElementById('reg-nickname')?.value.trim();
  const p1 = document.getElementById('reg-password')?.value;
  const p2 = document.getElementById('reg-password2')?.value;
  if(!nickname || p1.length<4 || p1!==p2) return setStatus('reg','Проверьте ник и пароли');
  setStatus('reg','');
  setBusy('reg', true);
  document.getElementById('reg-nickname')?.classList.remove('input-error');
  try{
    await call('auth-register', { nickname, password: p1 });
    setNickname(nickname);
    renderUserBadge({ nickname });
    setStatus('reg','Готово! Теперь войдите.');
    showAuthPane('login');
    const li = document.querySelector('#pane-login input[name="login"], #pane-login input[type="text"], #pane-login input[type="email"]');
    if(li){ li.value = nickname; li.focus(); }
  }catch(e){
    showErr('register', e);
    let msg = e?.message || 'Ошибка сети';
    if(e.status === 409){
      msg = 'Ник уже занят';
      const field = document.getElementById('reg-nickname');
      field?.classList.add('input-error');
      field?.focus();
    }else if(e.status >= 500 || e.status === 0){
      msg = 'Проблемы с сервером, попробуйте позже';
    }
    setStatus('reg', msg);
  }finally{
    setBusy('reg', false);
  }
}

async function handleLogin(){
  const nickname = document.getElementById('login-identifier')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  if(!nickname || !password) return setStatus('login','Введите ник и пароль');
  setStatus('login','');
  setBusy('login', true);
  try{
    const { user } = await call('auth-login', { nickname, password });
    const n = user?.nickname || nickname;
    setNickname(n);
    renderUserBadge({ nickname: n });
    localStorage.setItem('fh_user', JSON.stringify(user));
    setStatus('login','Вход выполнен');
    goToLobby();
  }catch(e){
    showErr('login', e);
    let msg = e?.message || 'Ошибка сети';
    if(e.status === 401){
      msg = 'Неверный ник или пароль';
    }else if(e.status >= 500 || e.status === 0){
      msg = 'Проблемы с сервером, попробуйте позже';
    }
    setStatus('login', msg);
  }finally{
    setBusy('login', false);
  }
}

document.getElementById('btn-register')?.addEventListener('click', handleRegister);
document.getElementById('btn-login')?.addEventListener('click', handleLogin);

// --- Password reset ---
const resetBtn = document.getElementById('resetSend');
resetBtn?.addEventListener('click', async (e)=>{
  e.preventDefault();
  clearFormError(document.getElementById('resetError'));
  const email = document.getElementById('resetEmail').value.trim().toLowerCase();
  if(!email){ showFormError(document.getElementById('resetError'),'Введите почту'); return; }
  const orig = resetBtn.textContent;
  resetBtn.disabled=true; resetBtn.textContent='Отправляем…';
  try{
    const sb = await ensureSupabase();
    await withTimeout(() => sb.auth.resetPasswordForEmail(email),15000);
    toast('Письмо отправлено');
  }catch(err){
    showFormError(document.getElementById('resetError'), formatAuthError(err));
  }finally{
    resetBtn.disabled=false; resetBtn.textContent=orig;
  }
});

const resetSetBtn = document.getElementById('resetSet');
resetSetBtn?.addEventListener('click', async ()=>{
  clearFormError(document.getElementById('resetError'));
  const p1 = document.getElementById('resetPass').value;
  const p2 = document.getElementById('resetPass2').value;
  if(!p1 || p1.length<4){ showFormError(document.getElementById('resetError'),'Пароль слишком короткий'); return; }
  if(p1 !== p2){ showFormError(document.getElementById('resetError'),'Пароли не совпадают'); return; }
  const orig = resetSetBtn.textContent;
  resetSetBtn.disabled=true; resetSetBtn.textContent='Сохраняем…';
  try{
    const sb = await ensureSupabase();
    const { error } = await sb.auth.updateUser({ password:p1 });
    if(error) throw error;
    toast('Пароль изменён');
    setAuthState('login');
  }catch(ex){
    showFormError(document.getElementById('resetError'), formatAuthError(ex));
  }finally{
    resetSetBtn.disabled=false; resetSetBtn.textContent=orig;
  }
});

/* ---------- АВТОВХОД ---------- */
(async function autoLogin() {
  const sb = await ensureSupabase();
  if(sb){
    const { data } = await sb.auth.getSession();
    const supUser = data.session?.user;
    const emailSup = supUser?.email;
    if(emailSup){
      currentUser = supUser;
      setSession(emailSup);
      window.currentUserEmail = emailSup;
      renderUserBadge({ nickname: getNickname(), email: emailSup });
      show('#screen-menu');
      return;
    }
  }
  const email = getSession();
  if (email && users[email]) {
    window.currentUserEmail = email;
    renderUserBadge({ nickname: getNickname(), email });
    show('#screen-menu');
  } else {
    localStorage.removeItem(SESSION_KEY);
    show('#screen-auth');
    setAuthState('login');
  }
})();

/* ---------- COOKIE CONSENT ---------- */
const COOKIE_CHOICE_KEY = 'cookie_choice';
const COOKIE_TEMP_KEY = 'cookie_consent_temp';
let analyticsTag = null;
function applyCookieChoice(choice){
  if(choice?.analytics){
    if(!analyticsTag){
      const src = window.ANALYTICS_SRC || '';
      if(src){
        analyticsTag = document.createElement('script');
        analyticsTag.src = src;
        analyticsTag.async = true;
        document.head.appendChild(analyticsTag);
      }
    }
  } else {
    analyticsTag?.remove();
    analyticsTag = null;
  }
}

let isSavingConsent = false;
let saveConsentTimer = null;
let releaseCookieTrap = null;
let lastFocusEl = null;

function hideCookieBanner(banner){
  banner.hidden = true;
  banner.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cookie-open');
  releaseCookieTrap?.();
  releaseCookieTrap = null;
  lastFocusEl?.focus();
  lastFocusEl = null;
  console.debug('[cookies] hidden'); // TODO: remove debug
}

async function persistCookieChoice(choice, banner, status){
  if(isSavingConsent) return;
  isSavingConsent = true;
  try{
    const sb = await ensureSupabase();
    if(sb){
      const { data:{ user } } = await sb.auth.getUser();
      if(user){
        await sb.from('cookie_consents').upsert({ user_id: user.id, choice });
        localStorage.setItem(COOKIE_CHOICE_KEY, JSON.stringify(choice));
        localStorage.removeItem(COOKIE_TEMP_KEY);
      }else{
        localStorage.setItem(COOKIE_CHOICE_KEY, JSON.stringify(choice));
        localStorage.setItem(COOKIE_TEMP_KEY, JSON.stringify(choice));
      }
    }
    applyCookieChoice(choice);
    toast('Настройки сохранены');
    console.debug('[cookies] saved', choice); // TODO: remove debug
    hideCookieBanner(banner);
    status.textContent = '';
  } catch(e){
    console.warn('cookie save', e);
    status.textContent = 'Не удалось сохранить';
  } finally {
    isSavingConsent = false;
  }
}

function queueCookieSave(choice, banner, status){
  if(isSavingConsent) return;
  clearTimeout(saveConsentTimer);
  saveConsentTimer = setTimeout(()=>persistCookieChoice(choice, banner, status),300);
}

async function initCookieBanner(){
  const banner = document.getElementById('cookieBanner');
  if(!banner) return;
  const analyticsCb = document.getElementById('cookieAnalytics');
  const accept = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  const status = document.getElementById('cookieStatus');

  let choice=null;
  const stored = localStorage.getItem(COOKIE_CHOICE_KEY);
  if(stored){
    try{ choice = JSON.parse(stored); }catch(_){ choice=null; }
  } else {
    try{
      const sb = await ensureSupabase();
      if(sb){
        const { data:{ user } } = await sb.auth.getUser();
        if(user){
          const { data } = await sb.from('cookie_consents').select('choice').eq('user_id', user.id).single();
          if(data?.choice){
            choice = data.choice;
            localStorage.setItem(COOKIE_CHOICE_KEY, JSON.stringify(choice));
          }
        }
      }
    }catch(e){ console.warn('cookie load', e); }
  }

  console.debug('[cookies] init/loaded choice', choice); // TODO: remove debug

  if(choice){
    analyticsCb.checked = !!choice.analytics;
    applyCookieChoice(choice);
    return;
  }

  lastFocusEl = document.activeElement;
  banner.hidden = false;
  banner.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cookie-open');
  releaseCookieTrap = trapFocus(banner);

  const saveCurrent = () => {
    const c = { necessary:true, analytics: analyticsCb.checked };
    queueCookieSave(c, banner, status);
  };

  analyticsCb?.addEventListener('change', saveCurrent);
  accept?.addEventListener('click', () => {
    analyticsCb.checked = true;
    saveCurrent();
  });
  decline?.addEventListener('click', saveCurrent);
}

document.addEventListener('DOMContentLoaded', initCookieBanner);

document.addEventListener('DOMContentLoaded', () => {
  const email = window.currentUserEmail || '';
  renderUserBadge({ nickname: getNickname(), email });
});

const url = new URL(location.href);
const isHome = url.pathname === '/' || url.pathname.endsWith('/index.html');

ensureSupabase().then(async sb => {
  if(!sb) return;
  const { data:{ session } } = await sb.auth.getSession();
  currentUser = session?.user || null;
  toggleAuthButtons(!currentUser);
  if(isHome){
    if(currentUser){
      window.currentUserEmail = currentUser.email || '';
      renderUserBadge({ nickname: getNickname(), email: window.currentUserEmail });
      show('#screen-menu');
      const pending = sessionStorage.getItem('pendingCreate');
      if(pending){
        Object.assign(eventData, JSON.parse(pending));
        sessionStorage.removeItem('pendingCreate');
        save();
        startCreateFlow();
      }
    } else {
      show('#screen-auth');
      setAuthState('login');
    }
  }
  sb.auth.onAuthStateChange(async (event, session)=>{
    if(event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN'){
      lastSession = session;
      rebindTried = false;
    }
    if(event === 'SIGNED_OUT'){
      currentUser = null;
      toggleAuthButtons(true);
      if(manualSignOut){ manualSignOut=false; return; }
      if(!rebindTried && lastSession){
        try{
          const { error } = await sb.auth.setSession(lastSession);
          if(!error){ return; }
        }catch(_){ }
        rebindTried = true;
      }
      await doLogout('Сессия истекла, войдите снова');
      return;
    }
    currentUser = session?.user || null;
    toggleAuthButtons(!currentUser);
    if(event === 'PASSWORD_RECOVERY'){
      if(isHome){
        setAuthState('reset');
        resetEmailBlock.hidden = true;
        resetPassBlock.hidden = false;
        show('#screen-auth');
      }
      return;
    }
    if(event === 'SIGNED_IN' && currentUser){
      window.currentUserEmail = currentUser.email || '';
      renderUserBadge({ nickname: getNickname(), email: window.currentUserEmail });
      if(isHome){
        show('#screen-menu');
        const pendingProfile = sessionStorage.getItem('pendingProfileName');
        if(pendingProfile){
          try{ await sb.from('profiles').upsert({ id: currentUser.id, nickname: pendingProfile }); }catch(e){ console.warn('profile upsert', e); }
          sessionStorage.removeItem('pendingProfileName');
        }
        const hash = location.hash || '';
        if(hash.includes('error=')){
          const code = new URLSearchParams(hash.slice(1)).get('error');
          sessionBanner.innerHTML = `Ошибка: ${code}. <button id="resendFromBanner" class="btn ghost">Переотправить письмо</button>`;
          sessionBanner.hidden = false;
          document.getElementById('resendFromBanner')?.addEventListener('click', async ()=>{
            try{ await sb.auth.resend({ type:'signup', email: currentUser.email }); sessionBanner.textContent='Письмо отправлено'; }catch(_){ sessionBanner.textContent='Не удалось отправить'; }
          });
          sendAuthTelemetry('redirect_error_'+code);
        } else {
          sessionBanner.hidden = true;
        }
      }
      const temp = localStorage.getItem(COOKIE_TEMP_KEY);
      const uid = session?.user?.id;
      if(temp && uid){
        try{
          const choice = JSON.parse(temp);
          await sb.from('cookie_consents').upsert({ user_id: uid, choice });
          localStorage.setItem(COOKIE_CHOICE_KEY, temp);
          localStorage.removeItem(COOKIE_TEMP_KEY);
          applyCookieChoice(choice);
          return;
        }catch(e){ console.warn('cookie sync', e); }
      }
      const stored = localStorage.getItem(COOKIE_CHOICE_KEY);
      if(!stored && uid){
        try{
          const { data } = await sb.from('cookie_consents').select('choice').eq('user_id', uid).single();
          if(data?.choice){
            localStorage.setItem(COOKIE_CHOICE_KEY, JSON.stringify(data.choice));
            applyCookieChoice(data.choice);
          }
        }catch(e){ console.warn('cookie sync', e); }
      }
      const pending = sessionStorage.getItem('pendingCreate');
      if(pending){
        Object.assign(eventData, JSON.parse(pending));
        sessionStorage.removeItem('pendingCreate');
        save();
        startCreateFlow();
      }
    }
  });
});
$('#changePassBtn')?.addEventListener('click', async ()=>{
  clearFormError($('#changePassError'));
  const curr = $('#currPass').value;
  const np1 = $('#newProfilePass').value;
  const np2 = $('#newProfilePass2').value;
  if(!curr || !np1 || !np2){ showFormError($('#changePassError'),'Заполните все поля'); return; }
  if(np1.length<4){ showFormError($('#changePassError'),'Пароль слишком короткий'); return; }
  if(np1!==np2){ showFormError($('#changePassError'),'Пароли не совпадают'); return; }
  try{
    const sb = await ensureSupabase();
    const { data:{ user } } = await sb.auth.getUser();
    const email = user?.email;
    if(!email) throw new Error('no_user');
    const { error: err } = await sb.auth.signInWithPassword({ email, password: curr });
    if(err){ showFormError($('#changePassError'),'Текущий пароль неверен'); return; }
    const { error } = await sb.auth.updateUser({ password: np1 });
    if(error) throw error;
    toast('Пароль обновлён');
    $('#currPass').value=''; $('#newProfilePass').value=''; $('#newProfilePass2').value='';
  }catch(ex){
    showFormError($('#changePassError'), formatAuthError(ex));
  }
});

$('#deleteAccountBtn')?.addEventListener('click', ()=>{
  $('#deleteConfirm').showModal();
});

$('#confirmDeleteBtn')?.addEventListener('click', async ()=>{
  const dlg = $('#deleteConfirm');
  try{
    const sb = await ensureSupabase();
    const { data:{ session } } = await sb.auth.getSession();
    const token = session?.access_token;
    await fetch('/.netlify/functions/delete-account', { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    dlg.close();
    await doLogout();
  }catch(_){
    dlg.close();
    toast('Не удалось удалить аккаунт');
  }
});

/* ---------- ЛОББИ: переходы ---------- */
// переход к созданию события теперь обрабатывается через api.events.create
// $('#create-event')?.addEventListener('click', startCreateFlow);
$('#goJoinByCode')?.addEventListener('click', ()=>{
  show('#screen-app');
  setScene('pond'); renderPads(); frogJumpToPad(0,true); showSlide('join-code');
  const code=$('#lobbyJoinCode').value.trim();
  if(code){
    $('#joinCodeInput').value=code;
    $('#joinCodeInput').dispatchEvent(new Event('input'));
  }
});

const lobbyCodeInput=document.getElementById('lobbyJoinCode');
const lobbyJoinBtn=document.getElementById('goJoinByCode');
if(lobbyCodeInput && lobbyJoinBtn){
  lobbyJoinBtn.disabled=true;
  lobbyCodeInput.addEventListener('input',()=>{
    lobbyCodeInput.value=lobbyCodeInput.value.replace(/\D/g,'').slice(0,6);
    lobbyJoinBtn.disabled = lobbyCodeInput.value.length!==6;
  });
}

const codeInput=document.getElementById('joinCodeInput');
const joinBtn=document.getElementById('joinCodeBtn');
if(codeInput && joinBtn){
  joinBtn.disabled=true;
  const err=document.getElementById('joinCodeError');
  codeInput.addEventListener('input',()=>{
    codeInput.value=codeInput.value.replace(/\D/g,'').slice(0,6);
    joinBtn.disabled = codeInput.value.length!==6;
    if(err) err.textContent='';
  });
}


/* ---------- ПРУД / ЛЯГУШКА ---------- */
const FROG_IDLE="assets/frog_idle.png";
const FROG_JUMP="assets/frog_jump.png";
const CROAK_URL="assets/croak.mp3";
let croakAudio=null; try{croakAudio=new Audio(CROAK_URL);croakAudio.volume=.75}catch(e){}
const croak=()=>{ if(!croakAudio) return; try{croakAudio.currentTime=0;croakAudio.play();}catch(e){} };

const body=document.body, pond=document.getElementById('pond');
const frog=document.getElementById('frog'), frogImg=document.getElementById('frogImg');
const padsWrap=document.getElementById('pads');
const speech=document.getElementById('speech');
const root=document.getElementById('root');
const bigClock = $('#bigClock'), bigClockHM = $('#bigClockHM'), bigClockDays = $('#bigClockDays');
const finalLayout = $('#finalLayout');
const slidesEl = $('#slides');
const stumpImg = document.getElementById('stumpImg');

// Фикс для мобильных: держим мобильную раскладку при открытой клавиатуре
function installMobileLock(){
  const vv = window.visualViewport;
  const isCoarse = matchMedia('(pointer: coarse)').matches;

  const update = () => {
    let kbOpen = false;
    if (vv) {
      // если высота визуального вьюпорта сильно меньше window.innerHeight → открыта клавиатура
      kbOpen = (window.innerHeight - vv.height) > 120;
    }
    document.body.classList.toggle('force-mobile', kbOpen || isCoarse);
  };

  update();
  window.addEventListener('resize', update);
  vv?.addEventListener('resize', update);
  document.addEventListener('focusin', update);
  document.addEventListener('focusout', update);
}
installMobileLock();
stumpImg?.addEventListener('load',()=>{
  if(document.body.classList.contains('scene-final')) placeFrogOnStump();
});

function setScene(scene){
  document.body.classList.remove('scene-intro','scene-pond','scene-final');
  document.body.classList.add(`scene-${scene}`);

  $('#slides').hidden = (scene !== 'pond');
  $('#finalLayout').style.display = (scene === 'final') ? 'flex' : 'none';
  $('#bigClock').hidden = (scene !== 'final');

  if (scene === 'final'){
    placeFrogOnStump();
    window.scrollTo(0,0);
  }
}

window.addEventListener('resize', () => {
  if (document.body.classList.contains('scene-final')) placeFrogOnStump();
});
window.visualViewport?.addEventListener('resize', () => {
  if (document.body.classList.contains('scene-final')) placeFrogOnStump();
});

/* Лягушка на пне */
function placeFrogOnStump(){
  const stump = document.querySelector('#stumpImg');
  const frog  = document.querySelector('#frog');
  if(!stump || !frog) return;
  const r = stump.getBoundingClientRect();
  const top  = r.top  + window.scrollY + r.height * 0.58;
  const left = r.left + window.scrollX + r.width  * 0.50;
  frog.style.top = `${top}px`;
  frog.style.left = `${left}px`;
}

const stepToPad = {
  'create-1':0, 'create-wishlist':1, 'create-details':2, 'admin':3,
  'join-code':0, 'join-1':1, 'join-wishlist':2
};
let lastPadIndex = 0;

function renderPads(){
  padsWrap.innerHTML='';
  const rect=pond.getBoundingClientRect();
  const pondW = rect.width || document.documentElement.clientWidth || window.innerWidth || 1024;
  const pondH = rect.height || Math.max(400, Math.round(window.innerHeight*0.48));
  const baseY = pondH*0.70;
  const xs = [15, 40, 65, 88];

  for(let i=0;i<4;i++){
    const pad=document.createElement('div'); pad.className='pad';
    pad.style.left = (pondW*xs[i]/100)+'px';
    pad.style.top  = ( (i%2===0)? baseY : (baseY-60) )+'px';
    padsWrap.appendChild(pad);
  }
  immediatePlaceFrog(lastPadIndex);
}
function immediatePlaceFrog(index){
  const pad=padsWrap.children[index]; if(!pad) return;
  const rect=pad.getBoundingClientRect(), stage=document.body.getBoundingClientRect();
  frog.style.left=(rect.left+rect.width/2-stage.left)+'px';
  frog.style.top =(rect.top +rect.height*0.52-stage.top )+'px';
}
function frogJumpToPad(index, forceJump=false){
  const pad=padsWrap.children[index]; if(!pad){ return; }
  const rect=pad.getBoundingClientRect(), stage=document.body.getBoundingClientRect();
  frog.style.left=(rect.left+rect.width/2-stage.left)+'px';
  frog.style.top =(rect.top +rect.height*0.52-stage.top )+'px';
  if(forceJump && !reduceMotion){
    frogImg.src=FROG_JUMP; frog.classList.remove('jump'); void frog.offsetWidth; frog.classList.add('jump'); croak();
    setTimeout(()=>{ frogImg.src=FROG_IDLE; },550);
  }
  lastPadIndex = index;
}

function withTransition(next){ root.classList.add('fading'); setTimeout(()=>{ next&&next(); root.classList.remove('fading'); }, 450); }
function showSlide(id){
  document.querySelectorAll('#slides > section').forEach(s=>s.hidden=true);
  $(`#slide-${id}`).hidden=false;
  if(stepToPad[id] !== undefined){ frogJumpToPad(stepToPad[id], true); }
}

async function startCreateFlow(){
  const sb = await ensureSupabase();
  const { data:{ user } = {} } = sb ? await sb.auth.getUser() : { data:{} };
  if(user){
    show('#screen-app');
    setScene('pond'); renderPads(); frogJumpToPad(0,true); showSlide('create-1');
  } else {
    sessionStorage.setItem('pendingCreate', JSON.stringify(eventData));
    show('#screen-auth');
    setAuthState('login');
  }
}

/* интро-кнопки */
document.getElementById('speech').querySelector('.actions').onclick=(e)=>{
  const btn=e.target.closest('button'); if(!btn) return;
  withTransition(()=>{
    if(btn.dataset.next==='create'){
      startCreateFlow();
    } else {
      show('#screen-app'); setScene('pond'); renderPads(); frogJumpToPad(0,true); showSlide('join-code');
    }
  });
};

/* ---------- ДАННЫЕ СОБЫТИЯ ---------- */
const STORAGE='froggyhub_state_v14';
let eventData = JSON.parse(localStorage.getItem(STORAGE)||'null') || {
  id:Math.random().toString(36).slice(2,8),
  title:'',date:'',time:'',address:'',dress:'',bring:'',notes:'',
  wishlist:Array.from({length:25},(_,i)=>({id:i+1,title:'',url:'',claimedBy:''})),
  guests:[], join_code:null
};
const save=()=>localStorage.setItem(STORAGE,JSON.stringify(eventData));
let isEventActionPending = false;
// флаг, чтобы не было повторной отправки
let creatingEvent = false;

function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }
async function uniqueCode(sb){
  for(let i=0;i<5;i++){
    const c=genCode();
    const { data } = await sb.from('events').select('id').eq('join_code', c).maybeSingle();
    if(!data) return c;
  }
  throw new Error('Не удалось сгенерировать код');
}

async function createEvent(sb, ownerId, { title, date, time, address, dress, bring, notes, wishlist }){
  const join_code = await uniqueCode(sb);
  const ttlDays = 14;
  const code_expires_at = new Date(Date.now() + ttlDays*24*60*60*1000).toISOString();
  const event_at = new Date(`${date}T${time}:00`).toISOString();
  const payload = { owner_id: ownerId, title, address, dress, bring, notes, join_code, code_expires_at, event_at };
  console.debug('createEvent payload', payload);
  const { data, error } = await sb.from('events').insert([payload]).select('*').single();
  if(error){ console.debug('createEvent error', error); throw error; }
  console.debug('createEvent response', data);
  const items = (wishlist||[]).filter(i=>i.title||i.url).map(it=>({
    event_id: data.id, title: it.title, url: it.url
  }));
  if(items.length){ await sb.from('wishlist_items').insert(items); }
  return data;
}

/* шаги создания */
$('#formCreate')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const title=$('#eventTitle').value.trim();
  const date=$('#eventDate').value.trim();
  const time=$('#eventTime').value.trim();
  const address=$('#eventAddress').value.trim();
  if(!title||!date||!time){ toast('Заполните название, дату и время'); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)){ toast('Неверный формат даты или времени'); return; }
  Object.assign(eventData,{title,date,time,address}); save();
  withTransition(()=>{ showSlide('create-wishlist'); renderGrid(); });
});

const wlGrid=$('#wlGrid'), editor=$('#cellEditor');
const cellTitle=$('#cellTitle'), cellUrl=$('#cellUrl'); let currentCellId=null;
if(editor) trapFocus(editor);
editor?.addEventListener('close', ()=> editor.querySelector('button, input')?.blur());

function renderGrid(){
  wlGrid.innerHTML=''; wlGrid.style.gridTemplateColumns=`repeat(5,1fr)`;
  eventData.wishlist.forEach(cell=>{
    const div=document.createElement('div'); div.className='cell'+(cell.claimedBy?' taken':''); div.dataset.id=cell.id;
    div.innerHTML=`${cell.claimedBy?'<div class="status">Занято</div>':'<div class="status">Свободно</div>'}
                   <div class="label">${cell.title||''}</div>
                   <div class="action">${cell.url?`<a href="${cell.url}" target="_blank" rel="noopener">Открыть</a>`:''}</div>`;
    div.addEventListener('click',()=>openEditor(cell.id)); wlGrid.appendChild(div);
  });
}
function openEditor(id){
  currentCellId=id; const c=eventData.wishlist.find(x=>x.id===id);
  cellTitle.value=c.title||''; cellUrl.value=c.url||'';
  editor.showModal?editor.showModal():editor.setAttribute('open','');
  cellTitle.focus();
}
$('#saveCell')?.addEventListener('click', async ()=>{
  const c=eventData.wishlist.find(x=>x.id===currentCellId);
  c.title=cellTitle.value.trim(); c.url=cellUrl.value.trim();
  save(); renderGrid();
  if(eventData.id){
    try{
      const res = await apiWishlistAdd({ event_id:eventData.id, id:c.id, title:c.title, url:c.url });
      if(res?.item?.id) c.id = res.item.id;
    }catch(err){ toast(explainFnError(err)); }
  }
});
$('#clearWL')?.addEventListener('click',()=>{ eventData.wishlist.forEach(c=>{c.title='';c.url='';c.claimedBy='';}); save(); renderGrid(); });
$('#addItem')?.addEventListener('click',()=>{ const nextId=eventData.wishlist.length?Math.max(...eventData.wishlist.map(i=>i.id))+1:1; eventData.wishlist.push({id:nextId,title:'',url:'',claimedBy:''}); save(); renderGrid(); });
$('#toDetails')?.addEventListener('click',()=>withTransition(()=>{ showSlide('create-details'); }));
editor?.addEventListener('click',e=>{ const r=editor.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) editor.close(); });

$('#formDetails')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(isEventActionPending) return;
  isEventActionPending = true;
  const btn = e.submitter;
  const original = btn?.textContent;
  btn?.setAttribute('disabled','');
  btn && (btn.textContent='Создаём…');
  Object.assign(eventData,{
    dress:$('#eventDress').value.trim(),
    bring:$('#eventBring').value.trim(),
    notes:$('#eventNotes').value.trim()
  });
  const status=$('#createEventStatus');
  status.textContent='';
  try{
    const payload = {
      title:eventData.title,
      date:eventData.date,
      time:eventData.time,
      address:eventData.address,
      dress_code:eventData.dress,
      bring:eventData.bring,
      notes:eventData.notes
    };
    await createEventAndGoLobby(payload);
    status.textContent='Событие создано';
  }catch(err){
    status.textContent = err.message || String(err);
    toast(err.message || String(err));
  }finally{
    isEventActionPending=false;
    btn?.removeAttribute('disabled');
    if(btn) btn.textContent = original || 'Сгенерировать код';
  }
});
function renderAdmin(){
  $('#eventCode').textContent=eventData.join_code||'—';
  const exp=$('#codeExpire');
  if(exp){
    if(eventData.code_expires_at){
      const d=new Date(eventData.code_expires_at);
      exp.textContent=`Код истечёт ${d.toLocaleDateString('ru-RU')}`;
    } else exp.textContent='';
  }
  const link=$('#analyticsLink');
  if(link){
    link.href=`event-analytics.html?id=${encodeURIComponent(eventData.id||'')}`;
    link.hidden=!eventData.id;
  }
  const html=(eventData.wishlist.filter(i=>i.title||i.url).map(i=>`${i.title||'Подарок'} — ${i.claimedBy?'🔒 занято':'🟢 свободно'} ${i.url?`• <a href="${i.url}" target="_blank">ссылка</a>`:''}`)).map(s=>`<li>${s}</li>`).join('');
  $('#adminGifts').innerHTML=html||'<li>Вишлист пуст</li>';
}
$('#finishCreate')?.addEventListener('click',()=>withTransition(()=>toFinalScene()));


/* ПРИСОЕДИНЕНИЕ ПО КОДУ */
async function joinByCode(code){
  const announce = document.getElementById('joinCodeError');
  announce.textContent='';
  if(isEventActionPending) return;
  isEventActionPending = true;
  const original = joinBtn?.textContent;
  joinBtn?.setAttribute('disabled','');
  if(joinBtn) joinBtn.textContent='Присоединяем…';
  try{
    const evt = await callFnEx('event-one-v2?code='+encodeURIComponent(code), { method:'GET' });
    const nick = localStorage.getItem(LS_NICK) || '';
    if(nick){
      try{ await callFnEx('event-join-v2',{ method:'POST', body:{ code, nickname:nick } }); }catch(_){ }
    }
    await loadEvent(evt.event.id);
    setScene('final');
  }catch(err){
    if(err.status===404||err.status===400) announce.textContent='Неверный или истёкший код.';
    else announce.textContent=explainFnError(err);
    toast(announce.textContent);
  }finally{
    isEventActionPending=false;
    joinBtn?.removeAttribute('disabled');
    if(joinBtn) joinBtn.textContent=original || 'Проверить';
  }
}

let rtChannel;

async function subscribeEventRealtime(eventId, { onWishlist, onGuests } = {}) {
  const sb = await ensureSupabase();
  if(!sb) return;
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ console.warn('Realtime: auth required'); return; }
  const { data:{ user } } = await sb.auth.getUser();
  const isOwner = user?.id && eventData.owner_id && user.id === eventData.owner_id;
  const sanitizeWishlist = (r)=> r ? ({ id:r.id, title:r.title, url:r.url, claimed_by:r.claimed_by || r.taken_by || r.reserved_by }) : null;
  const sanitizeGuest = (r)=> r ? ({ name:r.name, rsvp:r.rsvp }) : null;
  if (rtChannel) { sb.removeChannel(rtChannel); rtChannel = null; }
  rtChannel = sb
    .channel('event-' + eventId)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'wishlist_items', filter: 'event_id=eq.' + eventId
    }, (payload) => {
      const data = isOwner ? payload : { eventType: payload.eventType, new: sanitizeWishlist(payload.new), old: sanitizeWishlist(payload.old) };
      onWishlist?.(data);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'guests', filter: 'event_id=eq.' + eventId
    }, (payload) => {
      const data = isOwner ? payload : { eventType: payload.eventType, new: sanitizeGuest(payload.new), old: sanitizeGuest(payload.old) };
      onGuests?.(data);
    })
    .subscribe(status => {
      if(status === 'CHANNEL_ERROR') console.warn('Realtime channel not connected: insufficient rights');
    });
}

async function renderWishlist(eventId){
  const sb = await ensureSupabase();
  if(!sb) return;
  const { data } = await sb.from('wishlist_items').select('id,title,url,claimed_by').eq('event_id', eventId).order('id');
  eventData.wishlist = (data || []).map(it=>({ id:it.id, title:it.title, url:it.url, claimedBy:it.claimed_by || '' }));
  if(!$('#slide-join-wishlist').hidden) renderGuestWishlist();
  if(!$('#slide-create-wishlist').hidden) renderGrid();
  if(!$('#slide-admin').hidden) renderAdmin();
  if(document.body.classList.contains('scene-final')) toFinalScene();
}

async function renderGuests(eventId){
  const sb = await ensureSupabase();
  if(!sb) return;
  const { data } = await sb.from('guests').select('name,rsvp').eq('event_id', eventId);
  eventData.guests = data || [];
  if(document.body.classList.contains('scene-final')) toFinalScene();
}

async function loadEvent(eventId){
  try{
    const data = await callFnEx('event-one-v2?id='+encodeURIComponent(eventId), { method:'GET' });
    if(data.event){
      Object.assign(eventData, data.event);
      eventData.date = data.event.date;
      eventData.time = data.event.time;
    }
    eventData.wishlist = (data.wishlist || []).map(it=>({ id:it.id, title:it.title, url:it.url, claimedBy:it.claimed_by || '' }));
    await Promise.all([renderWishlist(eventId), renderGuests(eventId)]);
    await subscribeEventRealtime(eventId, {
      onWishlist: () => renderWishlist(eventId),
      onGuests:   () => renderGuests(eventId),
    });
  }catch(err){
    toast(explainFnError(err));
  }
}

function cleanupRealtime(){ if (rtChannel) { window.__supabaseClient?.removeChannel(rtChannel); rtChannel = null; } }
window.addEventListener('beforeunload', cleanupRealtime);

$('#joinCodeBtn')?.addEventListener('click', () => {
  if(isEventActionPending) return;
  const code = (document.getElementById('joinCodeInput')?.value || '').trim();
  if(!/^\d{6}$/.test(code)){
    const announce = document.getElementById('joinCodeError');
    announce.textContent = 'Введите 6 цифр';
    return;
  }
  joinByCode(code);
});

async function joinCurrentEvent(){
  try{ await callFnEx('event-join-v2',{ method:'POST', body:{ code:eventData.join_code, nickname:currentGuestName || '' }}); }catch(_){ }
}
/* RSVP + подарок */
let currentGuestName='';
document.querySelectorAll('[data-rsvp]')?.forEach(b=>b.addEventListener('click',e=>{
  const code=e.currentTarget.dataset.rsvp, name=($('#guestName').value||'').trim();
  if(!name) return toast('Введите имя');
  currentGuestName=name;
  const ex=eventData.guests.find(g=>g.name.toLowerCase()===name.toLowerCase());
  if(ex) ex.rsvp=code; else eventData.guests.push({name,rsvp:code});
  save(); croak();
}));
$('#toGuestWishlist')?.addEventListener('click',()=>{
  const name=($('#guestName').value||'').trim(); if(!name) return toast('Введите имя');
  currentGuestName=name; withTransition(()=>{ showSlide('join-wishlist'); renderGuestWishlist(); });
});
const guestGifts=$('#guestGifts');
function renderGuestWishlist(){
  const items=eventData.wishlist.filter(i=>i.title||i.url);
  guestGifts.innerHTML=items.map(item=>{
    const me=item.claimedBy && item.claimedBy.toLowerCase()===currentGuestName.toLowerCase();
    const taken=!!item.claimedBy && !me;
    const status=taken?`<span class="pill-mini">Занято</span>`:me?`<span class="pill-mini">Вы выбрали</span>`:`<span class="pill-mini">Свободно</span>`;
    const chooseBtn=taken?'': me ? `<button data-id="${item.id}" class="pill-mini unchoose">Снять выбор</button>` : `<button data-id="${item.id}" class="pill-mini choose">Выбрать</button>`;
    const link=item.url?` • <a href="${item.url}" target="_blank" rel="noopener">ссылка</a>`:'';
    return `<div class="list-item" style="display:flex;justify-content:space-between;align-items:center;background:#113424;border:1px solid #2a7c56;border-radius:12px;padding:10px 12px">
              <div><strong>${item.title||'Подарок'}</strong><span class="meta">${link}</span></div>
              <div class="gift-actions" style="display:flex;gap:8px">${status}${chooseBtn}</div>
            </div>`;
  }).join('');
  guestGifts.querySelectorAll('.choose').forEach(b=>b.addEventListener('click',async e=>{
    const id=+e.currentTarget.dataset.id; const it=eventData.wishlist.find(x=>x.id===id);
    if(it.claimedBy && it.claimedBy.toLowerCase()!==currentGuestName.toLowerCase()) return toast('Этот подарок уже выбрали');
    eventData.wishlist.forEach(x=>{ if(x.claimedBy && x.claimedBy.toLowerCase()===currentGuestName.toLowerCase()) x.claimedBy=''; });
    it.claimedBy=currentGuestName; save(); renderGuestWishlist();
    try{ await apiWishlistClaim(id, currentGuestName); }catch(_){ }
  }));
  guestGifts.querySelectorAll('.unchoose').forEach(b=>b.addEventListener('click',async e=>{
    const id=+e.currentTarget.dataset.id; const it=eventData.wishlist.find(x=>x.id===id);
    if(it.claimedBy && it.claimedBy.toLowerCase()===currentGuestName.toLowerCase()){ it.claimedBy=''; save(); renderGuestWishlist(); try{ await apiWishlistClaim(id, ''); }catch(_){ } }
  }));
}
$('#skipWishlist')?.addEventListener('click',async()=>{ await joinCurrentEvent(); withTransition(()=>toFinalScene()); });
$('#toGuestFinal')?.addEventListener('click',async()=>{ await joinCurrentEvent(); withTransition(()=>toFinalScene()); });

/* ---------- ФИНАЛ: две колонки ---------- */
let finalTimer = null;
function getEventDate(){
  const iso = `${eventData.date}T${eventData.time}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function toFinalScene(){
  setScene('final');
  croak();

  $('#fTitle').textContent = eventData.title || 'Событие';
  // чипы под заголовком отключены намеренно

  $('#fNotes').textContent = eventData.notes || 'Встречаемся и празднуем!';
  $('#fDress').textContent = eventData.dress || '—';
  $('#fBring').textContent = eventData.bring || '—';

  const fwl = $('#fWishlist');
  const items = eventData.wishlist.filter(i=>i.title||i.url).slice(0,8);
  fwl.innerHTML = items.length
    ? items.map(i=>`<div class="wl-tile ${i.claimedBy?'taken':''}">
          <div class="ttl">${i.title||'Подарок'}</div>
          <div class="tag">${i.claimedBy?`🔒 занято (${i.claimedBy})`:'🟢 свободно'}</div>
        </div>`).join('')
    : `<div class="wl-tile"><div class="ttl">Пусто</div><div class="tag">Добавьте пожелания</div></div>`;

  const yes = eventData.guests.filter(g=>g.rsvp==='yes').length;
  const maybe = eventData.guests.filter(g=>g.rsvp==='maybe').length;
  const no = eventData.guests.filter(g=>g.rsvp==='no').length;
  const chosen = eventData.wishlist.filter(i=>i.claimedBy).length;
  const totalW = eventData.wishlist.filter(i=>i.title||i.url).length;
  $('#fStats').innerHTML = `
    <div><strong>Гости:</strong> Идут — <b>${yes}</b>, Возможно — <b>${maybe}</b>, Не идут — <b>${no}</b></div>
    <div style="margin-top:6px"><strong>Подарки:</strong> Занято — <b>${chosen}</b>, Свободно — <b>${Math.max(0,totalW-chosen)}</b></div>
  `;
  $('#fShare').innerHTML = `
    <div class="codeRow">
      <span id="eventCodeText">Код: <strong id="eventCode">${eventData.join_code||'—'}</strong></span>
      <button class="btn btn--ghost btn--sm" id="copyInviteBtn">Скопировать приглашение</button>
    </div>
  `;

  function tickClock(){
    const dt = getEventDate();
    if(!dt){ bigClockHM.textContent='—:—'; bigClockDays.textContent='—'; return; }
    const diff = dt - new Date();
    if(diff<=0){ bigClockHM.textContent='00:00'; bigClockDays.textContent='Праздник начался!'; return; }
    const days = Math.floor(diff/86400000);
    const rem  = diff%86400000;
    const hours = Math.floor(rem/3600000);
    const mins  = Math.floor((rem%3600000)/60000);
    const pad=n=>n.toString().padStart(2,'0');
    bigClockHM.textContent=`${pad(hours)}:${pad(mins)}`;
    bigClockDays.textContent = days===1 ? 'Остался 1 день' : `Осталось ${days} дней`;
  }
  tickClock(); clearInterval(finalTimer); finalTimer=setInterval(tickClock,1000);
}

/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */
(function initIntro(){
  renderPads();
  window.addEventListener('resize',()=>{
    if(document.body.classList.contains('scene-pond')){
      const keep = lastPadIndex;
      renderPads();
      immediatePlaceFrog(keep);
    }
  });
})();

/* ---------- РЕДАКТИРОВАНИЕ СОБЫТИЯ ---------- */
const editForm = document.getElementById('editForm');
if(editForm){
  const fields = {
    title: document.getElementById('editTitle'),
    date: document.getElementById('editDate'),
    time: document.getElementById('editTime'),
    address: document.getElementById('editAddress'),
    notes: document.getElementById('editNotes'),
    dress: document.getElementById('editDress'),
    bring: document.getElementById('editBring')
  };
  const errEl = document.getElementById('editError');
  const params = new URLSearchParams(location.search);
  const eventId = params.get('id');
  let currentEvent = {};

  async function loadDetails(){
    try{
      const res = await fetch(`/.netlify/functions/get-event-details?id=${encodeURIComponent(eventId)}`, {
        headers: await authHeader()
      });
      if(!res.ok) throw new Error(res.status===404 ? 'Событие не найдено' : 'Ошибка загрузки');
      const { event } = await res.json();
      fields.title.value = event.title || '';
      fields.date.value = event.date || '';
      fields.time.value = event.time || '';
      fields.address.value = event.address || '';
      fields.notes.value = event.notes || '';
      fields.dress.value = event.dress_code || '';
      fields.bring.value = event.bring || '';
      currentEvent = {
        title: fields.title.value,
        date: fields.date.value,
        time: fields.time.value,
        address: fields.address.value,
        notes: fields.notes.value,
        dress_code: fields.dress.value,
        bring: fields.bring.value
      };
    }catch(err){ errEl.textContent = err.message; }
  }

  editForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    errEl.textContent='';
    if(!fields.title.value.trim() || !fields.date.value || !fields.time.value){
      errEl.textContent = 'Заполните обязательные поля';
      return;
    }
    const prev = { ...currentEvent };
    const payload = {
      event_id: eventId,
      title: fields.title.value.trim(),
      date: fields.date.value,
      time: fields.time.value,
      address: fields.address.value.trim(),
      notes: fields.notes.value.trim(),
      dress_code: fields.dress.value.trim(),
      bring: fields.bring.value.trim()
    };
    currentEvent = { ...payload };
    toast('Сохраняем...');
    const headers = await authHeader();
    fetch('/.netlify/functions/update-event', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...headers },
      body: JSON.stringify(payload)
    }).then(res=>{
      if(!res.ok){
        throw new Error(res.status===403 ? 'Нет доступа' : res.status===404 ? 'Событие не найдено' : 'Ошибка обновления');
      }
      toast('Событие обновлено');
      setTimeout(()=>{ location.href = `event-analytics.html?id=${encodeURIComponent(eventId)}`; }, 500);
    }).catch(err=>{
      currentEvent = prev;
      fields.title.value = prev.title;
      fields.date.value = prev.date;
      fields.time.value = prev.time;
      fields.address.value = prev.address;
      fields.notes.value = prev.notes;
      fields.dress.value = prev.dress_code;
      fields.bring.value = prev.bring;
      errEl.textContent = err.message;
      toast(err.message);
    });
  });

  loadDetails();
}

/* ---------- Простые обработчики кнопок ---------- */
// Теперь обработчики кнопок создания и присоединения события реализованы
// через делегированные слушатели в начале файла.

async function login(nickname, password){
  const { token } = await callFn('local-login', { nickname, password });
  if(token){ setToken(token); }
  setNickname(nickname);
  return { token };
}

async function signup(nickname, password){
  await callFn('local-signup', { nickname, password });
  const { token } = await callFn('local-login', { nickname, password });
  if(token){ setToken(token); }
  setNickname(nickname);
  return { token };
}

async function loadProfile(){
  try{
    const res = await fetch('/.netlify/functions/profile-get', {
      headers:{ Authorization: 'Bearer ' + getToken() }
    });
    if(res.status===401 || res.status===403){
      clearToken();
      window.location.href = '/';
      return;
    }
    const profile = await res.json().catch(()=> ({}));
    if(profile.nickname){ setNickname(profile.nickname); }
    const n = $('#profile-nickname');
    if(n) n.textContent = profile.nickname || '';
    const d = $('#profile-created');
    if(d && profile.created_at){
      try{ d.textContent = new Date(profile.created_at).toLocaleString('ru-RU'); }catch{}
    }
    console.debug('auth:profile:load ok');
  }catch(e){ console.warn('profile load failed', e); }
}

async function loadMyEvents(){
  const list = $('#my-events');
  if(!list) return;
  list.innerHTML = '';
  try{
    const res = await fetch('/.netlify/functions/events-my', {
      headers:{ Authorization: 'Bearer ' + getToken() }
    });
    const data = await res.json().catch(()=> ({}));
    if(data?.success && Array.isArray(data.events) && data.events.length){
      for(const ev of data.events){
        const li = document.createElement('li');
        const date = ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('ru-RU') : '';
        const span = document.createElement('span');
        span.textContent = `${ev.title||''} ${date && ('('+date+')')}`;
        span.style.cursor = 'pointer';
        span.addEventListener('click', ()=>{ window.location.href = `/event.html?id=${ev.id}`; });
        li.appendChild(span);
        const del = document.createElement('button');
        del.className = 'btn btn-danger';
        del.dataset.action = 'delete';
        del.dataset.id = ev.id;
        del.textContent = 'Удалить';
        li.appendChild(del);
        list.appendChild(li);
      }
    }else{
      const li = document.createElement('li');
      li.textContent = 'Событий нет';
      list.appendChild(li);
    }
  }catch(e){
    console.warn('loadMyEvents failed', e);
    const li = document.createElement('li');
    li.textContent = 'Ошибка загрузки';
    list.appendChild(li);
  }
}

async function initHubPage(){
  if(!/\/hub\.html$/.test(location.pathname)) return;
  if(!getToken()){ window.location.href='/'; return; }
  try{
    const res = await fetch('/.netlify/functions/profile-get', {
      headers:{ Authorization:'Bearer '+getToken() }
    });
    if(res.status===401 || res.status===403){
      clearToken();
      window.location.href='/';
      return;
    }
    const profile = await res.json().catch(()=> ({}));
    const nickEl = $('#mp-nick');
    if(nickEl) nickEl.textContent = profile.nickname || '';
    if(profile.created_at){
      try{
        const crEl = $('#mp-created');
        if(crEl) crEl.textContent = new Date(profile.created_at).toLocaleDateString('ru-RU');
      }catch{}
    }
  }catch(e){ console.warn('hub profile load failed', e); }
  loadMyEvents();
  $('[data-action="create"]')?.addEventListener('click', (e)=>{
    e.preventDefault();
    window.location.href = '/event-edit.html';
  });
  $('[data-action="join"]')?.addEventListener('click', ()=>{
    const code = $('[data-input="join-code"]')?.value?.trim();
    if(!code) return;
    if(/^https?:/i.test(code)){
      window.location.href = code;
    }else{
      window.location.href = '/event.html?code=' + encodeURIComponent(code);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(/\/profile\.html$/.test(location.pathname)){
    if(!getToken()){
      window.location.href = '/';
      return;
    }
    loadProfile();
  }
});

document.addEventListener('DOMContentLoaded', initHubPage);

async function uiSmoke(){
  const report = [];
  const need = [
    ['create-event', !!document.querySelector('[data-action="create-event"]')],
    ['join-event',   !!document.querySelector('[data-action="join-event"]')],
    ['login',        !!document.querySelector('#login-btn')],
    ['signup',       !!document.querySelector('#signup-btn')],
    ['logout',       !!document.querySelector('#btn-logout')],
  ];
  need.forEach(([k, ok])=> report.push({button:k, present:ok}));
  console.table(report);
  if(report.some(x=>!x.present)) console.warn('Не все кнопки найдены на странице');
}
uiSmoke();

if(DEBUG_AUTH){
  dbgAuth('sb_mode', sessionStorage.getItem('sb_mode') || 'direct');
}

// ==== API helpers (не трогаем существующие экспорты, просто добавляем) ====
const API_BASE = '/.netlify/functions';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || res.statusText);
  return data;
}

async function apiWishlistAdd(body){
  return callFnEx('wishlist-add-v2',{ method:'POST', body });
}
async function apiWishlistClaim(item_id, nickname){
  return callFnEx('wishlist-claim-v2',{ method:'POST', body:{ item_id, nickname } });
}

// ==== Создание события (owner) ====
async function handleCreateEvent(formEl) {
  const fd = new FormData(formEl);
  const payload = {
    title: fd.get('title') || fd.get('party_name') || 'Моё событие',
    date: fd.get('date') || fd.get('party_date'),
    time: fd.get('time') || fd.get('party_time'),
    address: fd.get('address') || fd.get('party_address') || '',
    dress: fd.get('dress') || '',
    bring: fd.get('bring') || '',
    notes: fd.get('notes') || ''
  };
  const data = await callFnEx('event-create-v2', { method:'POST', body: payload });
  window.location.href = `/lobby.html?eventId=${encodeURIComponent(data.event?.id || data.eventId)}`;
}

// ==== Присоединение гостя по коду ====
async function handleJoinEvent(formEl) {
  const fd = new FormData(formEl);
  const code = String(fd.get('code') || '').trim().toUpperCase();
  const name = String(fd.get('name') || fd.get('guest_name') || '').trim();
  if (!code) throw new Error('Заполните код');
  const ev = await callFnEx('event-one-v2?code='+encodeURIComponent(code), { method:'GET' });
  if (name) { try { await callFnEx('event-join-v2', { method:'POST', body:{ code, nickname:name } }); } catch(_){ } }
  window.location.href = `/lobby.html?eventId=${encodeURIComponent(ev.event.id)}`;
}

// ==== Привязки к формам (если есть на странице) ====
document.addEventListener('DOMContentLoaded', () => {
  const createForm = document.querySelector('form[data-create-event]');
  if (createForm) createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await handleCreateEvent(createForm); } catch (err) { alert('Ошибка сохранения: ' + err.message); }
  });

  const joinForm = document.querySelector('form[data-join-event]');
  if (joinForm) joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await handleJoinEvent(joinForm); } catch (err) { alert('Ошибка: ' + err.message); }
  });

  if (document.body.dataset.page === 'lobby') {
    const qp = new URLSearchParams(location.search);
    const code = qp.get('code');
    const eventId = qp.get('eventId') || qp.get('id');
    if (!code && !eventId) {
      location.replace('/');
      throw new Error('No event code');
    }
    if (code) goLobbyByCode(code); else if (eventId) goLobby(eventId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button').forEach(b => {
    if (!b.classList.contains('btn')) {
      b.classList.add('btn', 'btn--primary');
    }
  });

  document.querySelectorAll("a[data-btn], a.button, a.btn, a[href^='#btn']").forEach(a => {
    if (!a.classList.contains('btn')) {
      a.classList.add('btn', 'btn--ghost');
    }
  });
});

// Делегированный обработчик удаления события
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="delete"][data-id]');
  if (btn) onDeleteEventClick(btn.dataset.id);
});

async function onDeleteEventClick(eventId) {
  if (!confirm('Удалить событие? Это действие необратимо.')) return;
  const token = getToken();
  const res = await fetch('/.netlify/functions/event-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ event_id: eventId })
  });
  const json = await res.json().catch(()=> ({}));
  if (!res.ok || json?.success !== true) {
    alert('Не удалось удалить событие');
    return;
  }
  loadMyEvents();
}

// ===== util helpers =====
async function getCurrentUser(){
  const sb = await ensureSupabase();
  const { data:{ user } } = await sb.auth.getUser();
  return user;
}

function generateEventCode(){
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

async function createEventAndGoLobby(payload){
  if(creatingEvent) return;
  creatingEvent = true;
  try {
    const user = await getCurrentUser();
    if(!user) throw new Error('Необходимо войти');
    const code = payload.code || generateEventCode();
    const sb = await ensureSupabase();
    const { data, error } = await sb
      .from('events')
      .upsert([{
        code,
        host_user_id: user.id,
        title: payload.title,
        date: payload.date,
        time: payload.time,
        address: payload.address || null,
        dress_code: payload.dress_code || null,
        bring: payload.bring || null,
        notes: payload.notes || null
      }], { onConflict: 'code' })
      .select('*')
      .single();
    if(error) throw error;
    goLobby(data.id);
  } catch (e) {
    alert('Ошибка сохранения: ' + (e.message || e));
  } finally {
    creatingEvent = false;
  }
}

function goLobby(eventId){
  renderLobbySkeleton();
  loadLobby(eventId);
}

function goLobbyByCode(code){
  renderLobbySkeleton();
  loadLobbyByCode(code);
}

async function loadLobbyByCode(code){
  try{
    const { event } = await apiGet(`/events-get?code=${encodeURIComponent(code)}`);
    if(!event){ showToast('Событие не найдено'); return; }
    const ev = { ...event, dress_code: event.dress };
    renderLobbyContent(ev);
    startCountdown(ev.date, ev.time);
  }catch(e){ showToast(e.message||'Событие не найдено'); }
}

async function loadLobby(eventId){
  const sb = await ensureSupabase();
  const { data: ev, error } = await sb
    .from('events')
    .select('id, code, title, date, time, address, dress_code, bring, notes')
    .eq('id', eventId)
    .single();
  if (error || !ev) {
    showToast('Событие не найдено');
    return;
  }
  renderLobbyContent(ev);
  startCountdown(ev.date, ev.time);
}

function renderLobbySkeleton(){
  document.body.classList.add('bg-frog');
  const root = document.getElementById('app') || document.body;
  root.innerHTML = `
    <div class="final-layout">
      <aside class="final-left">
        <div class="final-count">
          <div id="cd-time" class="cd-time">--:--</div>
          <div id="cd-date" class="cd-date" hidden>—</div>
        </div>
        <div class="frog-stump" aria-hidden="true"></div>
      </aside>
      <main class="final-right">
        <div id="final-card" class="final-card"></div>
      </main>
    </div>
  `;
}

function renderLobbyContent(ev){
  const card = document.getElementById('final-card');
  card.innerHTML = `
    <header class="final-head">
      <h1>${escapeHtml(ev.title || 'Моё событие')}</h1>
      <div class="pill-group" id="pill-group"></div>
    </header>

    <section class="final-meta">
      <div class="meta-row"><strong>Дата и время:</strong> ${ev.date} · ${ev.time}</div>
      ${ev.address ? `<div class="meta-row"><strong>Адрес:</strong> ${escapeHtml(ev.address)}</div>` : ''}
      ${ev.dress_code ? `<div class="meta-row"><strong>Дресс-код:</strong> ${escapeHtml(ev.dress_code)}</div>` : ''}
      ${ev.bring ? `<div class="meta-row"><strong>Что взять:</strong> ${escapeHtml(ev.bring)}</div>` : ''}
      ${ev.notes ? `<div class="meta-row"><strong>Комментарий:</strong> ${escapeHtml(ev.notes)}</div>` : ''}
    </section>

    <section class="final-actions">
      <div class="rsvp">
        <button class="btn btn--primary" data-rsvp="yes">Иду</button>
        <button class="btn btn--ghost" data-rsvp="maybe">Возможно</button>
        <button class="btn btn--danger" data-rsvp="no">Не иду</button>
      </div>
      <button class="btn btn--ghost btn--sm" id="copy-invite">Скопировать приглашение</button>
    </section>

    <section class="final-stats">
      <div class="stat"><div class="n" id="stat-yes">0</div><div class="t">Идут</div></div>
      <div class="stat"><div class="n" id="stat-maybe">0</div><div class="t">Возможно</div></div>
      <div class="stat"><div class="n" id="stat-no">0</div><div class="t">Не идут</div></div>
    </section>

    <section class="final-wishlist" id="wishlist">
      <h2>Wishlist</h2>
      <div class="wl-list" id="wl-list"></div>
    </section>
  `;

  document.getElementById('copy-invite').addEventListener('click', () => copyInvite(ev));
  wireRsvp(ev.id);
  loadStats(ev.id);
  loadWishlist(ev.id);
}

function startCountdown(dateStr, timeStr){
  const cdTime = document.getElementById('cd-time');
  const cdDate = document.getElementById('cd-date');
  const target = new Date(`${dateStr}T${timeStr}:00`);
  const showDate = () => {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      cdTime.textContent = 'Старт!';
      cdDate.hidden = true;
      return;
    }
    const h = Math.floor(diff / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    cdTime.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    cdDate.hidden = diff < 24 * 36e5;
    if (!cdDate.hidden) {
      const d = target.toLocaleDateString(undefined, { day:'2-digit', month:'short' });
      cdDate.textContent = d;
    }
  };
  showDate();
  setInterval(showDate, 30 * 1000);
}

function copyInvite(ev){
  const lines = [
    `Привет! Приглашаю тебя на «${ev.title}».`,
    `Когда: ${ev.date}${ev.time ? ' в ' + ev.time : ''}`,
    `Где: ${ev.address || '—'}`,
    `Код для присоединения: ${ev.code}`,
    '',
    'Открой [FroggyHub](https://froggyhubapp.netlify.app) и введи код, чтобы отметить «Иду» и посмотреть wishlist.'
  ];
  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => showToast('Приглашение скопировано'))
    .catch(() => showToast('Не удалось скопировать'));
}

function escapeHtml(str=''){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function showToast(msg){
  toast(msg);
}

async function wireRsvp(eventId){
  document.querySelector('.rsvp')?.addEventListener('click', async e => {
    const btn = e.target.closest('[data-rsvp]');
    if(!btn) return;
    const status = btn.dataset.rsvp;
    const sb = await ensureSupabase();
    const { data:{ user } } = await sb.auth.getUser();
    if(!user){ showToast('Войдите'); return; }
    await sb.from('guests').upsert({ event_id:eventId, user_id:user.id, status }, { onConflict:'event_id,user_id' });
    loadStats(eventId);
  });
}

async function loadStats(eventId){
  const sb = await ensureSupabase();
  const { data } = await sb.from('guests').select('status').eq('event_id', eventId);
  const counts = { yes:0, maybe:0, no:0 };
  (data||[]).forEach(g=>{ counts[g.status] = (counts[g.status]||0)+1; });
  const yesEl = document.getElementById('stat-yes'); if(yesEl) yesEl.textContent = counts.yes||0;
  const maybeEl = document.getElementById('stat-maybe'); if(maybeEl) maybeEl.textContent = counts.maybe||0;
  const noEl = document.getElementById('stat-no'); if(noEl) noEl.textContent = counts.no||0;
}

async function loadWishlist(eventId){
  const sb = await ensureSupabase();
  const { data } = await sb.from('wishlist_items').select('id, title, taken_by, claimed_by').eq('event_id', eventId);
  const list = document.getElementById('wl-list');
  if(!list) return;
  list.innerHTML='';
  (data||[]).forEach(it=>{
    const div=document.createElement('div');
    const taken = !!(it.taken_by || it.claimed_by);
    div.className='wl-card';
    div.innerHTML = `<div>${escapeHtml(it.title||'')}</div><div class="wl-tag ${taken?'wl-taken':'wl-free'}">${taken?'Занято':'Свободно'}</div>`;
    list.appendChild(div);
  });
}

document.querySelectorAll('#copyInviteBtn').forEach(copyBtn => {
  copyBtn.addEventListener('click', async () => {
    const code = (copyBtn.closest('.codeRow')?.querySelector('#eventCode')?.textContent || '').trim();
    if (!code) return;
    const msg = `Привет! Приглашаю тебя на моё мероприятие 🎉\n\nКод для входа: ${code}\nОткрой https://froggyhubapp.netlify.app и введи код на главной странице.\n\nЖду тебя! 🐸`;
    try {
      await navigator.clipboard.writeText(msg);
      copyBtn.textContent = 'Скопировано!';
      setTimeout(()=>copyBtn.textContent = 'Скопировать приглашение', 2000);
    } catch {
      alert('Не удалось скопировать. Скопируй вручную:\n\n' + msg);
    }
  });
});

(() => {
  const KEY = 'fh_cookies_accepted_v1';
  const el = document.getElementById('cookieCard');
  if (!el) return;
  if (!localStorage.getItem(KEY)) el.style.display = 'flex';
  const ok = document.getElementById('cookieAccept');
  const no = document.getElementById('cookieDecline');
  const close = () => { localStorage.setItem(KEY, '1'); el.style.display = 'none'; };
  ok?.addEventListener('click', close);
  no?.addEventListener('click', close);
})();

// ---------- Local auth bindings ----------
async function apiLogin(nickname, password){
  const r = await fetch('/.netlify/functions/local-login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ nickname, password })
  });
  return r.json();
}

async function apiSignup(nickname, password){
  const r = await fetch('/.netlify/functions/local-signup', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ nickname, password })
  });
  return r.json();
}

function wireAuthForms(){
  // ЛОГИН
  const loginForm = $('#loginForm') || $('#login-form') || $('[data-form="login"]');
  const loginNick = $('#loginForm [name="nickname"]') || $('#login-nickname') || $('[data-role="login-nickname"]');
  const loginPass = $('#loginForm [name="password"]') || $('#login-password') || $('[data-role="login-password"]');

  if (loginForm && loginNick && loginPass){
    loginForm.setAttribute('novalidate','');
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      e.stopPropagation();

      const nickname = (loginNick.value || '').trim();
      const password = loginPass.value || '';
      if (!nickname || !password) return;

      try{
        const data = await apiLogin(nickname, password);
        if (data?.token){
          setToken(data.token);
          show('menu');        // ← показываем меню/лобби
          if (typeof loadLobby === 'function') loadLobby();
        } else {
          alert(data?.error || 'Ошибка входа');
        }
      }catch{
        alert('Сеть недоступна или ошибка сервера');
      }
    }, { passive:false });
  } else {
    console.warn('login form not found');
  }

  // РЕГИСТРАЦИЯ (если есть)
  const signupForm = $('#signupForm') || $('#signup-form') || $('[data-form="signup"]');
  const signupNick = $('#signupForm [name="nickname"]') || $('#signup-nickname') || $('[data-role="signup-nickname"]');
  const signupPass = $('#signupForm [name="password"]') || $('#signup-password') || $('[data-role="signup-password"]');

  if (signupForm && signupNick && signupPass){
    signupForm.setAttribute('novalidate','');
    signupForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      e.stopPropagation();

      const nickname = (signupNick.value || '').trim();
      const password = signupPass.value || '';
      if (!nickname || !password) return;

      try{
        const data = await apiSignup(nickname, password);
        if (data?.ok || data?.success){
          const lg = await apiLogin(nickname, password);
          if (lg?.token){
            setToken(lg.token);
            show('menu');
            if (typeof loadLobby === 'function') loadLobby();
            return;
          }
        }
        alert(data?.error || 'Ошибка регистрации');
      }catch{
        alert('Сеть недоступна или ошибка сервера');
      }
    }, { passive:false });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  wireAuthForms();
  // Навешанные делегированные клики работают всегда, ничего больше не нужно
});

document.addEventListener('DOMContentLoaded', () => {
  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!isHome) return;

  const code = new URLSearchParams(location.search).get('code');
  if (code) {
    // показываем финальную страницу события ТОЛЬКО при наличии code
    if (typeof showEventSummary === 'function') showEventSummary(code);
  } else {
    if (typeof renderMainMenu === 'function') renderMainMenu(); // страница "Создать / Присоединиться"
  }
});

if (!document.body.dataset.screen) show('menu');
