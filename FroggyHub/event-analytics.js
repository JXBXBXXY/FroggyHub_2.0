const backBtn = document.getElementById('backBtn');
const editBtn = document.getElementById('editEventBtn');
const titleEl = document.getElementById('eventTitle');
const dateEl = document.getElementById('eventDate');
const timeEl = document.getElementById('eventTime');
const addrEl = document.getElementById('eventAddr');
const visitorsList = document.getElementById('visitorsList');
const wishlistList = document.getElementById('wishlistList');
const errorEl = document.getElementById('error');

const params = new URLSearchParams(location.search);
const eventId = params.get('id');

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

function renderVisitors(list){
  const order = { yes:0, maybe:1, no:2 };
  list.sort((a,b)=> (order[a.rsvp]??3) - (order[b.rsvp]??3));
  visitorsList.innerHTML = list.map(v => `
    <li class="ea-item" role="listitem">
      <img class="ea-avatar" src="${v.avatar_url||'assets/stump.png'}" alt="" title="${v.nickname}">
      <div class="ea-name">${v.nickname}</div>
      <div class="ea-status ${'rsvp-'+v.rsvp}" role="status" aria-label="${statusText(v.rsvp)}">${statusIcon(v.rsvp)} ${statusText(v.rsvp)}</div>
    </li>`).join('');
}

function renderWishlist(items){
  wishlistList.innerHTML = items.map(i => {
    let claimed = `<span class="wl-free" role="status" aria-label="Свободно">🟢 свободно</span>`;
    if(i.taken_by){
      claimed = `<span class="wl-taken" role="status" aria-label="Занято ${i.taken_by.nickname}">🔒 <img class="wl-ava" src="${i.taken_by.avatar_url}" alt="" title="${i.taken_by.nickname}"><span class="nick">${i.taken_by.nickname}</span></span>`;
    }
    return `<li class="wl-item" role="listitem">
      <div class="wl-title">${i.title}</div>
      <div class="wl-claimed">${claimed}</div>
    </li>`;
  }).join('');
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
    renderVisitors(data.participants||[]);
    renderWishlist(data.wishlist||[]);
  }catch(err){
    errorEl.textContent = err.message;
  }
}

load();
