// app.js
import { supa } from './api.js';

/* -------------------- среда/флаги -------------------- */
const prefersReduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const hwThreads = navigator.hardwareConcurrency || 4;
const isLowEnd = hwThreads <= 4 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const DPR = window.devicePixelRatio || 1;

/* ----- стабильные 100vh на мобильных (iOS/Android адресная строка) ----- */
function setVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVhVar();
window.addEventListener('resize', setVhVar, { passive: true });
window.addEventListener('orientationchange', setVhVar, { passive: true });

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

const pickMessage = () => FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
const debounce = (fn, wait=100) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; };
const rectsOverlap=(a,b,p=0)=>!(a.right+p<b.left||a.left-p>b.right||a.bottom+p<b.top||a.top-p>b.bottom);

/** количество пузырей под устройство/мощность */
const desiredBubbleCount = () => {
  const area = Math.max(1, (innerWidth * innerHeight) / (DPR ** 0.6));
  const base = Math.round(area / 14000);
  const capDesktop = 60;
  const capMobile  = 28;
  let n = Math.min(isTouchDevice ? capMobile : capDesktop, Math.max(12, base));
  if (prefersReduced) n = Math.min(n, 12);
  if (isLowEnd) n = Math.round(n * 0.6);
  return Math.max(8, n);
};

/* ---------- безопасный контроллер пузырей (без утечек) ---------- */
const BubbleController = (() => {
  let timers = new Set();
  let mountedRoot = null;

  const clearTimers = () => {
    timers.forEach(id => clearTimeout(id));
    timers.clear();
  };

  const destroy = () => {
    clearTimers();
    if (mountedRoot) mountedRoot.innerHTML = '';
    mountedRoot = null;
  };

  const schedule = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const spawn = (container, count) => {
    destroy();
    if (!container) return;
    mountedRoot = container;

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

      const loop = () => {
        if (!el.isConnected || document.hidden || prefersReduced) {
          schedule(() => {
            if (!el.isConnected) return;
            el.textContent = pickMessage();
            loop();
          }, 8000 + Math.random()*3000);
          return;
        }

        const visibleMs = 3000 + Math.random() * 1000;
        schedule(() => {
          if (!el.isConnected) return;
          el.classList.remove('fh-bubble--in');
          el.classList.add('fh-bubble--out');

          const onEnd = () => {
            if (!el.isConnected) return;
            el.removeEventListener('transitionend', onEnd);
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
          };

          el.addEventListener('transitionend', onEnd, { once: true });
        }, visibleMs);
      };

      loop();
      placed.push(el);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!mountedRoot) return;
    if (!document.hidden) {
      spawn(mountedRoot, desiredBubbleCount());
    } else {
      clearTimers();
    }
  });

  window.addEventListener('pagehide', destroy, { passive: true });

  return { spawn, destroy };
})();

/** Надёжная раскладка пузырьков — публичная оболочка */
function spawnBubbles(container, count) {
  BubbleController.spawn(container, count);
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

  tabLogin.addEventListener('click', () => activate('login'), { passive: true });
  tabReg.addEventListener('click', () => activate('register'), { passive: true });
}

