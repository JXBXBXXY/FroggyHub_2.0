// ===== ENV & Supabase bootstrap =====
const ENV = window?.ENV ?? {};
const URL = (ENV.PUBLIC_SUPABASE_URL || "").trim();
const KEY = (ENV.PUBLIC_SUPABASE_ANON_KEY || "").trim();
const isPlaceholder = (s) => !s || /PUBLIC_SUPABASE_/i.test(s) || s.endsWith("/");

async function ensureSupabase() {
  if (window.supabase) return window.supabase;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload = resolve; s.onerror = () => reject(new Error("supabase cdn failed"));
    document.head.appendChild(s);
  });
  return window.supabase;
}

let supa = null;
async function initSupa() {
  if (supa) return supa;
  if (isPlaceholder(URL) || isPlaceholder(KEY)) {
    console.warn("[supa] missing env, running in guest mode");
    return null;
  }
  await ensureSupabase();
  supa = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return supa;
}

// ===== UI helpers =====
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const setBodyState = (authed) => {
  document.body.classList.toggle("authed", !!authed);
  document.body.classList.toggle("guest", !authed);
};
const goto = (href) => (location.href = href);

// data-link навигация между страницами проекта
const routes = {
  home: "./index.html",
  lobby: "./lobby.html",
  menu:  "./lobby.html",
  profile: "./profile.html",
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-link]");
  if (!a) return;
  e.preventDefault();
  const key = a.getAttribute("data-link");
  const url = routes[key];
  if (!url) return;
  // защита меню для гостя
  if (document.body.classList.contains("guest") && (key === "menu" || key === "profile" || key === "lobby")) {
    openAuth(); return;
  }
  goto(url);
});

