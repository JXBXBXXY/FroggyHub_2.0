// js/app.js
import {
  supa,
  getSession,
  signIn,
  signUpWithNickname,
  resetPassword,
  signOut,
} from './api.js';

window.supa = supa; // для отладки в консоли

/* =========================
   Плавающие «смс»-чипы сзади
   ========================= */
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
  'Встречаемся у метро 🚉','Я возьму мороженое 🍦','Поставлю плейлист вечера 🎵','Привезу настольный хоккей 🏒','Я беру карты Таро 🃏',
  'Прихвачу селфи-палку 🤳','Запасуся маршмеллоу 🍡','Буду на самокате 🛴','Захвачу настольный дартс 🎯','У кого есть мяч? 🏀',
  'Привезу лампу лаву 🪔','Я с домашним лимонадом 🍹','Захвачу гитару-бас 🎸','Принесу плейстейшен 🎮','Кто возьмёт микрофон? 🎙️',
  'Я куплю фейерверки 🎆','Привезу попкорн 🍿','Зайду за напитками 🍻','Подготовлю викторину ❓','Привезу селфи-зону 📸',
  'Захвачу набор для рисования 🎨','Кто принесёт настольные игры? 🎲'
];

const MAX_CHIPS = 20;
const FH_PLACE_TRIES = 40;
const FH_MIN_DIST = 120;
const FH_MARGIN = 20;
const FH_MIN_SPEED = 0.045;
const FH_MAX_SPEED = 0.09;
const FH_JITTER = 0.00012;
const FH_CORNER_KICK = 0.12;

let fhCloudsRoot = null;
let fhChips = [];
let fhAnimId = 0;

const rand  = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

function ensureCloudsRoot() {
  if (fhCloudsRoot && document.body.contains(fhCloudsRoot)) return fhCloudsRoot;
  if (fhCloudsRoot?.parentNode) fhCloudsRoot.parentNode.removeChild(fhCloudsRoot);
  fhCloudsRoot = document.createElement('div');
  fhCloudsRoot.id = 'fh-message-clouds';
  fhCloudsRoot.setAttribute('aria-hidden', 'true');
  fhCloudsRoot.style.pointerEvents = 'none';
  // ставим ПЕРЕД всем UI, чтобы оказался НИЖЕ по z-index (у слоя z-index:0 в CSS)
  document.body.prepend(fhCloudsRoot);
  return fhCloudsRoot;
}

function spawnChips() {
  const root = ensureCloudsRoot();
  if (fhChips.length) { startFloat(); return; }

  const pool = Array.isArray(FH_MESSAGES) ? [...FH_MESSAGES] : [];
  if (!pool.length) return;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const list = pool.slice(0, MAX_CHIPS);

  const W = innerWidth, H = innerHeight;

  function canPlace(cx, cy, w, h) {
    if (cx - w/2 < FH_MARGIN || cy - h/2 < FH_MARGIN) return false;
    if (cx + w/2 > W - FH_MARGIN || cy + h/2 > H - FH_MARGIN) return false;
    for (const c of fhChips) {
      const dx = cx - (c.x + c.w/2);
      const dy = cy - (c.y + c.h/2);
      if (dx*dx + dy*dy < FH_MIN_DIST*FH_MIN_DIST) return false;
    }
    return true;
  }

  function nonZeroVelocity() {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(FH_MIN_SPEED, FH_MAX_SPEED);
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }

  list.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = msg;
    root.appendChild(el);

    const r = el.getBoundingClientRect();
    const w = r.width  || 140;
    const h = r.height || 40;

    let placed = false, x = FH_MARGIN, y = FH_MARGIN;
    for (let t = 0; t < FH_PLACE_TRIES && !placed; t++) {
      const cx = rand(FH_MARGIN + w/2, W - FH_MARGIN - w/2);
      const cy = rand(FH_MARGIN + h/2, H - FH_MARGIN - h/2);
      if (canPlace(cx, cy, w, h)) {
        x = cx - w/2; y = cy - h/2; placed = true;
      }
    }
    if (!placed) {
      x = clamp(rand(FH_MARGIN, W - w - FH_MARGIN), FH_MARGIN, W - w - FH_MARGIN);
      y = clamp(rand(FH_MARGIN, H - h - FH_MARGIN), FH_MARGIN, H - h - FH_MARGIN);
    }

    const { vx, vy } = nonZeroVelocity();
    fhChips.push({ el, x, y, vx, vy, w, h, stuck: 0 });
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  startFloat();
}

