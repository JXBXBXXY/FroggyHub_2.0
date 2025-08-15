/* ---------- ПОЛЬЗОВАТЕЛИ / СЕССИЯ ---------- */
const USERS_KEY = 'froggyhub_users_v1';
const SESSION_KEY = 'froggyhub_session_email';
const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
const saveUsers = () => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const setSession = (email) => localStorage.setItem(SESSION_KEY, email);
const getSession = () => localStorage.getItem(SESSION_KEY);
let currentUser = null;

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

async function signUp(name,email,password){
  if(window.supabase){
    const { data, error } = await window.supabase.auth.signUp({ email, password, options:{ data:{ name } } });
    if(error) throw error;
    const user=data.user;
    if(user){ await window.supabase.from('profiles').upsert({ id:user.id, name }); }
    return user;
  }
  if(users[email]) throw new Error('Такой пользователь уже существует.');
  const saltHex = toHex(randBytes(16));
  const iterations = 150_000;
  const passHash = await pbkdf2Hash(password, saltHex, iterations);
  users[email] = { name, passHash, salt: saltHex, iters: iterations };
  saveUsers();
  return { email };
}

async function signIn(email,password){
  if(window.supabase){
    const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data.user;
  }
  const u = users[email];
  if(!u) throw new Error('Пользователь не найден.');
  const calc = await pbkdf2Hash(password, u.salt, u.iters || 150_000);
  if(!timingSafeEqual(calc, u.passHash)) throw new Error('Неверный пароль.');
  return { email };
}

async function signOut(){
  if(window.supabase){
    await window.supabase.auth.signOut();
  }
  localStorage.removeItem(SESSION_KEY);
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
  alert('Ссылка скопирована: ' + link);
}

/* ---------- УТИЛИТЫ ---------- */
const $ = (s) => document.querySelector(s);
const toast = (msg) => alert(msg);
function trapFocus(node){
  const f=node.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
  if(!f.length) return;
  const first=f[0], last=f[f.length-1];
  node.addEventListener('keydown',e=>{
    if(e.key!=='Tab') return;
    if(e.shiftKey && document.activeElement===first){ last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement===last){ first.focus(); e.preventDefault(); }
  });
}
function show(idToShow){
  ['#screen-auth','#screen-lobby','#screen-app'].forEach(id=>{
    const el=$(id); if(!el) return; el.hidden = (id!==idToShow);
  });
}

/* ---------- ВКЛАДКИ ВХОД/РЕГ ---------- */
function switchAuth(mode){
  const loginForm=$('#authFormLogin');
  const regForm=$('#authFormRegister');
  const tabLogin=$('#tabLogin');
  const tabRegister=$('#tabRegister');
  const showLogin = mode==='login';
  if(loginForm&&regForm){
    loginForm.hidden=!showLogin;
    regForm.hidden=showLogin;
  }
  if(tabLogin&&tabRegister){
    tabLogin.classList.toggle('active',showLogin);
    tabRegister.classList.toggle('active',!showLogin);
    tabLogin.setAttribute('aria-selected',showLogin?'true':'false');
    tabRegister.setAttribute('aria-selected',showLogin?'false':'true');
  }
  const focusEl = showLogin ? loginForm?.querySelector('input') : regForm?.querySelector('input');
  focusEl?.focus();
}
$('#tabLogin')?.addEventListener('click',()=>switchAuth('login'));
$('#tabRegister')?.addEventListener('click',()=>switchAuth('register'));

/* ---------- ЛОГИН ---------- */
$('#authFormLogin')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const pass  = $('#loginPass').value;
  const err = $('#loginError');
  if(err) err.textContent='';
  try{
    const user = await signIn(email, pass);
    currentUser = user;
    setSession(email);
    $('#chipEmail').textContent = email;
    show('#screen-lobby');
  }catch(ex){
    if(err) err.textContent = ex.message || 'Ошибка входа';
  }
});