// ===== Floating chips (background) =====
const FH_MESSAGES = [
  "Я приду к 19:00 ✨","Я возьму пиццу 🍕","Кто возьмёт колу? 🥤","Ребят, постучите в дверь 🚪",
  "Буду позже 🙈","Добавил плейлист 🎶","Кто возьмет настолки? 🎲","Буду через 15 минут ⏳",
  "Я за пивом 🍺","Буду online 💻","Встречаемся у метро 🚉","Я за мороженым 🍦","Принесу колонку 📢",
  "Сделаем фото 📸","Не забудьте зарядки 🔌","Привезу попкорн 🍿","Подготовлю викторину ❓"
];
const FH = {
  MAX: 20, MARGIN: 20, PLACE_TRIES: 40, MIN_DIST: 120,
  MIN_V: .045, MAX_V: .09, JITTER: .00012, KICK: .12
};
let cloudsRoot=null, chips=[], animId=0;
function ensureCloudsRoot(){
  if (cloudsRoot && document.body.contains(cloudsRoot)) return cloudsRoot;
  if (cloudsRoot?.parentNode) cloudsRoot.parentNode.removeChild(cloudsRoot);
  cloudsRoot = document.getElementById("fh-message-clouds") || document.createElement("div");
  cloudsRoot.id = "fh-message-clouds";
  cloudsRoot.setAttribute("aria-hidden","true");
  cloudsRoot.style.pointerEvents = "none";
  document.body.prepend(cloudsRoot);
  return cloudsRoot;
}
function rand(a,b){return Math.random()*(b-a)+a}
function clamp(v,a,b){return Math.min(Math.max(v,a),b)}
function spawnChips(){
  const root = ensureCloudsRoot();
  if (chips.length) return startFloat();
  const pool = [...FH_MESSAGES];
  for(let i=pool.length-1;i>0;i--){const j=(Math.random()*(i+1))|0; [pool[i],pool[j]]=[pool[j],pool[i]]}
  const list = pool.slice(0,FH.MAX);
  const W = innerWidth, H = innerHeight;

  function canPlace(cx,cy,w,h){
    if (cx-w/2 < FH.MARGIN || cy-h/2 < FH.MARGIN) return false;
    if (cx+w/2 > W-FH.MARGIN || cy+h/2 > H-FH.MARGIN) return false;
    for(const c of chips){
      const dx=cx-(c.x+c.w/2), dy=cy-(c.y+c.h/2);
      if (dx*dx+dy*dy < FH.MIN_DIST*FH.MIN_DIST) return false;
    }
    return true;
  }
  function nonZeroV(){
    const a=rand(0,Math.PI*2), s=rand(FH.MIN_V,FH.MAX_V);
    return {vx:Math.cos(a)*s, vy:Math.sin(a)*s};
  }

  list.forEach(msg=>{
    const el=document.createElement("div");
    el.className="fh-chip"; el.textContent=msg; root.appendChild(el);
    const r=el.getBoundingClientRect(); const w=r.width||140, h=r.height||40;
    let placed=false, x=FH.MARGIN, y=FH.MARGIN;
    for(let t=0; t<FH.PLACE_TRIES && !placed; t++){
      const cx=rand(FH.MARGIN+w/2, W-FH.MARGIN-w/2);
      const cy=rand(FH.MARGIN+h/2, H-FH.MARGIN-h/2);
      if (canPlace(cx,cy,w,h)){x=cx-w/2; y=cy-h/2; placed=true;}
    }
    if(!placed){ x=clamp(rand(FH.MARGIN, W-w-FH.MARGIN), FH.MARGIN, W-w-FH.MARGIN);
                 y=clamp(rand(FH.MARGIN, H-h-FH.MARGIN), FH.MARGIN, H-h-FH.MARGIN); }
    const {vx,vy}=nonZeroV();
    chips.push({el,x,y,w,h,vx,vy,stuck:0});
    el.style.transform=`translate3d(${x}px,${y}px,0)`;
  });
  startFloat();
}
function startFloat(){
  cancelAnimationFrame(animId);
  let last=performance.now();
  function tick(now){
    const dt=now-last; last=now;
    const W=innerWidth, H=innerHeight;
    for(const c of chips){
      c.vx += rand(-FH.JITTER,FH.JITTER)*dt;
      c.vy += rand(-FH.JITTER,FH.JITTER)*dt;
      const sp=Math.hypot(c.vx,c.vy);
      if (sp < FH.MIN_V){ const a=rand(0,Math.PI*2); c.vx=Math.cos(a)*FH.MIN_V; c.vy=Math.sin(a)*FH.MIN_V; }
      else if (sp > FH.MAX_V){ c.vx=(c.vx/sp)*FH.MAX_V; c.vy=(c.vy/sp)*FH.MAX_V; }
      c.x += c.vx*dt; c.y += c.vy*dt;

      if (c.x < FH.MARGIN){ c.x=FH.MARGIN; c.vx=Math.abs(c.vx); }
      if (c.y < FH.MARGIN){ c.y=FH.MARGIN; c.vy=Math.abs(c.vy); }
      if (c.x > W-c.w-FH.MARGIN){ c.x=W-c.w-FH.MARGIN; c.vx=-Math.abs(c.vx); }
      if (c.y > H-c.h-FH.MARGIN){ c.y=H-c.h-FH.MARGIN; c.vy=-Math.abs(c.vy); }

      const nearL=c.x<=FH.MARGIN+1, nearR=c.x>=W-c.w-FH.MARGIN-1;
      const nearT=c.y<=FH.MARGIN+1, nearB=c.y>=H-c.h-FH.MARGIN-1;
      if ((nearL||nearR) && (nearT||nearB)){
        c.stuck+=dt; if (c.stuck>100){ c.vx+=(nearL?FH.KICK:-FH.KICK); c.vy+=(nearT?FH.KICK:-FH.KICK); c.stuck=0; }
      } else c.stuck=Math.max(0,c.stuck-dt);

      c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
    }
    animId=requestAnimationFrame(tick);
  }
  animId=requestAnimationFrame(tick);
}
addEventListener("resize", ()=> chips.forEach(c=>{
  c.x = clamp(c.x, FH.MARGIN, innerWidth - c.w - FH.MARGIN);
  c.y = clamp(c.y, FH.MARGIN, innerHeight - c.h - FH.MARGIN);
  c.el.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
}), {passive:true});

