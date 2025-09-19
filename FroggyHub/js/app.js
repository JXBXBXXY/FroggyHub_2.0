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

const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pickMessage = () => FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
const debounce = (fn, wait=100) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; };
const rectsOverlap=(a,b,p=0)=>!(a.right+p<b.left||a.left-p>b.right||a.bottom+p<b.top||a.top-p>b.bottom);
const desiredBubbleCount=()=>Math.min(80,Math.max(20,Math.round((innerWidth*innerHeight)/12000)));

/** Надёжная раскладка пузырьков без «ok» (Safari-safe) */
function spawnBubbles(container, count) {
  if (!container) return;
  const placed = [];

  const placeNonOverlapping = (el) => {
    const c = container.getBoundingClientRect();
    const maxX = Math.max(40, c.width  - 160);
    const maxY = Math.max(40, c.height -  60);
    for (let tries = 0; tries < 80; tries++) {
      const x = 24 + Math.random() * maxX;
      const y = 24 + Math.random() * maxY;
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      const r1 = el.getBoundingClientRect();
      if (!placed.some(p => rectsOverlap(r1, p.getBoundingClientRect(), 8))) return { x, y };
    }
    return { x: 24, y: 24 };
  };

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = pickMessage();
    container.appendChild(el);

    const anchor = placeNonOverlapping(el);
    requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));

    if (!prefersReduced) {
      (function loop(){
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
            el.style.left = `${nx}px`;
            el.style.top  = `${ny}px`;
            el.classList.remove('fh-bubble--out');
            requestAnimationFrame(()=> el.classList.add('fh-bubble--in'));
            loop();
          }, { once: true });
        }, visibleMs);
      })();
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

/* -------------------- навигация и формы -------------------- */
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

/* -------------------- главная: создать/присоединиться -------------------- */
function bindIndexNav() {
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

  const form      = document.getElementById('join-form');
  const joinBtn   = document.getElementById('join-btn');
  const joinInput = document.getElementById('join-code');

  const goJoin = () => {
    const raw  = (joinInput?.value || '').trim();
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g,'');
    if (!/^[A-Z0-9]{6}$|^\d{6}$/.test(code)) {
      if (joinInput) {
        joinInput.classList.add('input-error');
        setTimeout(()=> joinInput.classList.remove('input-error'), 800);
        joinInput.focus();
        joinInput.select?.();
      }
      return;
    }
    window.location.href = `/join.html?code=${encodeURIComponent(code)}`;
  };

  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); goJoin(); });
  if (joinBtn) joinBtn.addEventListener('click', goJoin);
}

/* -------------------- join.html -------------------- */
function bindJoinPage() {
  const params = new URLSearchParams(location.search);
  const codeParam  = (params.get('code') || '').toString().trim().toUpperCase();
  const eventIdParam = params.get('event') ? Number(params.get('event')) : null;

  const nameInput = document.querySelector('#join-name, [name="name"], #guestName');
  const btnJoin   = document.getElementById('btn-join') || document.getElementById('joinSubmit');
  const statusWrap= document.getElementById('join-status-wrap') || document;
  const errorBox  = document.getElementById('join-error') || document.getElementById('joinError');
  const codeHolder= document.getElementById('join-code-text') || document.getElementById('evCode');

  if (codeHolder && codeParam) codeHolder.textContent = codeParam;
  if (!nameInput || !btnJoin) return;

  let picked = 'yes';
  statusWrap.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-rsvp]');
    if (!b) return;
    picked = b.getAttribute('data-rsvp') || picked;
    [...statusWrap.querySelectorAll('[data-rsvp]')].forEach(x=>x.classList.toggle('is-active', x===b));
  });

  async function findEvent() {
    try {
      if (eventIdParam) {
        const { data, error } = await supa
          .from('events')
          .select('id, code, join_code, title')
          .eq('id', eventIdParam)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      if (codeParam) {
        const code = codeParam.replace(/[^A-Z0-9]/g, '');
        const { data, error } = await supa
          .from('events')
          .select('id, code, join_code, title')
          .or(`code.eq.${code},join_code.eq.${code}`)
          .maybeSingle();
        if (error) throw error;
        return data;
      }
      return null;
    } catch (e) {
      console.error('[join] findEvent error:', e);
      return null;
    }
  }

  btnJoin.addEventListener('click', async ()=>{
    const name = (nameInput.value || '').trim();
    if (!name) { nameInput.focus(); return; }
    if (errorBox) errorBox.textContent = '';

    const ev = await findEvent();
    if (!ev) {
      if (errorBox) errorBox.textContent = 'Событие с таким кодом не найдено.';
      return;
    }

    try {
      const { error } = await supa.from('rsvps').insert({
        event_id: ev.id,
        user_name: name,
        status: picked
      });
      if (error) {
        console.error('[join] insert rsvp error:', error);
        errorBox && (errorBox.textContent = error.message || 'Ошибка присоединения. Попробуйте позже.');
        return;
      }

      // Сохраним драфт события для следующих страниц
      try {
        const draft = {
          id: ev.id,
          code: ev.code || ev.join_code || codeParam || '',
          title: ev.title || 'Событие',
          lastJoinName: name
        };
        sessionStorage.setItem('fh:draftEvent', JSON.stringify(draft));
        localStorage.setItem('fh:lastEventId', String(ev.id));
      } catch {}

      // === ГОСТЬ: перенаправляем на страницу бронирования (таблица) ===
      const codeForUrl = encodeURIComponent(ev.code || ev.join_code || codeParam || '');
      const claimUrl = `/wishlist-claim.html?event=${ev.id}&code=${codeForUrl}&from=join`;

      try {
        const head = await fetch('/wishlist-claim.html', { method: 'HEAD' });
        if (head.ok) {
          window.location.href = claimUrl;
        } else {
          window.location.href = `/lobby.html?event=${ev.id}&code=${codeForUrl}`;
        }
      } catch {
        window.location.href = `/lobby.html?event=${ev.id}&code=${codeForUrl}`;
      }
    } catch (err) {
      console.error('[join] insert rsvp exception:', err);
      errorBox && (errorBox.textContent = 'Ошибка присоединения. Попробуйте позже.');
    }
  });
}

