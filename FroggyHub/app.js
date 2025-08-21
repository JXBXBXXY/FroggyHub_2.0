// ===== Утилиты
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function show(name){
  $$('section[id^="screen-"]').forEach(s=>s.hidden = s.id !== `screen-${name}`);
  document.body.dataset.screen = name;
}

// ===== Инициализация
document.addEventListener('DOMContentLoaded', () => {
  const jwt = localStorage.getItem('FH_JWT');
  show(jwt ? 'menu' : 'auth');

  // табы логин/регистрация
  const tabLogin = $('#tabLogin'), tabReg = $('#tabRegister');
  const fLogin = $('#authFormLogin'), fReg = $('#authFormRegister');
  tabLogin?.addEventListener('click', ()=>{
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    fLogin.hidden=false; fReg.hidden=true;
  });
  tabReg?.addEventListener('click', ()=>{
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    fLogin.hidden=true; fReg.hidden=false;
  });

  // логин
  fLogin?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email=$('#loginEmail').value.trim();
    const pass =$('#loginPass').value.trim();
    try{
      const res = await fetch('/.netlify/functions/local-login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nickname: email, password: pass })
      });
      const data = await res.json().catch(()=>({}));
      if(res.ok && data?.token){
        localStorage.setItem('FH_JWT', data.token);
        show('menu');
      }else{
        alert(data?.error || 'Ошибка входа');
      }
    }catch(err){ alert(err.message); }
  });

  // регистрация
  fReg?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name=$('#regName').value.trim();
    const email=$('#regEmail').value.trim();
    const pass=$('#regPass').value;
    const pass2=$('#regPass2').value;
    if(pass!==pass2) return alert('Пароли не совпадают');
    try{
      const res = await fetch('/.netlify/functions/local-signup', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nickname:name, password:pass, email })
      });
      const data = await res.json().catch(()=>({}));
      if(res.ok){
        show('menu');
      }else{
        alert(data?.error || 'Ошибка регистрации');
      }
    }catch(err){ alert(err.message); }
  });

  // кнопка «Создать событие»
  $('#create-event')?.addEventListener('click', (e)=>{
    e.preventDefault();
    document.body.classList.remove('scene-final');
    document.body.classList.add('scene-pond');
    show('app');
    $('#slides')?.querySelectorAll('section').forEach(s=>s.hidden=true);
    $('#slide-create-1').hidden=false;
  });

  // форма join — глушим сабмит
  $('#join-form')?.addEventListener('submit', (e)=>e.preventDefault());
  // «Присоединиться»
  $('#join-btn')?.addEventListener('click', async (e)=>{
    e.preventDefault();
    const code = ($('#join-code')?.value||'').trim();
    if(code.length!==6) return alert('Введите 6-значный код');
    document.body.classList.remove('scene-final');
    document.body.classList.add('scene-pond');
    show('app');
    $('#slides')?.querySelectorAll('section').forEach(s=>s.hidden=true);
    $('#slide-join-code').hidden=false;
    // дальше — ваша логика проверки кода + переход на slide-join-1
  });

  // выход
  $('#btn-logout')?.addEventListener('click', ()=>{
    localStorage.removeItem('FH_JWT');
    document.body.classList.remove('scene-pond','scene-final');
    show('auth');
  });

  // верхние навкнопки с data-go
  document.addEventListener('click',(e)=>{
    const go = e.target.closest('[data-go]');
    if(!go) return;
    e.preventDefault();
    const target = go.getAttribute('data-go');
    if(target==='final'){ document.body.classList.add('scene-final'); }
    else{ document.body.classList.remove('scene-final'); }
    if(target!=='app'){ document.body.classList.remove('scene-pond'); }
    show(target==='app' ? 'app' : target);
  });
});

