import { supa, getSession, signIn, signUpWithNickname, signOut } from './api.js';

const LINKS = {
  home: '/index.html',
  menu: '/lobby.html',
  profile: '/profile.html',
  settings: '/lobby.html',
  'event-edit': '/event-edit.html'
};
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const path=()=>location.pathname.replace(/\/+$,'/');
const isPage=(name)=>path().endsWith(`/${name}`);
function goto(h){ location.href=h; }
function copy(t){ try{ navigator.clipboard?.writeText(t);}catch{} }

/* ------------------ Cloud messages ------------------ */
const FH_MESSAGES=[
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
let fhRoot=null,chips=[],rafId=0,vw=0,vh=0;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const rnd=(a,b)=>Math.random()*(b-a)+a;
function ensureFH(){
  if(!fhRoot){
    fhRoot=document.getElementById('fh-message-clouds')||(()=>{const d=document.createElement('div');d.id='fh-message-clouds';d.setAttribute('aria-hidden','true');d.style.pointerEvents='none';document.body.prepend(d);return d;})();
  }
  return fhRoot;
}
function spawnChips(count=null){
  const root=ensureFH(); if(!root) return; root.innerHTML=''; chips=[];
  vw=innerWidth; vh=innerHeight;
  const n=count??Math.min(FH_MESSAGES.length,vw<420?10:vw<768?16:24);
  const arr=[...FH_MESSAGES].sort(()=>Math.random()-0.5).slice(0,n);
  arr.forEach(t=>{const el=document.createElement('div');el.className='fh-chip';el.textContent=t;const x=rnd(20,vw-160),y=rnd(20,vh-60);el.style.left=`${x}px`;el.style.top=`${y}px`;el.style.transform='translate3d(0,0,0)';root.appendChild(el);const r=el.getBoundingClientRect();const c={el,w:r.width||140,h:r.height||40,x,y,vx:rnd(-.08,.08),vy:rnd(-.08,.08)};chips.push(c);});
}
function updateChips(){
  const m=20;
  for(const c of chips){
    c.x+=c.vx; c.y+=c.vy;
    if(c.x<=m||c.x+c.w>=vw-m){c.vx*=-1;c.x=Math.max(m,Math.min(c.x,vw-c.w-m));}
    if(c.y<=m||c.y+c.h>=vh-m){c.vy*=-1;c.y=Math.max(m,Math.min(c.y,vh-c.h-m));}
    c.el.style.left=`${c.x}px`; c.el.style.top=`${c.y}px`;
  }
  for(let i=0;i<chips.length;i++) for(let j=i+1;j<chips.length;j++){const a=chips[i],b=chips[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y){[a.vx,b.vx]=[b.vx,a.vx];[a.vy,b.vy]=[b.vy,a.vy];}}
}
function tick(){updateChips();rafId=requestAnimationFrame(tick);} 
function startFH(){cancelAnimationFrame(rafId);if(REDUCED_MOTION) return;spawnChips();rafId=requestAnimationFrame(tick);} 
addEventListener('resize',()=>{clearTimeout(startFH._t);startFH._t=setTimeout(()=>spawnChips(chips.length),250);});
document.addEventListener('visibilitychange',()=>document.hidden?cancelAnimationFrame(rafId):startFH());
setTimeout(startFH,100);

/* ------------------ Demo polyfills ------------------ */
function genCode(len=6){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<len;i++) s+=a[(Math.random()*a.length)|0];return s;}
function _db(){return JSON.parse(localStorage.getItem('fh_demo_db')||'{}');}
function _save(db){localStorage.setItem('fh_demo_db',JSON.stringify(db));}
if(typeof window.saveEvent!=='function'){
  window.saveEvent=async payload=>{const db=_db();const code=genCode();const sess=JSON.parse(localStorage.getItem('fh_demo_session')||'{}');db.events??={};db.events[code]={code,...payload,ownerId:sess.user?.login||sess.user?.nickname||sess.user?.email||'demo',createdAt:Date.now()};db.wl??={};db.wl[code]=[];_save(db);return code;};
}
function getEvent(code){return _db().events?.[code]||null;}
function addWishlistItem(code,item){const db=_db();db.wl??={};db.wl[code]??=[];db.wl[code].push({...item,id:crypto?.randomUUID?.()||genCode(8),status:'free'});_save(db);}
function getWishlist(code){return _db().wl?.[code]||[];}
function claimItem(code,id,name){const db=_db();const list=db.wl?.[code]||[];const it=list.find(x=>x.id===id&&x.status==='free');if(it){it.status='taken';it.by=name;_save(db);return true;}return false;}
function saveRsvp(code,name,attend){const db=_db();db.rsvp??={};db.rsvp[code]??=[];db.rsvp[code].push({name,attend});_save(db);}
function listMyEvents(user){const db=_db();return Object.values(db.events||{}).filter(e=>e.ownerId===user);} 
function listGuestEvents(user){const db=_db();const codes=Object.entries(db.rsvp||{}).filter(([c,l])=>l.some(r=>r.name===user&&r.attend==='yes')).map(([c])=>c);return codes.map(c=>db.events?.[c]).filter(Boolean);}

