// app.js
import { supa } from './api.js';

/* -------------------- фоновые «облачка» -------------------- */

const FH_MESSAGES = [
  'Я приду к 19:00 ✨','Я возьму пиццу 🍕','Кто возьмёт колу? 🥤','Ребят, постучите в дверь 🚪','Буду позже 🙈',
  'Закажем такси? 🚖','Добавил плейлист 🎶','У кого карты? 🎴','Забронировал столик 🍽️','Сделаем фото 📸',
  'Я за пивом 🍺','Принесу проектор 📽️','Я купил шарики 🎈','Спойлер: будет торт 🎂','Я возьму чипсы 🥨',
  'Друзья, до встречи 🐸','Нужны свечи 🕯️','Кто возьмет настолки? 🎲','Всем привет! 👋','Буду с +1 🙂',
  'Я за сладким 🍩','Кто за лимонадом? 🍋','Прихвачу фрукты 🍇','Поставлю чайник ☕','Возьму пледы 🧣',
  'Захвачу музыку 🔊','Кто возьмет мангал? 🔥','Я за салатом 🥗','Давайте играть в мафию 😎','Поделитесь адресом 🗺️',
  'Где паркуемся? 🅿️','Принесу колонку 📢','Я принесу десерт 🍰','Кто возьмёт свечи? 🕯️','Я возьму сок 🧃',
  'Берите тёплые вещи 🧥','Я за хлопьями 🍿','Нужен штопор? 🍷','Кто возьмёт гитару? 🎸','Давайте устроим караоке 🎤',
  'Привезу настольный футбол ⚽','Я везу кота 🐱','Кто-то едет на велосипеде? 🚲','Приготовлю салаты 🥬','Я за фруктами 🍏',
  'Сделаю лимонад 🍋','У меня есть проектор 📽️','Я приеду на час раньше ⏱️','Привезу геймпад 🎮','Я на метро 🚇',
  'Возьму фотоаппарат 📷','Кто-то пьет чай? 🍵','Я привезу воду 💧','Есть у кого настольный теннис? 🏓','Я за хлебом 🍞',
  'Кто возьмёт кофе? ☕','Давайте фильм посмотрим 🎬','Я приготовлю пасту 🍝','Возьму гитару 🎸','Нужны батарейки? 🔋',
  'Я на машине 🚗','Кто возьмет тарелки? 🍽️','Буду через 15 минут ⏳','Захвачу зонтик ☔','Я возьму торт 🍰',
  'Не забудьте зарядки 🔌','Я уже в пути 🛣️','Поставлю музыку 🎧','Принесу игру в угадайку 🤔','Я за печеньем 🍪',
  'Буду online 💻','Увидимся у входа 🚪','Я за наушниками 🎧','Кто возьмет посуду? 🍽️','Мне нужно такси 🛺',
  'У кого есть карты? 🃏','Заберу пиццу по пути 🍕','Кто за гирляндами? 🌟','Я отпечатаю фото 📸','Кто на десерт? 🍮',
  'Встречаемся у метро 🚉','Я возьму мороженое 🍦'
];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pickMessage = () => FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
const debounce = (fn, wait=100) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; };
const rectsOverlap=(a,b,p=0)=>!(a.right+p<b.left||a.left-p>b.right||a.bottom+p<b.top||a.top-p>b.bottom);
const desiredBubbleCount=()=>Math.min(80,Math.max(20,Math.round((innerWidth*innerHeight)/12000)));

function spawnBubbles(container, count) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = pickMessage();
    container.appendChild(el);

    const c = container.getBoundingClientRect();
    let tries = 0, x = 0, y = 0, ok = false;
    while (tries++ < 60 && !ok) {
      x = 24 + Math.random() * (c.width - 160);
      y = 24 + Math.random() * (c.height - 60);
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      const r1 = el.getBoundingClientRect();
      ok = !placed.some(p => rectsOverlap(r1, p.getBoundingClientRect(), 8));
    }
    requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));

    if (!prefersReduced) {
      const anchor = { x, y };
      const loop = () => {
        const visibleMs = 3000 + Math.random() * 1000;
        setTimeout(() => {
          el.classList.remove('fh-bubble--in');
          el.classList.add('fh-bubble--out');
          el.addEventListener('transitionend', () => {
            el.textContent = pickMessage();
            const dx = Math.random()*80 - 40;
            const dy = Math.random()*80 - 40;
            const { width, height } = el.getBoundingClientRect();
            const c2 = container.getBoundingClientRect();
            const nx = Math.max(8, Math.min(c2.width  - width  - 8, anchor.x + dx));
            const ny = Math.max(8, Math.min(c2.height - height - 8, anchor.y + dy));
            el.style.left = `${nx}px`; el.style.top = `${ny}px`;
            el.classList.remove('fh-bubble--out');
            requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));
            loop();
          }, { once: true });
        }, visibleMs);
      };
      loop();
    } else {
      setInterval(()=> el.textContent = pickMessage(), 10000 + Math.random()*2000);
    }
    placed.push(el);
  }
}

