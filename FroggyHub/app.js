// ===== Вспомогалки =====
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

function showScreen(name){
  $$('section[id^="screen-"]').forEach(s=> s.hidden = s.id !== `screen-${name}`);
  document.body.dataset.screen = name;
  if (name === 'profile') loadMyEvents().catch(()=>{});
}

function authHeader(){
  const t = localStorage.getItem('FH_JWT');
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function api(path, init={}){
  init.headers = Object.assign({'Content-Type':'application/json'}, authHeader(), init.headers||{});
  const res = await fetch(`/.netlify/functions/${path}`, init);
  const data = await res.json().catch(()=>({}));
  if (!res.ok || data?.success===false) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ===== Состояние =====
const state = {
  flow: null,           // 'create' | 'join'
  code: null,
  event: null,
  draft: {},
  guest: { nickname: null }
};

// ===== Меню: старт потоков =====
$('#create-event')?.addEventListener('click', ()=>{
  state.flow='create'; state.code=null; state.event=null; state.draft={};
  showScreen('create-conditions');
});
$('#join-btn')?.addEventListener('click', async ()=>{
  const code = ($('#join-code')?.value||'').trim();
  if (code.length!==6) return alert('Введите 6-значный код');
  try{
    const {event} = await api('event-one?code='+encodeURIComponent(code));
    state.flow='join'; state.code=code; state.event=event;
    showScreen('join-name');
  }catch(e){ alert(e.message||'Код не найден'); }
});
$('#join-form')?.addEventListener('submit', e=>e.preventDefault());

// ===== Создание: условия → wishlist =====
$('#form-create')?.addEventListener('submit', e=>{
  e.preventDefault();
  state.draft = {
    title:   $('#f-title').value.trim(),
    date:    $('#f-date').value,
    time:    $('#f-time').value,
    address: $('#f-address').value.trim(),
    dress:   $('#f-dress').value.trim(),
    bring:   $('#f-bring').value.trim(),
    comment: $('#f-comment').value.trim(),
  };
  showScreen('wishlist');
});

// ===== Join: имя → wishlist =====
$('#form-join-name')?.addEventListener('submit', e=>{
  e.preventDefault();
  state.guest.nickname = $('#join-name').value.trim();
  if (!state.guest.nickname) return;
  showScreen('wishlist');
});

// ===== Wishlist =====
async function renderWishlist(){
  const box = $('#wish-list'); if (!box) return;
  const code = state.event?.code || state.code;
  if (!code) { box.innerHTML=''; return; }
  const { event } = await api('event-one?code='+encodeURIComponent(code));
  state.event = event;
  box.innerHTML = (event.wishlist||[]).map(it=>`
    <div class="wish-item">
      <div>${it.title || '—'} ${it.url ? ` · <a href="${it.url}" target="_blank" rel="noopener">ссылка</a>` : ''}</div>
      <div>
        ${it.claimed_by ? `<span style="opacity:.6">занято ${it.claimed_by}</span>`
                        : `<button class="btn btn-small" data-claim="${it.id}">Заберу</button>`}
      </div>
    </div>
  `).join('') || 'Пока пусто';
}

$('#form-add-wish')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if (state.flow!=='create') return; // добавляет только хост на шаге создания
  const title = $('#wish-title').value.trim();
  const url   = $('#wish-url').value.trim();
  if (!title) return;
  await api('wishlist-add', {
    method:'POST',
    body: JSON.stringify({ code: state.code || state.event?.code, title, url })
  });
  $('#wish-title').value=''; $('#wish-url').value='';
  await renderWishlist();
});

document.addEventListener('click', async (e)=>{
  const claim = e.target.closest('[data-claim]');
  if (claim){
    await api('wishlist-claim', {
      method:'POST',
      body: JSON.stringify({ id: claim.getAttribute('data-claim'), nickname: state.guest.nickname || 'гость' })
    });
    await renderWishlist();
  }
});

