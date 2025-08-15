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

function renderVisitors(list){
  const order = { yes:0, maybe:1, no:2 };
  list.sort((a,b)=> (order[a.status]??3) - (order[b.status]??3));
  visitorsList.innerHTML = list.map(v => `
    <li class="ea-item" role="listitem">
      <img class="ea-avatar" src="${v.avatar||'assets/stump.png'}" alt="Аватар ${v.nickname}">
      <div class="ea-name">${v.nickname}</div>
      <div class="ea-status">${statusText(v.status)}</div>
    </li>`).join('');
}

function renderWishlist(items){
  wishlistList.innerHTML = items.map(i => {
    let claimed = '🟢 свободно';
    if(i.claimedBy){
      claimed = `<span class="claimed"><img class="wl-ava" src="${i.claimedBy.avatar}" alt="Аватар ${i.claimedBy.nickname}"><span>${i.claimedBy.nickname}</span></span>`;
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
      credentials: 'include'
    });
    if(!res.ok) throw new Error('Ошибка загрузки');
    const data = await res.json();
    const evt = data.event||{};
    titleEl.textContent = evt.title || 'Событие';
    dateEl.textContent = evt.date || '—';
    timeEl.textContent = evt.time || '—';
    addrEl.textContent = evt.address || '—';
    renderVisitors(data.visitors||[]);
    renderWishlist(data.wishlist||[]);
  }catch(err){
    errorEl.textContent = err.message;
  }
}

load();
