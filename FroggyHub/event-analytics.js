const backBtn = document.getElementById('backBtn');
const editBtn = document.getElementById('editEventBtn');
const titleEl = document.getElementById('eventTitle');
const dateEl = document.getElementById('eventDate');
const timeEl = document.getElementById('eventTime');
const addrEl = document.getElementById('eventAddr');
const visitorsList = document.getElementById('visitorsList');
const wishlistList = document.getElementById('wishlistList');
const errorEl = document.getElementById('error');
const rsvpYesCountEl = document.getElementById('rsvpYesCount');
const rsvpMaybeCountEl = document.getElementById('rsvpMaybeCount');
const rsvpNoCountEl = document.getElementById('rsvpNoCount');
const rsvpYesBar = document.getElementById('rsvpYesBar');
const rsvpMaybeBar = document.getElementById('rsvpMaybeBar');
const rsvpNoBar = document.getElementById('rsvpNoBar');
const giftFreeCountEl = document.getElementById('giftFreeCount');
const giftTakenCountEl = document.getElementById('giftTakenCount');
const giftFreeBar = document.getElementById('giftFreeBar');
const giftTakenBar = document.getElementById('giftTakenBar');
const toastEl = document.getElementById('toast');

const params = new URLSearchParams(location.search);
const eventId = params.get('id');

// state collections keyed by primary keys
const visitors = new Map();       // key: user_id
const visitorEls = new Map();
const wishlist = new Map();       // key: item id
const wishlistEls = new Map();
const wishlistPending = new Map();

let currentUserId = null;
let currentUserProfile = null;

if(window.supabase){
  const { data:{ user } } = await window.supabase.auth.getUser();
  currentUserId = user?.id || null;
  if(currentUserId){
    const { data } = await window.supabase.from('profiles').select('nickname, avatar_url').eq('id', currentUserId).single();
    currentUserProfile = { nickname:data?.nickname||'', avatar_url:data?.avatar_url||'' };
  }
}

function toast(msg){
  if(!toastEl){ alert(msg); return; }
  toastEl.textContent = msg;
  toastEl.hidden = false;
  setTimeout(()=>{ toastEl.hidden = true; }, 4000);
}

let rtChannel = null;
let retryDelay = 1000; // start with 1s

async function authHeader(){
  if(window.supabase){
    const { data } = await window.supabase.auth.getSession();
    const t = data?.session?.access_token;
    return t ? { Authorization: 'Bearer '+t } : {};
  }
  return {};
}

backBtn?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

editBtn?.addEventListener('click', () => {
  if (eventId) window.location.href = `event-edit.html?id=${eventId}`;
});

function statusText(s){
  switch(s){
    case 'yes': return 'Иду';
    case 'maybe': return 'Возможно';
    case 'no':
    default: return 'Не иду';
  }
}

function statusIcon(s){
  switch(s){
    case 'yes': return '🟢';
    case 'maybe': return '🟡';
    case 'no':
    default: return '🔴';
  }
}

function visitorHtml(v){
  return `
    <img class="ea-avatar" src="${v.avatar_url || 'assets/stump.png'}" alt="" title="${v.nickname}">
    <div class="ea-name">${v.nickname}</div>
    <div class="ea-status ${'rsvp-' + v.rsvp}" role="status" aria-label="${statusText(v.rsvp)}">${statusIcon(v.rsvp)} ${statusText(v.rsvp)}</div>`;
}

function insertVisitor(v){
  const li = document.createElement('li');
  li.className = 'ea-item';
  li.dataset.id = v.id;
  li.dataset.rsvp = v.rsvp;
  li.innerHTML = visitorHtml(v);
  const order = { yes:0, maybe:1, no:2 };
  let placed = false;
  for (const el of visitorsList.children) {
    if (order[v.rsvp] < order[el.dataset.rsvp]) { visitorsList.insertBefore(li, el); placed = true; break; }
  }
  if (!placed) visitorsList.appendChild(li);
  visitorEls.set(v.id, li);
}

function updateVisitor(v){
  const li = visitorEls.get(v.id);
  if (!li) { insertVisitor(v); return; }
  li.dataset.rsvp = v.rsvp;
  li.innerHTML = visitorHtml(v);
  const order = { yes:0, maybe:1, no:2 };
  let next = null;
  for (const el of visitorsList.children) {
    if (el === li) continue;
    if (order[v.rsvp] < order[el.dataset.rsvp]) { next = el; break; }
  }
  if (next) visitorsList.insertBefore(li, next); else visitorsList.appendChild(li);
}