/* ------------------ Boot ------------------ */
async function boot(){
  const session=await getSession();
  const authed=!!session||JSON.parse(localStorage.getItem('fh_demo_session')||'false');
  const AUTH_AVAILABLE=!!supa;
  const p=path(); const isLogin=p.endsWith('/login.html');
  if(AUTH_AVAILABLE){
    if(authed&&isLogin){goto('/lobby.html');return;}
    if(!authed&&!isLogin){goto('/login.html');return;}
  }
  if(isPage('login.html')) initAuth();
  if(isPage('lobby.html')) initLobby();
  if(isPage('event-edit.html')) initEventEdit();
  if(isPage('wishlist-setup.html')) initWishlistSetup();
  if(isPage('event-summary.html')) initEventSummary();
  if(isPage('rsvp.html')) initRsvp();
  if(isPage('gift-claim.html')) initGiftClaim();
  if(isPage('guest-summary.html')) initGuestSummary();
  if(isPage('profile.html')) initProfile();
}
document.addEventListener('DOMContentLoaded',()=>{boot().catch(console.error);});

/* ------------------ Global navigation ------------------ */
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-link]');
  if(link){e.preventDefault();const key=link.getAttribute('data-link');const href=LINKS[key];if(href) goto(href);return;}
  if(e.target.dataset.action==='logout'){localStorage.removeItem('fh_demo_session');try{signOut?.();}catch{}goto('/login.html');}
});

/* ------------------ Auth ------------------ */
function initAuth(){
  qs('#form-login')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const login=qs('#loginId')?.value.trim();
    const password=qs('#loginPassword')?.value;
    if(!login||!password){alert('Заполните поля');return;}
    try{
      if(supa){await signIn({login,password});}
      else{localStorage.setItem('fh_demo_session',JSON.stringify({user:{login}}));}
      goto('/lobby.html');
    }catch(err){alert(err.message||'Ошибка входа');}
  });
  qs('#form-signup')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const nickname=qs('#signupNickname')?.value.trim();
    const email=qs('#signupEmail')?.value.trim();
    const password=qs('#signupPassword')?.value;
    if(!nickname||!email||!password){alert('Заполните поля');return;}
    try{
      if(supa){await signUpWithNickname({nickname,email,password});}
      localStorage.setItem('fh_demo_session',JSON.stringify({user:{login:nickname,email}}));
      goto('/lobby.html');
    }catch(err){alert(err.message||'Ошибка регистрации');}
  });
}

/* ------------------ Lobby ------------------ */
function initLobby(){
  qs('#btnJoin')?.addEventListener('click',()=>{
    const code=qs('#joinCode')?.value.trim();
    if(code&&code.length>=6) goto(`/rsvp.html?code=${encodeURIComponent(code)}`);
  });
}

/* ------------------ Event Edit ------------------ */
function initEventEdit(){
  const form=qs('#editForm');
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const payload={
      title:qs('#eventTitle')?.value?.trim(),
      date:qs('#eventDate')?.value,
      time:qs('#eventTime')?.value,
      place:qs('#eventPlace')?.value?.trim(),
      dress:qs('#eventDress')?.value?.trim(),
      desc:qs('#eventDesc')?.value?.trim(),
    };
    if(!payload.title||!payload.date||!payload.time){alert('Введите название, дату и время');return;}
    const code=await saveEvent(payload);
    goto(`/wishlist-setup.html?code=${encodeURIComponent(code)}`);
  });
}

/* ------------------ Wishlist Setup ------------------ */
function initWishlistSetup(){
  const code=new URLSearchParams(location.search).get('code');
  const grid=qs('#wlGrid');
  const render=()=>{grid.innerHTML='';getWishlist(code).forEach(it=>{grid.insertAdjacentHTML('beforeend',`<div class="wl-item ${it.status}"><div class="wl-name">${it.name}</div>${it.url?`<a class="wl-link" href="${it.url}" target="_blank" rel="noopener">ссылка</a>`:''}</div>`);});};
  render();
  qs('#giftAdd')?.addEventListener('click',()=>qs('#giftModal').removeAttribute('hidden'));
  qs('#giftSave')?.addEventListener('click',()=>{
    const name=qs('#giftName').value.trim();
    const url=qs('#giftUrl').value.trim();
    if(!name) return;
    addWishlistItem(code,{name,url:url||null});
    qs('#giftName').value='';qs('#giftUrl').value='';qs('#giftModal').setAttribute('hidden','');
    render();
  });
  qs('#giftNext')?.addEventListener('click',()=>goto(`/event-summary.html?code=${encodeURIComponent(code)}`));
  qs('#giftSkip')?.addEventListener('click',()=>goto(`/event-summary.html?code=${encodeURIComponent(code)}`));
}