function bindAuthForms() {
  if (window.FH?.__authBound) return;
  window.FH = window.FH || {};
  window.FH.__authBound = true;

  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const showMsg = (el, msg, ok=false) => {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('error', !ok);
    el.classList.toggle('hint', ok);
  };

  // --- Вход
  if (loginForm) {
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(loginForm);
      const emailRaw = (fd.get('email') || '').toString().trim();
      const nickname = (fd.get('nickname') || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      const statusEl = document.getElementById('login-status');

      if (!emailRaw && !nickname) return showMsg(statusEl, 'Введите e-mail или никнейм');
      if (!password) return showMsg(statusEl, 'Введите пароль');

      const email = emailRaw || (nickname ? `${nickname}@local` : '');
      showMsg(statusEl, 'Входим…', true);

      try {
        const { data, error } = await supa.auth.signInWithPassword({ email, password });
        if (error) return showMsg(statusEl, error.message || 'Не удалось войти');
        setSavedSession({ user: data.session.user, access_token: data.session.access_token });
        document.getElementById('screen-auth')?.remove();
        showScreen('screen-home');
      } catch (e) {
        showMsg(statusEl, e.message || 'Ошибка входа');
      }
    });
  }

  // --- Регистрация
  if (signupForm) {
    signupForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(signupForm);
      const email = (fd.get('email') || '').toString().trim();
      const nickname = (fd.get('nickname') || '').toString().trim();
      const password = (fd.get('password') || '').toString();
      const password2 = (fd.get('password2') || '').toString();
      const statusEl = document.getElementById('reg-status');

      if (!email)  return showMsg(statusEl, 'Укажите e-mail');
      if (!/\S+@\S+\.\S+/.test(email)) return showMsg(statusEl, 'Неверный формат e-mail');
      if (!nickname || nickname.length < 2) return showMsg(statusEl, 'Укажите ник (минимум 2 символа)');
      if (password.length < 6) return showMsg(statusEl, 'Пароль минимум 6 символов');
      if (password !== password2) return showMsg(statusEl, 'Пароли не совпадают');

      showMsg(statusEl, 'Создаём аккаунт…', true);

      try {
        const { data, error } = await supa.auth.signUp({
          email,
          password,
          options: { data: { nickname } }
        });
        if (error) return showMsg(statusEl, error.message || 'Не удалось зарегистрироваться');

        const needsConfirm = !data.user?.email_confirmed_at;
        if (needsConfirm) {
          return showMsg(statusEl, 'Готово! Подтвердите e-mail по ссылке из письма, затем войдите.', true);
        }

        const r = await supa.auth.signInWithPassword({ email, password });
        if (r.error) return showMsg(statusEl, r.error.message || 'Не удалось войти после регистрации');
        setSavedSession({ user: r.data.session.user, access_token: r.data.session.access_token });
        document.getElementById('screen-auth')?.remove();
        showScreen('screen-home');
      } catch (e) {
        showMsg(statusEl, e.message || 'Ошибка регистрации');
      }
    });
  }
}

/* -------------------- главная: создать/присоединиться -------------------- */
function bindIndexNav() {
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest?.('[data-go]');
    if (!navBtn) return;
    e.preventDefault();
    const to = navBtn.getAttribute('data-go');
    const mode = navBtn.getAttribute('data-mode') || '';
    if (to === 'app' && mode === 'create') {
// try { localStorage.setItem('fh:onboarded','1'); } catch {}
// ↑ закомментируй эту строку      window.location.href = '/event-edit.html';
      return;
    }
  }, { passive: false });

  const form      = document.getElementById('join-form');
  const joinBtn   = document.getElementById('join-btn');
  const joinInput = document.getElementById('join-code');

  if (joinInput) {
    joinInput.setAttribute('inputmode', 'text'); // буквенно-цифровой код
    joinInput.setAttribute('autocomplete', 'one-time-code');
    joinInput.setAttribute('enterkeyhint', 'go');
    joinInput.setAttribute('autocapitalize', 'characters');
  }

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

  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); goJoin(); }, { passive: false });
  if (joinBtn) joinBtn.addEventListener('click', goJoin, { passive: true });
  joinInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); goJoin(); } }, { passive: false });
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

  nameInput.setAttribute('autocomplete', 'name');
  nameInput.setAttribute('autocapitalize', 'words');
  nameInput.setAttribute('enterkeyhint', 'done');

  let picked = 'yes';
  statusWrap.addEventListener('click', (e)=>{
    const b = e.target.closest?.('[data-rsvp]');
    if (!b) return;
    picked = b.getAttribute('data-rsvp') || picked;
    [...statusWrap.querySelectorAll('[data-rsvp]')].forEach(x=>x.classList.toggle('is-active', x===b));
  }, { passive: true });

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
        if (errorBox) errorBox.textContent = error.message || 'Ошибка присоединения. Попробуйте позже.';
        return;
      }

      try {
        const draft = {
          id: ev.id,
          code: ev.code || ev.join_code || codeParam || '',
          title: ev.title || 'Событие',
          lastJoinName: name
        };
        sessionStorage.setItem('fh:draftEvent', JSON.stringify(draft));
        sessionStorage.setItem('fh:guestName', name);
        localStorage.setItem('fh:lastEventId', String(ev.id));
      } catch {}

      const codeForUrl = encodeURIComponent(ev.code || ev.join_code || codeParam || '');
      const nameForUrl = encodeURIComponent(name);
      const claimUrl =
        `/wishlist-claim.html?event=${ev.id}&code=${codeForUrl}` +
        `&guest=${nameForUrl}&name=${nameForUrl}&guestName=${nameForUrl}&from=join`;

      try {
        const head = await fetch('/wishlist-claim.html', { method: 'HEAD' });
        if (head.ok) window.location.href = claimUrl;
        else window.location.href = `/lobby.html?event=${ev.id}&code=${codeForUrl}`;
      } catch {
        window.location.href = `/lobby.html?event=${ev.id}&code=${codeForUrl}`;
      }
    } catch (err) {
      console.error('[join] insert rsvp exception:', err);
      if (errorBox) errorBox.textContent = 'Ошибка присоединения. Попробуйте позже.';
    }
  }, { passive: true });
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

  const linkLobby = document.getElementById('link-to-lobby');
  if (linkLobby) {
    const d = getDraft();
    if (d?.id)       linkLobby.href = `/lobby.html?event=${encodeURIComponent(d.id)}`;
    else if (d?.code)linkLobby.href = `/lobby.html?code=${encodeURIComponent(d.code)}`;
  }

  if (form) form.addEventListener('submit', () => {}, { passive: true });

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

  done && done.addEventListener('click', () => { syncFromDOMToDraft(); goLobbyWithParams(); }, { passive: true });
  back && back.addEventListener('click', goLobbyWithParams, { passive: true });
}