function removeVisitor(id){
  const li = visitorEls.get(id);
  if (li) { li.remove(); visitorEls.delete(id); }
}

function setVisitors(list){
  visitors.clear(); visitorEls.clear();
  visitorsList.innerHTML = '';
  list.forEach(v => { visitors.set(v.id, v); insertVisitor(v); });
  updateRsvpStats();
}

function wishlistHtml(i){
  let claimed = `<span class="wl-free" role="status" aria-label="Свободно">🟢 свободно</span>`;
  if (i.taken_by) {
    claimed = `<span class="wl-taken" role="status" aria-label="Занято ${i.taken_by.nickname}">🔒 <img class="wl-ava" src="${i.taken_by.avatar_url}" alt="" title="${i.taken_by.nickname}"><span class="nick">${i.taken_by.nickname}</span></span>`;
  }
  return `<div class="wl-title">${i.title}</div><div class="wl-claimed">${claimed}</div>`;
}

function insertWishlist(i){
  const li = document.createElement('li');
  li.className = 'wl-item';
  li.dataset.id = i.id;
  li.innerHTML = wishlistHtml(i);
  li.onclick = () => toggleWishlist(i.id);
  let placed = false;
  for (const el of wishlistList.children) {
    if (i.id < el.dataset.id) { wishlistList.insertBefore(li, el); placed = true; break; }
  }
  if (!placed) wishlistList.appendChild(li);
  wishlistEls.set(i.id, li);
}

function updateWishlist(i){
  const li = wishlistEls.get(i.id);
  if (!li) { insertWishlist(i); return; }
  li.innerHTML = wishlistHtml(i);
  li.onclick = () => toggleWishlist(i.id);
}

function removeWishlist(id){
  const li = wishlistEls.get(id);
  if (li) { li.remove(); wishlistEls.delete(id); }
}

function setWishlist(items){
  wishlist.clear(); wishlistEls.clear();
  wishlistList.innerHTML = '';
  items.forEach(i => { wishlist.set(i.id, i); insertWishlist(i); });
  updateGiftStats();
}

function updateRsvpStats(){
  let yes = 0, maybe = 0, no = 0;
  visitors.forEach(v => {
    if(v.rsvp === 'yes') yes++;
    else if(v.rsvp === 'maybe') maybe++;
    else no++;
  });
  rsvpYesCountEl.textContent = yes;
  rsvpMaybeCountEl.textContent = maybe;
  rsvpNoCountEl.textContent = no;
  const total = yes + maybe + no || 1;
  rsvpYesBar.style.width = (yes/total*100) + '%';
  rsvpMaybeBar.style.width = (maybe/total*100) + '%';
  rsvpNoBar.style.width = (no/total*100) + '%';
}

function updateGiftStats(){
  let free = 0, taken = 0;
  wishlist.forEach(i => { if(i.taken_by) taken++; else free++; });
  giftFreeCountEl.textContent = free;
  giftTakenCountEl.textContent = taken;
  const total = free + taken || 1;
  giftFreeBar.style.width = (free/total*100) + '%';
  giftTakenBar.style.width = (taken/total*100) + '%';
}

async function toggleWishlist(id){
  const item = wishlist.get(id);
  if(!item || !currentUserId) return;
  const prev = { ...item };
  const ts = Date.now();
  wishlistPending.set(id,{ prev, ts });
  item.taken_by = item.taken_by ? null : { ...currentUserProfile };
  updateWishlist(item);
  updateGiftStats();
  const { error } = await window.supabase
    .from('wishlist_items')
    .update({ taken_by: item.taken_by ? currentUserId : null })
    .eq('id', id);
  if(error){
    const pend = wishlistPending.get(id);
    if(pend){
      wishlist.set(id, pend.prev);
      updateWishlist(pend.prev);
      updateGiftStats();
      wishlistPending.delete(id);
    }
    toast(error.message || 'Ошибка обновления');
  }
}