/* ---------- РЕГИСТРАЦИЯ ---------- */
$('#authFormRegister')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = $('#regName').value.trim();
  const email = $('#regEmail').value.trim().toLowerCase();
  const pass = $('#regPass').value;
  const pass2 = $('#regPass2').value;
  const err = $('#regError');
  if(err) err.textContent='';
  if(!name || !email || !pass || !pass2){ err.textContent='Заполните все поля.'; return; }
  if(pass !== pass2){ err.textContent='Пароли не совпадают.'; return; }
  try{
    await signUp(name,email,pass);
    const user = await signIn(email,pass);
    currentUser = user;
    setSession(email);
    $('#chipEmail').textContent = email;
    show('#screen-lobby');
  }catch(ex){
    if(err) err.textContent = ex.message || 'Ошибка регистрации';
  }
});

/* ---------- АВТОВХОД ---------- */
(async function autoLogin() {
  if(window.supabase){
    const { data } = await window.supabase.auth.getSession();
    const supUser = data.session?.user;
    const emailSup = supUser?.email;
    if(emailSup){
      currentUser = supUser;
      setSession(emailSup);
      $('#chipEmail').textContent = emailSup;
      show('#screen-lobby');
      return;
    }
  }
  const email = getSession();
  if (email && users[email]) {
    $('#chipEmail').textContent = email;
    show('#screen-lobby');
  } else {
    localStorage.removeItem(SESSION_KEY);
    show('#screen-auth');
  }
})();

/* ---------- ВЫХОД ---------- */
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await signOut();
  currentUser = null;
  show('#screen-auth');
  switchAuth('login');
});