/* -------------------- lobby: автоподстановка параметров из драфта -------------------- */
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

/* -------------------- PROFILE: RSVP viewer -------------------- */
function bindProfileRsvpViewer() {
  if (!/\/profile\.html/i.test(location.pathname)) return;

  // строки событий в профиле (учитываем оба класса и data-атрибут)
  const rows = [...document.querySelectorAll('.event-card, .event-item, [data-event-id]')];

  const getEventId = (row) => {
    const d = row.dataset?.eventId;
    if (d && String(d).trim()) return Number(d);
    const link = row.querySelector('a[href*="event="], a[href*="/lobby"]');
    if (link) {
      try {
        const u = new URL(link.href, location.origin);
        const id = u.searchParams.get('event');
        if (id) return Number(id);
      } catch {}
    }
    return null;
  };

  if (!rows.length) return;

  rows.forEach(row => {
    const evId = getEventId(row);
    if (!evId) return;
    if (row.querySelector('[data-action="show-rsvps"]')) return;

    const actions = row.querySelector('.profile-actions, .event-actions') || row;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-ghost';
    btn.type = 'button';
    btn.textContent = 'Гости';
    btn.dataset.action = 'show-rsvps';
    btn.dataset.eventId = String(evId);
    actions.appendChild(btn);
  });

  const renderPanel = (evId, groups) => {
    const wrap = document.createElement('div');
    wrap.className = 'glass-section rsvps-panel';
    wrap.dataset.for = String(evId);
    wrap.innerHTML = `
      <div class="section-title">Кто идёт</div>
      <div class="stats">
        <span class="badge yes">Да: ${groups.yes.length}</span>
        <span class="badge maybe">Может быть: ${groups.maybe.length}</span>
        <span class="badge no">Нет: ${groups.no.length}</span>
      </div>
      <div class="guests-columns">
        <div>
          <div class="bubble-head">Да</div>
          <ul class="list">${groups.yes.map(n=>`<li>${n}</li>`).join('') || '<li>—</li>'}</ul>
        </div>
        <div>
          <div class="bubble-head">Может быть</div>
          <ul class="list">${groups.maybe.map(n=>`<li>${n}</li>`).join('') || '<li>—</li>'}</ul>
        </div>
        <div>
          <div class="bubble-head">Нет</div>
          <ul class="list">${groups.no.map(n=>`<li>${n}</li>`).join('') || '<li>—</li>'}</ul>
        </div>
      </div>
    `;
    return wrap;
  };

  const loadRsvps = async (eventId) => {
    try {
      const { data, error } = await supa
        .from('rsvps')
        .select('user_name, status')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const groups = { yes: [], maybe: [], no: [] };
      (data || []).forEach(r => {
        const name = (r.user_name || 'Без имени').trim();
        const key = (r.status || 'maybe').toLowerCase();
        (groups[key] || groups.maybe).push(name);
      });
      return groups;
    } catch (e) {
      console.error('[profile] loadRsvps error', e);
      return { yes: [], maybe: [], no: [] };
    }
  };

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="show-rsvps"]');
    if (!btn) return;

    const row = btn.closest('.event-card, .event-item, [data-event-id]') || btn.parentElement;
    const evId = Number(btn.dataset.eventId || getEventId(row));
    if (!evId || !row) return;

    let panel = row.nextElementSibling;
    if (panel && panel.classList.contains('rsvps-panel')) {
      panel.hidden = !panel.hidden;
      return;
    }

    panel = document.createElement('div');
    panel.className = 'glass-section rsvps-panel';
    panel.innerHTML = '<div class="section-title">Кто идёт</div><div class="hint">Загружаем…</div>';
    row.after(panel);

    const groups = await loadRsvps(evId);
    const fresh = renderPanel(evId, groups);
    panel.replaceWith(fresh);
  }, { passive: true });
}