/* -------------------- сессия и экраны -------------------- */

const LS_KEY = 'fh_session';
const getSavedSession = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; } };
const setSavedSession = (s) => { try { s ? localStorage.setItem(LS_KEY, JSON.stringify(s)) : localStorage.removeItem(LS_KEY); } catch {} };

let $auth, $home;

async function ensureSession() {
  let session = getSavedSession();
  if (!session && supa?.auth) {
    try {
      const { data } = await supa.auth.getSession();
      session = data?.session || null;
      if (session) setSavedSession({ user: session.user, access_token: session.access_token });
    } catch {}
  }
  return session;
}

function showScreen(id) {
  const target = document.getElementById(id);
  if (!target) return;
  document.querySelectorAll('.screen').forEach(s => {
    const on = s === target;
    s.toggleAttribute('hidden', !on);
    s.classList.toggle('visible', on);
  });
}

/* -------------------- навигация и общие биндинги -------------------- */

function bindTabs() {
  const tabLogin = document.getElementById('tab-login');
  const tabReg   = document.getElementById('tab-register');
  const paneLogin= document.getElementById('pane-login');
  const paneReg  = document.getElementById('pane-register');
  if (!tabLogin || !tabReg || !paneLogin || !paneReg) return;

  const activate = (which) => {
    const loginActive = which === 'login';
    tabLogin.classList.toggle('is-active', loginActive);
    tabReg.classList.toggle('is-active', !loginActive);
    paneLogin.classList.toggle('is-hidden', !loginActive);
    paneReg.classList.toggle('is-hidden', loginActive);
    tabLogin.setAttribute('aria-selected', String(loginActive));
    tabReg.setAttribute('aria-selected', String(!loginActive));
  };

  tabLogin.addEventListener('click', () => activate('login'));
  tabReg.addEventListener('click', () => activate('register'));
}

function bindAuthForms() {
  if (window.FH?.__authBound) return;
  window.FH = window.FH || {};
  window.FH.__authBound = true;

  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  async function handle(form, kind) {
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const nickname = (fd.get('nickname') || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      if (!nickname || !password) return;

      const email = nickname.includes('@') ? nickname : `${nickname}@local`;
      try {
        let ok = false, session = null;

        if (kind === 'login') {
          const { data, error } = await supa.auth.signInWithPassword({ email, password });
          if (!error) { ok = true; session = data.session; }
        } else {
          const { error } = await supa.auth.signUp({ email, password });
          if (!error) {
            const r = await supa.auth.signInWithPassword({ email, password });
            ok = !r.error; session = r.data.session;
          }
        }

        if (ok && session) {
          setSavedSession({ user: session.user, access_token: session.access_token });
          // удаляем auth-экран, чтобы менеджеры паролей его не видели
          document.getElementById('screen-auth')?.remove();
          showScreen('screen-home');
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  handle(loginForm, 'login');
  handle(signupForm, 'signup');

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action="login"], [data-action="signup"], .js-login, .js-signup');
    if (!btn) return;
    ev.preventDefault();
    const isLogin = btn.matches('[data-action="login"], .js-login');
    const form = btn.closest('form') || (isLogin ? loginForm : signupForm);
    if (!form) return;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

function bindIndexNav() {
  // data-go
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-go]');
    if (!navBtn) return;
    e.preventDefault();
    const to = navBtn.getAttribute('data-go');
    const mode = navBtn.getAttribute('data-mode') || '';
    if (to === 'app' && mode === 'create') {
      window.location.href = '/event-edit.html';
      return;
    }
  });

  // “Присоединиться”
  const joinBtn   = document.getElementById('join-btn');
  const joinInput = document.getElementById('join-code');
  if (joinBtn && joinInput) {
    joinBtn.addEventListener('click', () => {
      const code = (joinInput.value || '').trim();
      if (!/^[A-Z0-9]{6}$|^\d{6}$/.test(code.toUpperCase())) {
        joinInput.classList.add('input-error');
        setTimeout(()=> joinInput.classList.remove('input-error'), 800);
        return;
      }
      window.location.href = `/join.html?code=${encodeURIComponent(code.toUpperCase())}`;
    });
  }
}

/* -------------------- страница редактирования события -------------------- */

function randomDigits(n=6){ return Array.from({length:n},()=>Math.floor(Math.random()*10)).join(''); }
function randomCode(n=6){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:n},()=>A[Math.floor(Math.random()*A.length)]).join(''); }

