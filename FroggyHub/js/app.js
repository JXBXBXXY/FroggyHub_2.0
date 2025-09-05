// Быстрые селекторы
const qs = (s, r=document) => r.querySelector(s);
const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

// Переключение видимого экрана
const SCREENS = ['auth','home','join','wishlist','create','profile','settings'];

function showScreen(name){
  const id = name.startsWith('#') ? name.slice(1) : `screen-${name}`;
  qa('.screen').forEach(el=>{
    const visible = el.id === id;
    el.classList.toggle('visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  // Скролл только для wishlist
  if (id === 'screen-wishlist') {
    document.body.classList.add('allow-scroll');
  } else {
    document.body.classList.remove('allow-scroll');
    window.scrollTo({top:0, behavior:'instant'});
  }
  // Обновим hash (кроме auth, чтобы не светить)
  if (name !== 'auth') {
    const newHash = `#${name}`;
    if (location.hash !== newHash) history.replaceState(null,'',newHash);
  }
}

// Хэш-роутер
function routeFromHash(){
  const target = (location.hash || '#home').replace('#','');
  showScreen(SCREENS.includes(target) ? target : 'home');
}

// Навигация по data-link
function bindNav(){
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    e.preventDefault();
    const dest = btn.getAttribute('data-link');
    if (SCREENS.includes(dest)) showScreen(dest);
  });
}

// Монтирование чипов в слой колонок
function mountClouds(messages){
  const host = qs('#fh-message-clouds');
  if (!host) return;
  host.innerHTML = '';
  const frag = document.createDocumentFragment();
  messages.forEach(m=>{
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = m;
    frag.appendChild(el);
  });
  host.appendChild(frag);
}

// Периодически слегка перемешиваем порядок (без reflow ада)
function shuffleClouds(intervalMs=7000){
  const host = qs('#fh-message-clouds');
  if (!host) return;
  setInterval(()=>{
    const chips = qa('.fh-chip', host);
    if (chips.length < 2) return;
    // берём 6–10 случайных, делаем fade-out, меняем порядок, fade-in
    const count = Math.min(chips.length, 8);
    const picks = chips.sort(()=>Math.random()-0.5).slice(0, count);
    picks.forEach(el=>el.classList.add('is-fading-out'));
    setTimeout(()=>{
      picks.forEach(el=>{
        el.classList.remove('is-fading-out');
        // перемещение вперёд создаёт новый порядок в многоколоночном потоке
        host.appendChild(el);
        el.classList.add('is-fading-in');
        setTimeout(()=>el.classList.remove('is-fading-in'), 500);
      });
    }, 280);
  }, intervalMs);
}

// Пример списка «смсок» (замени на свои данные/генератор)
const AMBIENT = [
  'Кто возьмёт колу? 🧃', 'Я за хлебом 🥖', 'Сделаю плейлист 🎶',
  'Поставлю чайник 🫖', 'Я возьму пиццу 🍕', 'Друзья, до встречи 🌿',
  'Нужны свечи 🕯️', 'Кто за лимонадом? 🍋', 'Закажем такси? 🚕',
  'Сделаем фото 📸', 'Постелю пледы 🧺', 'Кто возьмёт тарелки? 🍽️'
];

function bindAuthForms(){
  const form = qs('#auth-form') || qs('#login-form');
  if (!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const login = fd.get('login') || fd.get('nickname');
    const password = fd.get('password');
    const errBox = form.querySelector('.form-error');
    if (errBox) errBox.textContent = '';
    try{
      const { signInSmart } = await import('./api.js');
      await signInSmart({ login, password });
      showScreen('home');
    }catch(err){
      console.warn('[auth:login]', err?.message || err);
      if (errBox) errBox.textContent = err?.message || 'Ошибка входа';
    }
  });

  const reg = qs('#register-form');
  if (reg){
    reg.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(reg);
      const nickname = fd.get('nickname');
      const email    = fd.get('email');
      const password = fd.get('password');
      const errBox = reg.querySelector('.form-error');
      if (errBox) errBox.textContent = '';
      try{
        const { signUpWithNickname } = await import('./api.js');
        await signUpWithNickname({ nickname, email, password });
        // После регистрации — сразу в home
        showScreen('home');
      }catch(err){
        console.warn('[auth:signup]', err?.message || err);
        if (errBox) errBox.textContent = err?.message || 'Ошибка регистрации';
      }
    });
  }
}

function bootstrap(){
  // фоновые чипы
  mountClouds(AMBIENT);
  shuffleClouds(9000);

  // навигация
  bindNav();
  addEventListener('hashchange', routeFromHash);
  routeFromHash();

  // если авторизован — сразу home, иначе auth
  import('./api.js').then(({ getSession })=>{
    getSession().then(sess=>{
      if (sess) showScreen('home'); else showScreen('auth');
    }).catch(()=>showScreen('auth'));
  });

  // привязка форм
  bindAuthForms();
}

document.addEventListener('DOMContentLoaded', bootstrap);