/* ---------- ЛОББИ: переходы ---------- */
$('#goCreate')?.addEventListener('click', ()=>{
  show('#screen-app');
  setScene('pond'); renderPads(); frogJumpToPad(0,true); showSlide('create-1');
});
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
  codeInput.addEventListener('input',()=>{
    codeInput.value=codeInput.value.replace(/\D/g,'').slice(0,6);
    joinBtn.disabled = codeInput.value.length!==6;
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

/* интро-кнопки */
document.getElementById('speech').querySelector('.actions').onclick=(e)=>{
  const btn=e.target.closest('button'); if(!btn) return;
  withTransition(()=>{
    if(btn.dataset.next==='create'){
      show('#screen-app'); setScene('pond'); renderPads(); frogJumpToPad(0,true); showSlide('create-1');
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
  guests:[], code:null
};
const save=()=>localStorage.setItem(STORAGE,JSON.stringify(eventData));

function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }

async function createEvent({ title, date, time, address, dress, bring, notes, wishlist }){
  const user = (await supabase.auth.getUser()).data.user;
  const code = genCode();
  const ttlDays = 14;
  const code_expires_at = new Date(Date.now() + ttlDays*24*60*60*1000).toISOString();
  const { data, error } = await supabase.from('events').insert([{
    owner: user.id, title, date, time, address, dress, bring, notes,
    code, code_expires_at
  }]).select('*').single();
  if(error) throw error;
  const items = (wishlist||[]).filter(i=>i.title||i.url).map(it=>({
    event_id: data.id, title: it.title, url: it.url
  }));
  if(items.length){ await supabase.from('wishlist_items').insert(items); }
  return data;
}

/* шаги создания */
$('#formCreate')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const title=$('#eventTitle').value.trim(), date=$('#eventDate').value, time=$('#eventTime').value, address=$('#eventAddress').value.trim();
  if(!title||!date||!time) return alert('Заполните название, дату и время');
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
$('#saveCell')?.addEventListener('click',()=>{ const c=eventData.wishlist.find(x=>x.id===currentCellId); c.title=cellTitle.value.trim(); c.url=cellUrl.value.trim(); save(); renderGrid(); });
$('#clearWL')?.addEventListener('click',()=>{ eventData.wishlist.forEach(c=>{c.title='';c.url='';c.claimedBy='';}); save(); renderGrid(); });
$('#addItem')?.addEventListener('click',()=>{ const nextId=eventData.wishlist.length?Math.max(...eventData.wishlist.map(i=>i.id))+1:1; eventData.wishlist.push({id:nextId,title:'',url:'',claimedBy:''}); save(); renderGrid(); });
$('#toDetails')?.addEventListener('click',()=>withTransition(()=>{ showSlide('create-details'); }));
editor?.addEventListener('click',e=>{ const r=editor.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) editor.close(); });

$('#formDetails')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  Object.assign(eventData,{dress:$('#eventDress').value.trim(),bring:$('#eventBring').value.trim(),notes:$('#eventNotes').value.trim()});
  try{
    const ev = await createEvent(eventData);
    Object.assign(eventData, ev);
    save();
    withTransition(()=>{ showSlide('admin'); renderAdmin(); });
  }catch(_){ toast('Не удалось создать событие'); }
});
function renderAdmin(){
  $('#eventCode').textContent=eventData.code||'—';
  const exp=$('#codeExpire');
  if(exp){
    if(eventData.code_expires_at){
      const d=new Date(eventData.code_expires_at);
      exp.textContent=`Код истечёт ${d.toLocaleDateString('ru-RU')}`;
    } else exp.textContent='';
  }
  const html=(eventData.wishlist.filter(i=>i.title||i.url).map(i=>`${i.title||'Подарок'} — ${i.claimedBy?'🔒 занято':'🟢 свободно'} ${i.url?`• <a href="${i.url}" target="_blank">ссылка</a>`:''}`)).map(s=>`<li>${s}</li>`).join('');
  $('#adminGifts').innerHTML=html||'<li>Вишлист пуст</li>';
}
$('#finishCreate')?.addEventListener('click',()=>withTransition(()=>toFinalScene()));

$('#copyCodeBtn')?.addEventListener('click', ()=>shareInvite(eventData.code));

/* ПРИСОЕДИНЕНИЕ ПО КОДУ */
async function authHeader(){
  const { data } = await supabase.auth.getSession();
  const t = data?.session?.access_token;
  return t ? { Authorization: 'Bearer '+t } : {};
}

function mapStatusToMessage(res){
  if (res.status === 400) return 'Неверный формат кода';
  if (res.status === 401) return 'Войдите, чтобы продолжить';
  if (res.status === 404) return 'Код не найден';
  if (res.status === 410) return 'Срок действия кода истёк';
  if (res.status === 429) return 'Слишком много попыток. Попробуйте позже';
  return 'Ошибка сервера';
}

async function verifyCode(code){
  const res = await fetch('/.netlify/functions/event-by-code?code='+code, { headers: await authHeader() });
  if (!res.ok){
    if(res.status===401) await needLogin();
    throw new Error(mapStatusToMessage(res));
  }
  return res.json();
}

async function joinFlow(code){
  try{
    const event = await verifyCode(code); // проверка и загрузка данных
    Object.assign(eventData, event);
    let { data:{ user } } = await supabase.auth.getUser();
    let name = user?.user_metadata?.name;
    if(!name) name = (prompt('Как вас называть?') || '').trim();
    if(!name) { toast('Введите имя'); return; }

    const res = await fetch('/.netlify/functions/join-by-code', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...(await authHeader()) },
      body: JSON.stringify({ code, name })
    });
    if (!res.ok){
      const msg = mapStatusToMessage(res);
      if(res.status===401) await needLogin(); else toast(msg);
      return;
    }

    const { event_id } = await res.json();
    await loadEvent(event_id);
    setScene('final');
  }catch(e){ toast(e.message || 'Сеть недоступна'); }
}

let rtChannel;

function subscribeEventRealtime(eventId, { onWishlist, onGuests } = {}) {
  if (rtChannel) { supabase.removeChannel(rtChannel); rtChannel = null; }
  rtChannel = supabase
    .channel('event-' + eventId)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'wishlist_items', filter: 'event_id=eq.' + eventId
    }, (payload) => { onWishlist?.(payload); })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'guests', filter: 'event_id=eq.' + eventId
    }, (payload) => { onGuests?.(payload); })
    .subscribe();
}

async function renderWishlist(eventId){
  const { data } = await supabase.from('wishlist_items').select('id,title,url,claimed_by').eq('event_id', eventId).order('id');
  eventData.wishlist = (data || []).map(it=>({ id:it.id, title:it.title, url:it.url, claimedBy:it.claimed_by || '' }));
  if(!$('#slide-join-wishlist').hidden) renderGuestWishlist();
  if(!$('#slide-create-wishlist').hidden) renderGrid();
  if(!$('#slide-admin').hidden) renderAdmin();
  if(document.body.classList.contains('scene-final')) toFinalScene();
}

async function renderGuests(eventId){
  const { data } = await supabase.from('guests').select('name,rsvp').eq('event_id', eventId);
  eventData.guests = data || [];
  if(document.body.classList.contains('scene-final')) toFinalScene();
}