// ===== Auth overlay logic =====
const panes = $$(".auth-pane");
const tabs = $$(".tab");
function showPane(name){
  panes.forEach(p=>p.classList.toggle("visible", p.dataset.pane===name));
  tabs.forEach(t=>t.classList.toggle("is-active", t.dataset.authTab===name));
}
function openAuth(){ document.documentElement.scrollTop = 0; showPane("login"); }

document.addEventListener("click",(e)=>{
  const t = e.target.closest("[data-auth-tab]"); if (!t) return;
  showPane(t.dataset.authTab);
});

// Forms
const elLogin  = $("#form-login");
const elSignup = $("#form-signup");
const elReset  = $("#form-reset");
const errBox   = $("#auth-error");

function setError(msg){ errBox.textContent = msg || ""; }

// ===== Session handling =====
async function refreshSessionUI(){
  const client = await initSupa();
  let session = null;
  if (client){
    const { data } = await client.auth.getSession();
    session = data.session || null;
  }
  setBodyState(!!session);
  // если уже авторизован — показываем «панель» и скрываем оверлей
  if (session){
    $("#auth-overlay")?.classList.add("guest-only"); // скрыто для авторизованных
  } else {
    $("#auth-overlay")?.classList.remove("guest-only");
  }
}

// login
elLogin?.addEventListener("submit", async (e)=>{
  e.preventDefault(); setError("");
  const client = await initSupa();
  if (!client){ setError("Auth временно недоступна"); return; }
  const login = e.currentTarget.login.value.trim();
  const password = e.currentTarget.password.value;
  try{
    // если похоже на email — используем email, иначе попытаемся найти по нику (через RPC, если есть)
    let email = login;
    if (!/\S+@\S+\.\S+/.test(login) && client.rpc){
      const { data, error } = await client.rpc("get_email_by_nickname",{ p_nickname: login });
      if (error) throw error;
      email = data?.email || login;
    }
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshSessionUI();
    goto("./lobby.html");
  }catch(err){ setError(err?.message || "Ошибка входа"); }
});

// signup
elSignup?.addEventListener("submit", async (e)=>{
  e.preventDefault(); setError("");
  const client = await initSupa();
  if (!client){ setError("Auth временно недоступна"); return; }
  const nickname = e.currentTarget.nickname.value.trim();
  const email    = e.currentTarget.email.value.trim();
  const password = e.currentTarget.password.value;
  try{
    const { error } = await client.auth.signUp({ email, password, options:{ data:{ nickname } }});
    if (error) throw error;
    setError("Проверь почту для подтверждения. Затем войди.");
    showPane("login");
  }catch(err){ setError(err?.message || "Ошибка регистрации"); }
});

// reset
elReset?.addEventListener("submit", async (e)=>{
  e.preventDefault(); setError("");
  const client = await initSupa();
  if (!client){ setError("Auth временно недоступна"); return; }
  const email = e.currentTarget.email.value.trim();
  try{
    const { error } = await client.auth.resetPasswordForEmail(email);
    if (error) throw error;
    setError("Если email существует — мы отправили письмо со ссылкой.");
  }catch(err){ setError(err?.message || "Ошибка сброса пароля"); }
});

// logout
$("#btn-logout")?.addEventListener("click", async ()=>{
  const client = await initSupa();
  if (!client) { goto("./index.html"); return; }
  await client.auth.signOut().catch(()=>{});
  await refreshSessionUI();
  goto("./index.html");
});

// on load
(async function boot(){
  ensureCloudsRoot(); spawnChips();
  await initSupa();
  await refreshSessionUI();
  // слушаем live изменения сессии
  supa?.auth.onAuthStateChange((_evt)=> refreshSessionUI());
})();