function bindEventEditPage() {
  const form = document.getElementById('editForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title: fd.get('title') || fd.get('editTitle') || document.getElementById('editTitle')?.value || '',
      date:  fd.get('date')  || document.getElementById('editDate')?.value  || null,
      time:  fd.get('time')  || document.getElementById('editTime')?.value  || null,
      address: fd.get('address') || document.getElementById('editAddress')?.value || '',
      comment: fd.get('notes') || document.getElementById('editNotes')?.value || '',
      dress_code: fd.get('dress') || document.getElementById('editDress')?.value || '',
      what_to_bring: fd.get('bring') || document.getElementById('editBring')?.value || ''
    };

    // запасной план — коды на клиенте, если нет триггера в БД
    payload.code = randomDigits(6);
    payload.join_code = randomCode(6);

    try {
      const { data, error } = await supa.from('events')
        .insert(payload)
        .select('id, code, join_code')
        .single();

      if (error) throw error;

      // в черновик на всякий:
      sessionStorage.setItem('fh:draftEvent', JSON.stringify({ id: data.id, ...payload }));

      // сразу на страницу вишлиста
      window.location.href = `/wishlist.html?event=${data.id}`;
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить событие. Проверьте подключение к базе.');
    }
  });
}

/* -------------------- страница join.html -------------------- */

function bindJoinPage() {
  const params = new URLSearchParams(location.search);
  const code = (params.get('code') || '').toUpperCase();
  const nameInput = document.querySelector('#join-name, [name="name"]');
  const btnJoin = document.getElementById('btn-join');
  const statusWrap = document.getElementById('join-status-wrap') || document;
  const errorBox = document.getElementById('join-error');

  if (!code || !nameInput || !btnJoin) return;

  // показать код
  const codeHolder = document.getElementById('join-code-text');
  if (codeHolder) codeHolder.textContent = code;

  let picked = 'yes';
  statusWrap.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-rsvp]');
    if (!b) return;
    picked = b.getAttribute('data-rsvp');
    [...statusWrap.querySelectorAll('[data-rsvp]')].forEach(x=>x.classList.toggle('is-active', x===b));
  });

  async function findEventByCode(c) {
    const { data, error } = await supa
      .from('events')
      .select('id, code, join_code, title')
      .or(`code.eq.${c},join_code.eq.${c}`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  btnJoin.addEventListener('click', async ()=>{
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    try {
      const ev = await findEventByCode(code);
      if (!ev) {
        if (errorBox) errorBox.textContent = 'Событие с таким кодом не найдено.';
        return;
      }
      const { error } = await supa.from('rsvps').insert({
        event_id: ev.id,
        user_name: name,
        status: picked
      });
      if (error) throw error;
      window.location.href = `/lobby.html?event=${ev.id}`;
    } catch (err) {
      console.error(err);
      if (errorBox) errorBox.textContent = 'Ошибка присоединения. Попробуйте позже.';
    }
  });
}

/* -------------------- bootstrap -------------------- */

function bootBubbles() {
  const root = document.querySelector('.fh-bubbles');
  if (!root) return;
  root.innerHTML = '';
  spawnBubbles(root, desiredBubbleCount());
  addEventListener('resize', debounce(() => {
    root.innerHTML = '';
    spawnBubbles(root, desiredBubbleCount());
  }, 200));
}

document.addEventListener('DOMContentLoaded', async () => {
  $auth = document.getElementById('screen-auth');
  $home = document.getElementById('screen-home');

  bindTabs();
  bindAuthForms();
  bindIndexNav();
  bindEventEditPage();
  bindJoinPage();
  bootBubbles();

  const session = await ensureSession();
  if (session) {
    // убираем auth из DOM, чтобы не мешал менеджерам паролей
    document.getElementById('screen-auth')?.remove();
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }
});