async function loadEvent(eventId){
  const ev = await supabase.from('events').select('*').eq('id', eventId).single();
  if(ev.data) Object.assign(eventData, ev.data);
  await Promise.all([renderWishlist(eventId), renderGuests(eventId)]);
  subscribeEventRealtime(eventId, {
    onWishlist: () => renderWishlist(eventId),
    onGuests:   () => renderGuests(eventId),
  });
}

function cleanupRealtime(){ if (rtChannel) { supabase.removeChannel(rtChannel); rtChannel = null; } }
window.addEventListener('beforeunload', cleanupRealtime);

async function needLogin(){
  const qp = new URLSearchParams(location.search);
  const code = qp.get('code') || '';
  if (code) sessionStorage.setItem('pendingCode', code);
  show('#screen-auth'); switchAuth('login');
}

async function handleDeepLink(){
  const code = (new URLSearchParams(location.search).get('code') || '').replace(/\D/g,'').slice(0,6);
  if(!code) return;
  const { data:{ session } } = await supabase.auth.getSession();
  if(!session){ sessionStorage.setItem('pendingCode', code); show('#screen-auth'); switchAuth('login'); }
  else { joinFlow(code); }
}

window.addEventListener('DOMContentLoaded', async () => {
  const pending = sessionStorage.getItem('pendingCode');
  if(pending){
    const { data:{ session } } = await supabase.auth.getSession();
    if(session){ sessionStorage.removeItem('pendingCode'); joinFlow(pending); }
  } else {
    handleDeepLink();
  }
});

$('#joinCodeBtn')?.addEventListener('click', () => {
  const code = ($('#joinCodeInput').value || '').replace(/\D/g,'').slice(0,6);
  if(code.length !== 6) return toast('Нужен 6-значный код');
  joinFlow(code);
});

async function joinCurrentEvent(){
  try{
    await fetch('/.netlify/functions/join-by-code',{
      method:'POST',
      headers:{'Content-Type':'application/json', ...(await authHeader())},
      body:JSON.stringify({ code:eventData.code, name:currentGuestName })
    });
  }catch(_){ }
}

/* RSVP + подарок */
let currentGuestName='';
document.querySelectorAll('[data-rsvp]')?.forEach(b=>b.addEventListener('click',e=>{
  const code=e.currentTarget.dataset.rsvp, name=($('#guestName').value||'').trim();
  if(!name) return alert('Введите имя');
  currentGuestName=name;
  const ex=eventData.guests.find(g=>g.name.toLowerCase()===name.toLowerCase());
  if(ex) ex.rsvp=code; else eventData.guests.push({name,rsvp:code});
  save(); croak();
}));
$('#toGuestWishlist')?.addEventListener('click',()=>{
  const name=($('#guestName').value||'').trim(); if(!name) return alert('Введите имя');
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
  guestGifts.querySelectorAll('.choose').forEach(b=>b.addEventListener('click',e=>{
    const id=+e.currentTarget.dataset.id; const it=eventData.wishlist.find(x=>x.id===id);
    if(it.claimedBy && it.claimedBy.toLowerCase()!==currentGuestName.toLowerCase()) return alert('Этот подарок уже выбрали');
    eventData.wishlist.forEach(x=>{ if(x.claimedBy && x.claimedBy.toLowerCase()===currentGuestName.toLowerCase()) x.claimedBy=''; });
    it.claimedBy=currentGuestName; save(); renderGuestWishlist();
  }));
  guestGifts.querySelectorAll('.unchoose').forEach(b=>b.addEventListener('click',e=>{
    const id=+e.currentTarget.dataset.id; const it=eventData.wishlist.find(x=>x.id===id);
    if(it.claimedBy && it.claimedBy.toLowerCase()===currentGuestName.toLowerCase()){ it.claimedBy=''; save(); renderGuestWishlist(); }
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
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div>Код события: <span class="pill-mini" style="background:#1b4a33">${eventData.code||'—'}</span></div>
      <button class="btn small" id="copyCodeBtn">Поделиться</button>
    </div>
  `;
  document.getElementById('copyCodeBtn')?.addEventListener('click', () => shareInvite(eventData.code));

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