function startFloat() {
  stopFloat();
  let last = performance.now();

  function tick(now) {
    const dt = now - last; last = now;
    const W = innerWidth, H = innerHeight;

    for (const c of fhChips) {
      c.vx += rand(-FH_JITTER, FH_JITTER) * dt;
      c.vy += rand(-FH_JITTER, FH_JITTER) * dt;

      const sp = Math.hypot(c.vx, c.vy);
      if (sp < FH_MIN_SPEED) {
        const a = rand(0, Math.PI*2);
        c.vx = Math.cos(a) * FH_MIN_SPEED;
        c.vy = Math.sin(a) * FH_MIN_SPEED;
      } else if (sp > FH_MAX_SPEED) {
        c.vx = (c.vx / sp) * FH_MAX_SPEED;
        c.vy = (c.vy / sp) * FH_MAX_SPEED;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (c.x < FH_MARGIN)                   { c.x = FH_MARGIN;                   c.vx = Math.abs(c.vx) + rand(0, FH_JITTER*150); }
      if (c.y < FH_MARGIN)                   { c.y = FH_MARGIN;                   c.vy = Math.abs(c.vy) + rand(0, FH_JITTER*150); }
      if (c.x > W - c.w - FH_MARGIN)         { c.x = W - c.w - FH_MARGIN;         c.vx = -Math.abs(c.vx) - rand(0, FH_JITTER*150); }
      if (c.y > H - c.h - FH_MARGIN)         { c.y = H - c.h - FH_MARGIN;         c.vy = -Math.abs(c.vy) - rand(0, FH_JITTER*150); }

      const nearLeft   = c.x <= FH_MARGIN + 1;
      const nearRight  = c.x >= W - c.w - FH_MARGIN - 1;
      const nearTop    = c.y <= FH_MARGIN + 1;
      const nearBottom = c.y >= H - c.h - FH_MARGIN - 1;
      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        c.stuck += dt;
        if (c.stuck > 100) {
          c.vx += (nearLeft ? FH_CORNER_KICK : -FH_CORNER_KICK);
          c.vy += (nearTop  ? FH_CORNER_KICK : -FH_CORNER_KICK);
          c.stuck = 0;
        }
      } else {
        c.stuck = Math.max(0, c.stuck - dt);
      }

      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }

    fhAnimId = requestAnimationFrame(tick);
  }

  fhAnimId = requestAnimationFrame(tick);
}

function stopFloat() { if (fhAnimId) cancelAnimationFrame(fhAnimId); fhAnimId = 0; }

addEventListener('resize', () => {
  const W = innerWidth, H = innerHeight;
  fhChips.forEach(c => {
    c.x = clamp(c.x, FH_MARGIN, W - c.w - FH_MARGIN);
    c.y = clamp(c.y, FH_MARGIN, H - c.h - FH_MARGIN);
    c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
  });
}, { passive:true });

/* ======================
   Экраны и навигация
   ====================== */

const screens = {
  home:    document.getElementById('screen-home'),
  auth:    document.getElementById('screen-auth'),
  profile: document.getElementById('screen-profile'),
  hub:     document.getElementById('screen-hub'),
};

function showScreen(key) {
  Object.values(screens).forEach(el => el && el.classList.add('hidden'));
  const el = screens[key];
  if (el) el.classList.remove('hidden');
}

// делегирование по атрибуту data-link="auth|home|profile|hub"
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  const key = a.getAttribute('data-link');
  if (key) showScreen(key);
});

/* ======================
   Авторизация
   ====================== */

async function requireAuthOr(action) {
  const session = await getSession();
  if (!session) {
    showScreen('auth');
    return;
  }
  action();
}

// формы логина / регистрации / сброса
const formLogin  = document.getElementById('formLogin');
const formSignup = document.getElementById('formSignup');
const formReset  = document.getElementById('formReset');

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = formLogin.email.value.trim();
    const password = formLogin.password.value;
    try {
      await signIn(email, password);
      showScreen('home');
    } catch {
      alert('Нужны публичные ключи Supabase (см. README/настройки сайта).');
    }
  });
}

if (formSignup) {
  formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = formSignup.email.value.trim();
    const password = formSignup.password.value;
    const nickname = formSignup.nickname.value.trim();
    try {
      await signUpWithNickname(email, password, nickname);
      showScreen('home');
    } catch {
      alert('Нужны публичные ключи Supabase (см. README/настройки сайта).');
    }
  });
}

if (formReset) {
  formReset.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = formReset.email.value.trim();
    try {
      await resetPassword(email);
      alert('Если почта найдена — письмо отправлено.');
    } catch {
      alert('Нужны публичные ключи Supabase (см. README/настройки сайта).');
    }
  });
}

// выход
const btnLogout = document.querySelector('[data-action="logout"]');
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    await signOut();
    showScreen('auth');
  });
}

/* ======================
   Кнопки «Создать/Присоединиться»
   ====================== */

const createBtn = document.querySelector('[data-action="create-event"]');
if (createBtn) {
  createBtn.addEventListener('click', () => {
    requireAuthOr(() => {
      // тут можешь показать форму создания события / перейти на экран
      showScreen('hub');
    });
  });
}

const joinBtn = document.querySelector('[data-action="join-event"]');
if (joinBtn) {
  joinBtn.addEventListener('click', () => {
    requireAuthOr(() => {
      showScreen('hub'); // или открыть модал ввода кода, если есть
    });
  });
}

/* ======================
   Старт приложения
   ====================== */

document.addEventListener('DOMContentLoaded', async () => {
  // фоновые чипы
  try { spawnChips(); } catch (e) { console.warn('[chips]', e); }

  // показать нужный экран
  const session = await getSession();
  if (!session) showScreen('auth');
  else showScreen('home');
});