/* -------------------- First-run hint (ШАГ 1) -------------------- */
function showFirstRunHint() {
  const isHomePath = /\/(index\.html)?$/.test(location.pathname) || location.pathname === '/';
  if (!isHomePath || prefersReduced) return;
  try { if (localStorage.getItem('fh:onboarded')) return; } catch {}

  const startIfReady = () => {
    const home = document.getElementById('screen-home');
    const auth = document.getElementById('screen-auth');
    const homeVisible = !!home && !home.hasAttribute('hidden');
    const authVisible = !!auth && !auth.hasAttribute('hidden');
    const btn = document.getElementById('create-event');
    if (!homeVisible || authVisible || !btn) return false;

    const layer = document.createElement('div');
    layer.className = 'onb-layer';
    layer.innerHTML = `
      <div class="onb-backdrop" data-act="close"></div>
      <div class="onb-spot"></div>
      <div class="onb-card" role="dialog" aria-live="polite">
        <div class="onb-text">Создай событие здесь</div>
        <div class="onb-actions">
          <button class="onb-btn" data-act="close">Понятно</button>
          <button class="onb-btn primary" data-act="go">Создать</button>
        </div>
        <div class="onb-arrow"></div>
      </div>
    `;
    document.body.appendChild(layer);

    const place = () => {
      const r = btn.getBoundingClientRect();
      const spot = layer.querySelector('.onb-spot');
      const card = layer.querySelector('.onb-card');
      const arrow= layer.querySelector('.onb-arrow');
      const pad = 10;

      spot.style.left = `${r.left + window.scrollX - 6}px`;
      spot.style.top  = `${r.top  + window.scrollY - 6}px`;
      spot.style.width = `${r.width + 12}px`;
      spot.style.height= `${r.height+ 12}px`;

      const cw = Math.min(360, Math.max(260, r.width));
      const below = (r.bottom + 16 + 180 < window.scrollY + window.innerHeight);
      card.style.width = `${cw}px`;

      let x = r.left + window.scrollX + (r.width - cw)/2;
      let y = (below ? r.bottom + window.scrollY + pad : r.top + window.scrollY - pad - card.offsetHeight);

      x = Math.max(12 + window.scrollX, Math.min(x, window.scrollX + innerWidth - cw - 12));
      y = Math.max(12 + window.scrollY, Math.min(y, window.scrollY + innerHeight - card.offsetHeight - 12));

      card.style.left = `${x}px`;
      card.style.top  = `${y}px`;

      const ax = r.left + window.scrollX + r.width/2 - 6;
      if (below) {
        arrow.style.left = `${Math.max(x+12, Math.min(ax, x+cw-24))}px`;
        arrow.style.top  = `${y - 6}px`;
        arrow.style.transform = 'rotate(45deg)';
      } else {
        arrow.style.left = `${Math.max(x+12, Math.min(ax, x+cw-24))}px`;
        arrow.style.top  = `${y + card.offsetHeight - 6}px`;
        arrow.style.transform = 'rotate(225deg)';
      }
    };

    const close = (mark=true) => {
      layer.classList.remove('on');
      layer.remove();
      if (mark) { try { localStorage.setItem('fh:onboarded','1'); } catch {} }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      vv?.removeEventListener?.('resize', onResize);
    };

    const onResize = debounce(place, 50);
    window.addEventListener('resize', onResize, { passive:true });
    window.addEventListener('scroll', onResize, { passive:true });
    const vv = window.visualViewport;
    vv?.addEventListener?.('resize', onResize, { passive:true });

    layer.addEventListener('click', (e)=>{
      const act = e.target.closest('[data-act]')?.getAttribute('data-act');
      if (!act) return;
      if (act === 'close') close(true);
      if (act === 'go') { close(true); btn.click(); }
    }, { passive:true });

    btn.addEventListener('click', () => close(true), { once:true, passive:true });

    layer.classList.add('on');
    setTimeout(place, 0);
    return true;
  };

  if (startIfReady()) return;

  const obs = new MutationObserver(() => {
    if (startIfReady()) obs.disconnect();
  });
  obs.observe(document.body, { attributes:true, subtree:true, childList:true });

  setTimeout(() => obs.disconnect(), 10000);
}