/* ------------------ Event Summary ------------------ */
function initEventSummary(){
  const code=new URLSearchParams(location.search).get('code');
  const ev=getEvent(code); if(!ev) return;
  qs('#sumTitle').textContent=ev.title||'Событие';
  qs('#sumDate').textContent=ev.date||'—';
  qs('#sumTime').textContent=ev.time||'—';
  qs('#sumPlace').textContent=ev.place||'—';
  qs('#sumDress').textContent=ev.dress||'—';
  qs('#sumDesc').textContent=ev.desc||'—';
  qs('#eventCode').textContent=code;
  qs('#copyCode')?.addEventListener('click',()=>copy(code));
  const grid=qs('#wlGrid');
  getWishlist(code).forEach(it=>{grid.insertAdjacentHTML('beforeend',`<div class="wl-item ${it.status}"><div class="wl-name">${it.name}</div>${it.url?`<a class="wl-link" href="${it.url}" target="_blank" rel="noopener">ссылка</a>`:''}${it.status==='taken'?`<div class="tag">Занято — ${it.by||''}</div>`:''}</div>`);});
}

/* ------------------ RSVP ------------------ */
function initRsvp(){
  const code=new URLSearchParams(location.search).get('code');
  qs('#formRsvp')?.addEventListener('submit',e=>{
    e.preventDefault();
    const name=qs('#guestName').value.trim();
    const attend=qs('input[name="attend"]:checked')?.value;
    if(!name||!attend){alert('Заполните имя и выбор');return;}
    saveRsvp(code,name,attend);
    const next=attend==='yes'?`/gift-claim.html?code=${code}&name=${encodeURIComponent(name)}`:`/guest-summary.html?code=${code}&name=${encodeURIComponent(name)}&attend=no`;
    goto(next);
  });
}

/* ------------------ Gift Claim ------------------ */
function initGiftClaim(){
  const url=new URLSearchParams(location.search); const code=url.get('code'); const name=url.get('name');
  const grid=qs('#wlGrid');
  const render=()=>{grid.innerHTML='';getWishlist(code).forEach(it=>{grid.insertAdjacentHTML('beforeend',`<div class="wl-item ${it.status}"><div class="wl-name">${it.name}</div>${it.url?`<a class="wl-link" href="${it.url}" target="_blank">ссылка</a>`:''}${it.status==='free'?`<button class="btn claim" data-id="${it.id}">Забрать!</button>`:`<div class="tag">Занято — ${it.by||''}</div>`}</div>`);});};
  grid?.addEventListener('click',e=>{const id=e.target.closest('.claim')?.dataset.id;if(!id)return;if(claimItem(code,id,name)) render();});
  render();
  qs('#giftNext')?.addEventListener('click',()=>goto(`/guest-summary.html?code=${code}&name=${encodeURIComponent(name)}`));
}

/* ------------------ Guest Summary ------------------ */
function initGuestSummary(){
  const url=new URLSearchParams(location.search); const code=url.get('code'); const name=url.get('name'); const attend=url.get('attend')!=='no';
  qs('#gsName').textContent=name||''; qs('#gsAttend').textContent=attend?'Иду':'Не иду';
  const wl=getWishlist(code); const it=wl.find(i=>i.by===name);
  if(it){qs('#gsGift').textContent=it.name;} else {qs('#gsGiftWrap').hidden=true;}
}

/* ------------------ Profile ------------------ */
function initProfile(){
  const input=qs('#avatarInput'); const prev=qs('#avatarPreview');
  const stored=localStorage.getItem('fh_demo_avatar'); if(stored) prev.src=stored;
  input?.addEventListener('change',e=>{const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{prev.src=reader.result; localStorage.setItem('fh_demo_avatar',reader.result);}; reader.readAsDataURL(file);});
  const sess=JSON.parse(localStorage.getItem('fh_demo_session')||'{}'); const user=sess.user?.login||sess.user?.nickname||sess.user?.email||'demo';
  const mine=listMyEvents(user); const guest=listGuestEvents(user);
  const mt=qs('#myEvents'); mine.forEach(ev=>{mt.insertAdjacentHTML('beforeend',`<tr data-code="${ev.code}"><td>${ev.code}</td><td>${ev.title}</td><td>${ev.date||''}</td></tr>`);});
  const gt=qs('#guestEvents'); guest.forEach(ev=>{gt.insertAdjacentHTML('beforeend',`<tr data-code="${ev.code}"><td>${ev.code}</td><td>${ev.title}</td><td>${ev.date||''}</td></tr>`);});
  document.addEventListener('click',e=>{const tr=e.target.closest('#myEvents tr');if(tr) goto(`/event-summary.html?code=${tr.dataset.code}`);});
}

export {}