async function load(){
  if(!eventId){ errorEl.textContent = 'Не указан id события'; return; }
  try{
    const res = await fetch(`/.netlify/functions/get-event-analytics?id=${encodeURIComponent(eventId)}`, {
      headers: await authHeader()
    });
    if(!res.ok) throw new Error('Ошибка загрузки');
    const data = await res.json();
    const evt = data.event||{};
    titleEl.textContent = evt.title || 'Событие';
    dateEl.textContent = evt.date || '—';
    timeEl.textContent = evt.time || '—';
    addrEl.textContent = evt.address || '—';

    // load participants with ids
    const { data: parts } = await window.supabase
      .from('participants')
      .select('user_id, rsvp, profiles(nickname, avatar_url)')
      .eq('event_id', eventId);
    const visitorsInit = (parts||[]).map(p=>({
      id: p.user_id,
      nickname: p.profiles?.nickname || '',
      avatar_url: p.profiles?.avatar_url || '',
      rsvp: p.rsvp
    }));
    setVisitors(visitorsInit);

    // load wishlist items with ids
    const { data: wlItems } = await window.supabase
      .from('wishlist_items')
      .select('id, title, url, taken_by, profiles:profiles!wishlist_items_taken_by_fkey(nickname, avatar_url)')
      .eq('event_id', eventId);
    const wlInit = (wlItems||[]).map(w=>({
      id: w.id,
      title: w.title,
      url: w.url,
      taken_by: w.taken_by ? { nickname: w.profiles?.nickname || '', avatar_url: w.profiles?.avatar_url || '' } : null
    }));
    setWishlist(wlInit);

    subscribeRealtime();
  }catch(err){
    errorEl.textContent = err.message;
  }
}

load();

async function handleParticipantChange(payload){
  const ev = payload.eventType;
  if(ev === 'DELETE'){
    const id = payload.old?.user_id;
    visitors.delete(id);
    removeVisitor(id);
    updateRsvpStats();
    return;
  }
  const p = payload.new;
  let prof = null;
  if(!visitors.has(p.user_id)){
    const { data } = await window.supabase.from('profiles').select('nickname, avatar_url').eq('id', p.user_id).single();
    prof = data;
  } else {
    prof = visitors.get(p.user_id);
  }
  const v = {
    id: p.user_id,
    nickname: prof?.nickname || '',
    avatar_url: prof?.avatar_url || '',
    rsvp: p.rsvp
  };
  visitors.set(v.id, v);
  updateVisitor(v);
  updateRsvpStats();
}

async function handleWishlistChange(payload){
  const ev = payload.eventType;
  const id = payload.new?.id || payload.old?.id;
  const commitTs = Date.parse(payload.commit_timestamp || '');
  const pend = wishlistPending.get(id);
  if(pend){
    if(commitTs && commitTs <= pend.ts) return;
    wishlistPending.delete(id);
  }
  if(ev === 'DELETE'){
    wishlist.delete(id);
    removeWishlist(id);
    updateGiftStats();
    return;
  }
  const w = payload.new;
  let taken = null;
  if(w.taken_by){
    const { data } = await window.supabase.from('profiles').select('nickname, avatar_url').eq('id', w.taken_by).single();
    taken = { nickname: data?.nickname || '', avatar_url: data?.avatar_url || '' };
  }
  const item = { id:w.id, title:w.title, url:w.url, taken_by:taken };
  wishlist.set(item.id, item);
  updateWishlist(item);
  updateGiftStats();
}

function subscribeRealtime(){
  if(!window.supabase || !eventId) return;
  if(rtChannel) window.supabase.removeChannel(rtChannel);
  rtChannel = window.supabase
    .channel('analytics-' + eventId)
    .on('postgres_changes',{ event:'*', schema:'public', table:'participants', filter:'event_id=eq.'+eventId }, handleParticipantChange)
    .on('postgres_changes',{ event:'*', schema:'public', table:'wishlist_items', filter:'event_id=eq.'+eventId }, handleWishlistChange)
    .subscribe(status => {
      if(status === 'SUBSCRIBED') { retryDelay = 1000; }
      else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)) {
        const delay = Math.min(retryDelay, 30000);
        retryDelay = Math.min(retryDelay*2, 30000);
        setTimeout(subscribeRealtime, delay);
      }
    });
}

window.addEventListener('beforeunload', () => {
  if(rtChannel){ window.supabase.removeChannel(rtChannel); rtChannel=null; }
});