/* -------------------- init -------------------- */
function bootBubbles() {
  const root = document.querySelector('.fh-bubbles');
  if (!root) return;

  BubbleController.spawn(root, desiredBubbleCount());

  const onResize = debounce(() => {
    if (!root.isConnected) return;
    BubbleController.spawn(root, desiredBubbleCount());
  }, 200);

  window.addEventListener('resize', onResize, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize, { passive: true });
  }

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    window.addEventListener('pagehide', () => { try { ro.disconnect(); } catch {} }, { passive: true });
  }
}

/* Автопереключатель «мобильной финалки»: центрируем карточку, скрываем часы */
(function forceMobileFinal(){
  const mq = window.matchMedia('(max-width: 900px)');
  const apply = () => document.body.classList.toggle('force-mobile', mq.matches);
  apply();
  mq.addEventListener?.('change', apply);
})();

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

  // >>> запуск тура только когда реально открыт home
  if (!document.getElementById('screen-home')?.hasAttribute('hidden')) {
    window.FH_startSpotlightTour?.();
  }

  // 🔔 ШАГ 1: показать подсказку, если пользователь впервые на главной
  showFirstRunHint();

  /* ---------- AUTOSAVE на финальной странице (лоби/финалка) ---------- */
  (function autosaveFinalOnce(){
    const path = location.pathname;
    if (!/\/(lobby|final|invite|event)\.html$/i.test(path)) return;

    const qs = new URLSearchParams(location.search);
    const evId  = qs.get('event') || '';
    const evCode= qs.get('code')  || '';
    const key   = `fh:autosaved:${evId || evCode || 'draft'}`;

    try { if (localStorage.getItem(key)) return; } catch {}

    const tryAutoClick = () => {
      const btn =
        document.querySelector('[data-autosave="event"]') ||
        [...document.querySelectorAll('button, a[role="button"]')]
          .find(b => /сохранить событие/i.test(b.textContent || ''));

      if (!btn) return false;
      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;

      btn.click?.();
      try { localStorage.setItem(key, '1'); } catch {}
      return true;
    };

    if (tryAutoClick()) return;

    const obs = new MutationObserver(() => { if (tryAutoClick()) obs.disconnect(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => { obs.disconnect(); tryAutoClick(); }, 8000);
  })();

  // подключаем просмотр гостей в профиле (после рендера профиля)
  bindProfileRsvpViewer();
});

