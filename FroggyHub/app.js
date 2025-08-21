(function () { if (window.__FROGGY_BOOTED__) return; window.__FROGGY_BOOTED__ = true;
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> [...r.querySelectorAll(s)];

  // token utils
  const TOK = 'FH_JWT';
  const getTok = () => localStorage.getItem(TOK);
  const setTok = (t) => localStorage.setItem(TOK, t);
  const clrTok = () => localStorage.removeItem(TOK);

  // fetch helpers
  const api = async (path, init={})=>{
    init.headers = Object.assign({'Content-Type':'application/json'}, init.headers||{});
    const t = getTok(); if (t) init.headers.Authorization = `Bearer ${t}`;
    const res = await fetch(`/.netlify/functions${path}`, init);
    const data = await res.json().catch(()=> ({}));
    if (!res.ok) throw Object.assign(new Error(data?.error||'Ошибка'), {status:res.status, data});
    return data;
  };

  // NAV
  const screens = ['menu','app','final','profile'];
  function showScreen(id){
    if (!screens.includes(id)) return;
    document.body.dataset.screen = id;
    screens.forEach(k => { const el = $(`#screen-${k}`); if (el) el.hidden = (k!==id); });
    if (id === 'profile') refreshProfile().catch(()=>{});
  }

  // delegated clicks
  document.addEventListener('click',(e)=>{
    const go = e.target.closest('[data-go]');
    if (go){ e.preventDefault(); showScreen(go.dataset.go); return; }
    const del = e.target.closest('[data-del]');
    if (del){ e.preventDefault(); onDeleteEvent(del.dataset.del); }
    const open = e.target.closest('[data-open]');
    if (open){ e.preventDefault(); openEvent(open.dataset.open); }
  });

  // prevent join form reload
  $('#join-form')?.addEventListener('submit', (e)=>{ e.preventDefault(); });

  // AUTH (существующие login/signup вызывали setTok; оставляем)
  async function doLogin(nick, pass){
    const res = await fetch('/.netlify/functions/local-login',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({nickname:nick, password:pass})
    });
    const data = await res.json();
    if (data?.token) setTok(data.token); else throw new Error(data?.error||'Ошибка входа');
  }

  // HEADER
  $('#btn-logout')?.addEventListener('click', ()=>{
    clrTok();
    showScreen('menu');
  });

  // ---------- PROFILE ----------
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

  async function refreshProfile(){
    const data = await api('/events-mine');
    const {upcoming, past} = byDate(data?.events||[]);
    renderList(upcoming, $('#profile-upcoming'));
    renderList(past, $('#profile-past'));
  }

  async function onDeleteEvent(id){
    await api(`/event-delete?id=${encodeURIComponent(id)}`, {method:'DELETE'});
    await refreshProfile();
  }

  function openEvent(id){
    // пока просто переключим на финальный экран; реальные данные подгружаются твоей логикой
    showScreen('final');
  }

  // BOOT
  showScreen(getTok() ? 'menu' : 'menu');
})();
