import { supa, getSession, onAuthState, signIn, signUpWithNickname, signOut, getProfile, joinEvent } from './api.js';

const LINKS = {
  home: '/FroggyHub/index.html',
  menu: '/FroggyHub/lobby.html',
  profile: '/FroggyHub/profile.html',
};

const elTabs   = document.querySelectorAll('[data-auth-tab]');
const panes    = document.querySelectorAll('.auth-pane[data-pane]');
const formLogin  = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const errBox   = document.getElementById('auth-error');

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-auth-tab]');
  if (!t) return;
  const target = t.getAttribute('data-auth-tab');
  for (const b of elTabs) b.classList.toggle('is-active', b === t);
  for (const p of panes) {
    const on = p.dataset.pane === target;
    p.hidden = !on;
    p.classList.toggle('visible', on);
  }
  if (errBox) { errBox.textContent = ''; errBox.hidden = true; }
});

formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = (formLogin.nickname.value || '').trim();
  const password = formLogin.password.value;
  try {
    const r = await signIn({ login: nickname, password });
    if (!r) throw new Error('Не удалось войти');
    location.href = '/FroggyHub/lobby.html';
  } catch (err) {
    if (errBox) { errBox.textContent = err.message || 'Ошибка входа'; errBox.hidden = false; }
  }
});

formSignup?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = (formSignup.nickname.value || '').trim();
  const email    = (formSignup.email.value || '').trim();
  const password = formSignup.password.value;
  try {
    const r = await signUpWithNickname({ nickname, email, password });
    if (r?.error) throw r.error;
    location.href = '/FroggyHub/lobby.html';
  } catch (err) {
    if (errBox) { errBox.textContent = err.message || 'Ошибка регистрации'; errBox.hidden = false; }
  }
});

function setAuthState(isAuthed) {
  document.body.classList.toggle('authed', !!isAuthed);
  document.body.classList.toggle('guest', !isAuthed);
  for (const el of document.querySelectorAll('[data-auth-only]')) el.hidden = !isAuthed;
  for (const el of document.querySelectorAll('[data-guest-only]')) el.hidden = !!isAuthed;
}

function wireNav() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const key = btn.getAttribute('data-link');
    const href = LINKS[key];
    if (href) { e.preventDefault(); location.href = href; }
  });
}
// === Floating Message Chips ===
const FH_MESSAGES = [
  "Я приду к 19:00 ✨", "Я возьму пиццу 🍕", "Кто возьмёт колу? 🥤",
  "Ребят, постучите в дверь 🚪", "Буду позже 🙈", "Добавил плейлист 🎶",
  "Кто возьмет настолки? 🎲", "Буду через 15 минут ⏳", "Я за пивом 🍺",
  "Буду online 💻", "Встречаемся у метро 🚉", "Я за мороженым 🍦",
  "Принесу колонку 📢", "Сделаем фото 📸", "Не забудьте зарядки 🔌",
  "Привезу попкорн 🍿", "Подготовлю викторину ❓", "Нужен штопор?",
  "Устроим караоке", "Кто возьмет тарелки?", "Заберу пиццу по пути",
  "Я за салатом", "Буду с +1", "Берите тёплые вещи", "Давайте играть в мафию",
  "Принесу проектор", "У меня есть проектор", "Привезу настольный футбол",
  "Привезу фрукты", "Кто за лимонадом?", "Друзья, до встречи",
  "У кого есть карты?", "Привезу геймпад", "Я за хлопьями",
  "Я возьму сок", "Приеду на час раньше", "Кто возьмёт кофе?",
  "Где паркуемся? 🅿️"
];

let fhCloudsRoot = null;
let chips = [];
let rafId = 0;
let vw = 0;
let vh = 0;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

