import { supa, signUpWithNickname, signInSmart, getSession, signOut, onAuthChanged } from './api.js';

const qs=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const SCREENS={ auth:'#screen-auth', home:'#screen-home' };

function showScreen(name){
  const id=SCREENS[name]||name;
  qa('.screen').forEach(el=>{
    const visible=('#'+el.id)===id;
    el.classList.toggle('visible',visible);
    el.setAttribute('aria-hidden',String(!visible));
  });
  const newHash=id.startsWith('#')?id:`#${id}`;
  if(location.hash!==newHash) history.replaceState(null,'',newHash);
}

function navBind(){
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-link]');
    if(!a) return;
    e.preventDefault();
    const target=a.getAttribute('data-link');
    if(target) showScreen(target);
  });
  window.addEventListener('hashchange',()=>{
    const key=location.hash.replace('#','')||'home';
    if(SCREENS[key]) showScreen(key);
  });
}

function bindAuthForms(){
  const authForm=qs('#auth-form');
  if(authForm){
    authForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const fd=new FormData(authForm);
      const login=fd.get('login'), password=fd.get('password');
      const errBox=authForm.querySelector('.form-error');
      try{ await signInSmart({login,password}); showScreen('home'); }
      catch(err){ errBox&&(errBox.textContent=err.message); }
    });
  }
  const regForm=qs('#register-form');
  if(regForm){
    regForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const fd=new FormData(regForm);
      const nickname=fd.get('nickname'), email=fd.get('email'), password=fd.get('password');
      const errBox=regForm.querySelector('.form-error');
      try{ await signUpWithNickname({nickname,email,password}); showScreen('home'); }
      catch(err){ errBox&&(errBox.textContent=err.message); }
    });
  }
  qa('[data-action="logout"]').forEach(btn=>{
    btn.addEventListener('click',async()=>{ try{await signOut();}catch{} });
  });
}

async function boot(){
  navBind(); bindAuthForms();
  try{ const s=await getSession(); showScreen(s?'home':'auth'); }
  catch{ showScreen('auth'); }
  onAuthChanged((_e,s)=>showScreen(s?'home':'auth'));
}
document.addEventListener('DOMContentLoaded',boot);