// ===== Переход на финал =====
$('#btn-to-final')?.addEventListener('click', async ()=>{
  try{
    if (state.flow==='create'){
      const { event } = await api('event-create', { method:'POST', body: JSON.stringify(state.draft) });
      state.event = event; state.code = event.code;
    } else if (state.flow==='join'){
      await api('event-join', { method:'POST', body: JSON.stringify({ code: state.code, nickname: state.guest.nickname }) });
    }
    await openFinal(state.event?.code || state.code);
  }catch(err){ alert(err.message); }
});

async function openFinal(code){
  const { event } = await api('event-one?code='+encodeURIComponent(code));
  state.event = event; state.code = event.code;
  // подставь свои реальные элементы финальной карточки:
  $('#final-code')?.replaceChildren(document.createTextNode(event.code));
  $('#final-title')?.replaceChildren(document.createTextNode(event.title||'—'));
  $('#final-when')?.replaceChildren(document.createTextNode(`${event.date} ${event.time||''}`.trim()));
  $('#final-address')?.replaceChildren(document.createTextNode(event.address||'—'));
  $('#final-dress')?.replaceChildren(document.createTextNode(event.dress||'—'));
  $('#final-bring')?.replaceChildren(document.createTextNode(event.bring||'—'));
  $('#final-comment')?.replaceChildren(document.createTextNode(event.comment||'—'));
  showScreen('final');
  renderWishlist();
}

// Верхняя навигация (универсально)
document.addEventListener('click', (e)=>{
  const go = e.target.closest('[data-go]'); if (go){ e.preventDefault(); showScreen(go.getAttribute('data-go')); return; }
  const del = e.target.closest('[data-del]'); if (del){ e.preventDefault(); onDeleteEvent(del.getAttribute('data-del')); return; }
  const open = e.target.closest('[data-open]'); if (open){ e.preventDefault(); openEvent(open.getAttribute('data-open')); return; }
});

// ===== PROFILE =====
const byDate = (evs)=>{
  const now = new Date();
  const toDate = (e)=> new Date(`${e.date}T${(e.time||'00:00')}:00`);
  const upcoming=[], past=[];
  evs.forEach(e=> (toDate(e) >= now ? upcoming : past).push(e));
  upcoming.sort((a,b)=> (a.date+b.time).localeCompare(b.date+a.time));
  past.sort((a,b)=> (b.date+a.time).localeCompare(a.date+b.time));
  return {upcoming, past};
};

const renderList = (arr, mount)=>{
  mount.innerHTML = '';
  if (!arr.length){ mount.innerHTML = '<div class="muted">Пока пусто</div>'; return; }
  arr.forEach(e=>{
    const card = document.createElement('article');
    card.className = 'event-card';
    card.innerHTML = `
      <h4>${e.title||'Без названия'}</h4>
      <div class="muted">${e.date} ${e.time||''}</div>
      <div class="muted">Код: ${e.code||'—'}</div>
      <div class="row" style="margin-top:8px">
        <button class="btn btn-sm" data-open="${e.id}">Открыть</button>
        <button class="btn btn-sm" data-del="${e.id}">Удалить</button>
      </div>`;
    mount.appendChild(card);
  });
};

async function loadMyEvents(){
  const data = await api('events-mine');
  const {upcoming, past} = byDate(data?.events||[]);
  renderList(upcoming, $('#profile-upcoming'));
  renderList(past, $('#profile-past'));
}

async function onDeleteEvent(id){
  await api(`event-delete?id=${encodeURIComponent(id)}`, {method:'DELETE'});
  await loadMyEvents();
}

async function openEvent(id){
  const { event } = await api(`event-one?id=${encodeURIComponent(id)}`);
  state.event = event; state.code = event.code;
  await openFinal(event.code);
}

// ===== HEADER =====
$('#btn-logout')?.addEventListener('click', ()=>{
  localStorage.removeItem('FH_JWT');
  showScreen('menu');
});

// ===== BOOT =====
showScreen('menu');