function ensureCloudsRoot() {
  if (!fhCloudsRoot) {
    fhCloudsRoot = document.getElementById('fh-message-clouds');
    if (!fhCloudsRoot) {
      fhCloudsRoot = document.createElement('div');
      fhCloudsRoot.id = 'fh-message-clouds';
      fhCloudsRoot.setAttribute('aria-hidden', 'true');
      fhCloudsRoot.style.pointerEvents = 'none';
      document.body.prepend(fhCloudsRoot);
    }
  }
  return fhCloudsRoot;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnChips(count = null) {
  const root = ensureCloudsRoot();
  if (!root) return;
  chips = [];
  root.innerHTML = '';

  vw = window.innerWidth;
  vh = window.innerHeight;

  const targetCount = count !== null ? count : Math.min(
    FH_MESSAGES.length,
    vw < 420 ? 10 : vw < 768 ? 16 : 24
  );

  const shuffled = [...FH_MESSAGES].sort(() => Math.random() - 0.5).slice(0, targetCount);

  shuffled.forEach(text => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = text;
    root.appendChild(el);

    const rect = el.getBoundingClientRect();
    const chip = {
      el,
      w: rect.width,
      h: rect.height,
      x: rand(20, vw - rect.width - 20),
      y: rand(20, vh - rect.height - 20),
      vx: rand(-0.08, 0.08),
      vy: rand(-0.08, 0.08)
    };

    chips.push(chip);
    el.style.transform = `translate3d(${chip.x}px, ${chip.y}px, 0)`;
  });
}

function updateChips() {
  const borderMargin = 20;

  chips.forEach(chip => {
    chip.x += chip.vx;
    chip.y += chip.vy;

    if (chip.x <= borderMargin || chip.x + chip.w >= vw - borderMargin) {
      chip.vx *= -1;
      chip.x = Math.max(borderMargin, Math.min(chip.x, vw - chip.w - borderMargin));
    }

    if (chip.y <= borderMargin || chip.y + chip.h >= vh - borderMargin) {
      chip.vy *= -1;
      chip.y = Math.max(borderMargin, Math.min(chip.y, vh - chip.h - borderMargin));
    }

    chip.el.style.transform = `translate3d(${chip.x}px, ${chip.y}px, 0)`;
  });

  for (let i = 0; i < chips.length; i++) {
    for (let j = i + 1; j < chips.length; j++) {
      const a = chips[i];
      const b = chips[j];

      if (a.x < b.x + b.w && a.x + a.w > b.x &&
          a.y < b.y + b.h && a.y + a.h > b.y) {
        [a.vx, b.vx] = [b.vx, a.vx];
        [a.vy, b.vy] = [b.vy, a.vy];
      }
    }
  }
}

function animate() {
  updateChips();
  rafId = requestAnimationFrame(animate);
}

function startChips() {
  stopChips();
  if (REDUCED_MOTION) return;
  spawnChips();
  rafId = requestAnimationFrame(animate);
}

function stopChips() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    spawnChips(chips.length);
  }, 250);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopChips();
  } else {
    startChips();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(startChips, 100);
});

window.FloatingChips = { start: startChips, stop: stopChips };

async function boot() {
  wireNav();

  const session = await getSession();
  setAuthState(!!session);
  if (!session && !location.pathname.endsWith('/index.html')) {
    location.href = LINKS.home;
    return;
  }
  onAuthState((sess) => setAuthState(!!sess));

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="logout"]');
    if (!btn) return;
    await signOut();
    location.href = LINKS.home;
  });

  document.addEventListener('click', async (e) => {
    if (e.target?.id !== 'btnJoin') return;
    const code = document.querySelector('#joinCode')?.value?.trim();
    if (!code || code.length < 6) return alert('Введите 6-значный код');
    try {
      const res = await joinEvent({ code });
      if (res?.success && res?.url) {
        location.href = res.url;
      } else {
        alert(res?.error || 'Не удалось присоединиться');
      }
    } catch (err) {
      alert(err.message || 'Ошибка');
    }
  });

  if (location.pathname.endsWith('/profile.html')) {
    const p = await getProfile();
    if (p) {
      document.getElementById('profile-nickname')?.replaceChildren(document.createTextNode(p.nickname ?? '—'));
      document.getElementById('profile-email')?.replaceChildren(document.createTextNode(p.email ?? '—'));
      document.getElementById('profile-created')?.replaceChildren(document.createTextNode(p.created_at?.slice(0,10) ?? '—'));
    }
  }
}

document.addEventListener('DOMContentLoaded', boot);