/* -------------------- wishlist bridge -------------------- */
function bindWishlistBridge() {
  if (!/\/wishlist\.html/i.test(location.pathname)) return;

  const getDraft = () => { try { return JSON.parse(sessionStorage.getItem('fh:draftEvent')||'{}'); } catch { return {}; } };
  const setDraft = (d) => { try { sessionStorage.setItem('fh:draftEvent', JSON.stringify(d)); } catch {} };

  const listEl = document.getElementById('wishlist-box');
  const form   = document.getElementById('form-wish-add');
  const done   = document.getElementById('btn-wishlist-done');
  const back   = document.getElementById('btn-wishlist-cancel');

  // Правильная ссылка «К событию»
  const linkLobby = document.getElementById('link-to-lobby');
  if (linkLobby) {
    const d = getDraft();
    if (d?.id)       linkLobby.href = `/lobby.html?event=${encodeURIComponent(d.id)}`;
    else if (d?.code)linkLobby.href = `/lobby.html?code=${encodeURIComponent(d.code)}`;
  }

  if (form) form.addEventListener('submit', () => { /* страница сама отрисует */ });

  const goLobbyWithParams = () => {
    const d = getDraft();
    const sp = new URLSearchParams();
    if (d?.id) sp.set('event', d.id);
    else if (d?.code) sp.set('code', String(d.code));
    location.href = '/lobby.html' + (sp.toString() ? `?${sp.toString()}` : '');
  };

  const syncFromDOMToDraft = () => {
    try {
      const d = getDraft();
      if (listEl) {
        const chips = [...listEl.querySelectorAll('.chip')];
        if (chips.length) {
          d.wishlist = chips.map(ch => {
            const a = ch.querySelector('a');
            return a ? { title: a.textContent.trim(), url: a.getAttribute('href') } :
                       { title: ch.firstChild?.textContent?.trim() || '', url: '' };
          }).filter(x => x.title);
        }
      }
      setDraft(d);
    } catch {}
  };

  done && done.addEventListener('click', () => { syncFromDOMToDraft(); goLobbyWithParams(); });
  back && back.addEventListener('click', goLobbyWithParams);
}

/* -------------------- lobby: подставить ?event/?code из драфта при пустом URL -------------------- */
function ensureLobbyParamsFromDraft() {
  if (!/\/lobby\.html/i.test(location.pathname)) return;

  const qs = new URLSearchParams(location.search);
  if (qs.has('event') || qs.has('code')) return;

  try {
    const draft = JSON.parse(sessionStorage.getItem('fh:draftEvent')||'{}');
    const sp = new URLSearchParams();
    if (draft?.id) sp.set('event', draft.id);
    else if (draft?.code) sp.set('code', String(draft.code));
    if ([...sp].length) history.replaceState(null,'', location.pathname + '?' + sp.toString());
  } catch {}
}

/* -------------------- init -------------------- */
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
  bindTabs();
  bindAuthForms();
  bindIndexNav();
  bindJoinPage();
  bindWishlistBridge();
  ensureLobbyParamsFromDraft();
  bootBubbles();

  const session = await ensureSession();
  if (session) {
    document.getElementById('screen-auth')?.remove();
    showScreen('screen-home');
  } else {
    showScreen('screen-auth');
  }
});