/* ===================== SPOTLIGHT TOUR (круглый) ===================== */
(function initFHSpotlightTourStarter(){
  if (window.FH_startSpotlightTour) return;

  const DEBUG_TOUR = false;
  const TOUR_VERSION = 'v1';
  const pageKey = (location.pathname.toLowerCase().replace(/[^\w]+/g, '_') || 'index_html');
  const pageOnceKey = `fh:tour:page:${pageKey}:${TOUR_VERSION}`;
  const log = (...a)=>{ if (DEBUG_TOUR) console.log('[tour]', ...a); }

  function isVisible(el){
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
           cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0;
  }
  function findFirstVisible(selectors){
    const list = (Array.isArray(selectors) ? selectors : String(selectors).split(','))
      .map(s => s.trim()).filter(Boolean);
    for (const sel of list){
      const nodes = document.querySelectorAll(sel);
      for (let i=0;i<nodes.length;i++){
        if (isVisible(nodes[i])) { log('found', sel, nodes[i]); return nodes[i]; }
      }
    }
    return null;
  }

  async function isNewUserWindow() {
    try {
      if (localStorage.getItem(pageOnceKey)) return false;
      if (sessionStorage.getItem('fh:newUserJustSigned')) return true;
      const ts = Number(localStorage.getItem('fh:firstLoginTs') || 0);
      if (!ts) return true;
      return (Date.now() - ts) < 48*3600*1000;
    } catch { return true; }
  }

  function stepsConfigForPath(){
    const S = [];
    const authVisible = !!document.querySelector('#screen-auth:not([hidden])');

    // HOME
    if ((/\/(index\.html)?$/.test(location.pathname) || location.pathname === '/') && !authVisible){
      S.push({ id:'home-create',
        sels: ['[data-tour="home-create"]','[data-onb="create"]','#create-event'],
        text:'Создай событие здесь' });
      S.push({ id:'home-join',
        sels: ['[data-tour="home-join"]','[data-onb="join"]','#join-code','#join-form'],
        text:'Есть код? Введите его здесь, чтобы присоединиться.' });
      S.push({ id:'home-profile',
        sels: ['[data-tour="home-profile"]','#nav-profile','a[href*="profile"]'],
        text:'Ваши события и вишлисты — в профиле.' });
    }

    // LOGIN
    if (/\/login(\.html)?$/i.test(location.pathname)){
      S.push({ id:'login-form', sels:['[data-tour="auth-login"]','#loginForm'], text:'Войдите в аккаунт здесь.' });
      S.push({ id:'login-reg',  sels:['#tab-register','[data-tour="auth-register"]'], text:'Нет аккаунта? Зарегистрируйтесь.' });
    }

    // JOIN
    if (/\/join(\.html)?$/i.test(location.pathname)){
      S.push({ id:'join-name',  sels:['#join-name','[name="name"]','#guestName'], text:'Напишите, как вас подписать в гостях.' });
      S.push({ id:'join-rsvp',  sels:['[data-rsvp]','#join-status-wrap'],       text:'Выберите, пойдёте ли вы на событие.' });
      S.push({ id:'join-go',    sels:['#btn-join','#joinSubmit'],               text:'Готово? Жмите, чтобы присоединиться.' });
    }

    // LOBBY
    if (/\/lobby(\.html)?$/i.test(location.pathname)){
      S.push({ id:'lobby-save', sels:['[data-autosave="event"]','a[role="button"]','button'],
               text:'Сохраните событие, когда всё готово.' });
    }

    // PROFILE
    if (/\/profile(\.html)?$/i.test(location.pathname)){
      S.push({ id:'prof-events', sels:['.event-card','.event-item','[data-event-id]'], text:'Ваши события — здесь.' });
      S.push({ id:'prof-rsvp',   sels:['[data-action="show-rsvps"]'],                   text:'Посмотрите, кто идёт.' });
    }

    log('steps for path', location.pathname, S.map(s=>s.id));
    return S;
  }

  function runTour(steps, doneKey){
    if (!steps.length) return;

    const layer = document.createElement('div');
    layer.className = 'tour-layer';
    layer.innerHTML =
      '<div class="tour-backdrop"></div>' +
      '<div class="tour-card" role="dialog" aria-live="polite">' +
      '  <div class="tour-title"></div>' +
      '  <div class="tour-actions">' +
      '    <button class="tour-btn" data-act="skip">Пропустить</button>' +
      '    <button class="tour-btn primary" data-act="next">Понятно</button>' +
      '  </div>' +
      '  <div class="tour-arrow"></div>' +
      '</div>';
    layer.style.zIndex = '2147483647';
    document.body.appendChild(layer);

    const backdrop = layer.querySelector('.tour-backdrop');
    const card     = layer.querySelector('.tour-card');
    const titleEl  = layer.querySelector('.tour-title');
    const arrow    = layer.querySelector('.tour-arrow');

    // локальная функция плавного «сужения» круга
    function animateSpotlightTo(targetPx){
      const start = Math.max(targetPx * 1.18, targetPx + 40);
      backdrop.style.setProperty('--r', start + 'px');
      requestAnimationFrame(() => {
        backdrop.style.setProperty('--r', targetPx + 'px');
      });
    }

    // «фантом», если не нашли target — центрируем карточку
    const phantom = document.createElement('div');
    phantom.style.cssText = 'position:fixed;left:50%;top:50%;width:1px;height:1px;transform:translate(-50%,-50%);pointer-events:none;';
    document.body.appendChild(phantom);

    let i = -1;
    let currentEl = null;

    function place(){
      if (!currentEl) return;
      const r = currentEl.getBoundingClientRect();
      const x = r.left + window.scrollX + r.width/2;
      const y = r.top  + window.scrollY + r.height/2;
      const radius = Math.round(Math.hypot(r.width, r.height)/2) + 14;

      backdrop.style.setProperty('--x', x+'px');
      backdrop.style.setProperty('--y', y+'px');
      animateSpotlightTo(radius);

      const cw = Math.min(380, Math.max(260, r.width || 320));
      card.style.width = cw+'px';

      const below = (r.bottom + 16 + 160 < window.scrollY + window.innerHeight);
      let px = r.left + window.scrollX + (r.width - cw)/2;
      let py = below ? r.bottom + window.scrollY + 12
                     : r.top + window.scrollY - (card.offsetHeight || 160) - 12;

      if (currentEl === phantom){
        px = window.scrollX + (innerWidth - cw)/2;
        py = window.scrollY + innerHeight*0.65 - (card.offsetHeight || 160)/2;
      }

      px = Math.max(12 + window.scrollX, Math.min(px, window.scrollX + innerWidth - cw - 12));
      py = Math.max(12 + window.scrollY, Math.min(py, window.scrollY + innerHeight - (card.offsetHeight || 160) - 12));

      card.style.left = px+'px';
      card.style.top  = `${py}px`;

      const ax = r.left + window.scrollX + r.width/2 - 6;
      const arrowX = currentEl === phantom ? (px + cw/2 - 6) : Math.max(px+12, Math.min(ax, px+cw-24));
      const arrowY = currentEl === phantom ? (py - 6) : (below ? (py - 6) : (py + card.offsetHeight - 6));
      arrow.style.left = arrowX + 'px';
      arrow.style.top  = arrowY + 'px';
      arrow.style.transform = below ? 'rotate(45deg)' : 'rotate(225deg)';
    }

    function resolveTarget(step, done){
      currentEl = findFirstVisible(step.sels);
      if (currentEl){ place(); return done(); }

      const t0 = performance.now();
      const obs = new MutationObserver(() => {
        currentEl = findFirstVisible(step.sels);
        if (currentEl || performance.now() - t0 > 6000){
          obs.disconnect();
          if (!currentEl) { currentEl = phantom; log('fallback center for step', step.id); }
          place(); done();
        }
      });
      obs.observe(document.body, { childList:true, subtree:true, attributes:true });
    }

    function finish(){
      try { localStorage.setItem(doneKey, '1'); } catch {}
      layer.remove(); phantom.remove();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place);
      document.removeEventListener('click', onDocClick, true);
      log('finish');
    }

    function show(idx){
      i = idx;
      if (i >= steps.length) return finish();
      const step = steps[i];
      titleEl.textContent = step.text;
      layer.classList.add('on');
      backdrop.style.setProperty('--r', '140vh');
      log('show step', i, step.id, step.sels);

      resolveTarget(step, () => {
        requestAnimationFrame(() => requestAnimationFrame(place));
      });
    }

    function onDocClick(e){
      if (e.target.closest('.tour-card') || e.target.closest('.tour-backdrop')) return;
      const step = steps[i];
      if (!step) return;
      if (currentEl !== phantom){
        const hit = step.sels.some(sel => e.target.closest && e.target.closest(sel));
        if (hit) { log('advance by target click'); show(i+1); }
      }
    }

    window.addEventListener('resize', place, { passive:true });
    window.addEventListener('scroll', place, { passive:true });
    document.addEventListener('click', onDocClick, true);

    layer.addEventListener('click', (e)=>{
      const act = e.target.closest('[data-act]')?.getAttribute('data-act');
      if (act === 'skip') return finish();
      if (act === 'next') { log('advance by button'); return show(i+1); }
    }, { passive:true });

    requestAnimationFrame(()=> show(0));
  }

  window.FH_startSpotlightTour = async function startSpotlightTour(){
    try { if (localStorage.getItem(pageOnceKey)) { log('already shown once'); return; } } catch {}
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const okNew = await isNewUserWindow();
    if (!okNew) { log('not a new user window'); return; }

    let steps = stepsConfigForPath();
    const t0 = performance.now();

    if (!steps.length){
      await new Promise((resolve)=>{
        const obs = new MutationObserver(()=>{
          steps = stepsConfigForPath();
          if (steps.length || performance.now()-t0 > 6000){ obs.disconnect(); resolve(); }
        });
        obs.observe(document.body, { childList:true, subtree:true });
      });
      if (!steps.length) { log('no steps after wait'); return; }
    }

    runTour(steps, pageOnceKey);
  };
})();
