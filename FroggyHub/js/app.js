import { supa, signIn, signUpWithNickname, resetPassword } from './api.js';
window.supa = supa;

const FH_MESSAGES = [
  'Я приду к 19:00 ✨',
  'Я возьму пиццу 🍕',
  'Кто возьмёт колу? 🥤',
  'Ребят, постучите в дверь 🚪',
  'Буду позже 🙈',
  'Закажем такси? 🚖',
  'Добавил плейлист 🎶',
  'У кого карты? 🎴',
  'Забронировал столик 🍽️',
  'Сделаем фото 📸',
  'Я за пивом 🍺',
  'Принесу проектор 📽️',
  'Я купил шарики 🎈',
  'Спойлер: будет торт 🎂',
  'Я возьму чипсы 🥨',
  'Друзья, до встречи 🐸',
  'Нужны свечи 🕯️',
  'Кто возьмет настолки? 🎲',
  'Всем привет! 👋',
  'Буду с +1 🙂',
  'Я за сладким 🍩',
  'Кто за лимонадом? 🍋',
  'Прихвачу фрукты 🍇',
  'Поставлю чайник ☕',
  'Возьму пледы 🧣',
  'Захвачу музыку 🔊',
  'Кто возьмет мангал? 🔥',
  'Я за салатом 🥗',
  'Давайте играть в мафию 😎',
  'Поделитесь адресом 🗺️',
  'Где паркуемся? 🅿️',
  'Принесу колонку 📢',
  'Я принесу десерт 🍰',
  'Кто возьмёт свечи? 🕯️',
  'Я возьму сок 🧃',
  'Берите тёплые вещи 🧥',
  'Я за хлопьями 🍿',
  'Нужен штопор? 🍷',
  'Кто возьмёт гитару? 🎸',
  'Давайте устроим караоке 🎤',
  'Привезу настольный футбол ⚽',
  'Я везу кота 🐱',
  'Кто-то едет на велосипеде? 🚲',
  'Приготовлю салаты 🥬',
  'Я за фруктами 🍏',
  'Сделаю лимонад 🍋',
  'У меня есть проектор 📽️',
  'Я приеду на час раньше ⏱️',
  'Привезу геймпад 🎮',
  'Я на метро 🚇',
  'Возьму фотоаппарат 📷',
  'Кто-то пьет чай? 🍵',
  'Я привезу воду 💧',
  'Есть у кого настольный теннис? 🏓',
  'Я за хлебом 🍞',
  'Кто возьмёт кофе? ☕',
  'Давайте фильм посмотрим 🎬',
  'Я приготовлю пасту 🍝',
  'Возьму гитару 🎸',
  'Нужны батарейки? 🔋',
  'Я на машине 🚗',
  'Кто возьмет тарелки? 🍽️',
  'Буду через 15 минут ⏳',
  'Захвачу зонтик ☔',
  'Я возьму торт 🍰',
  'Не забудьте зарядки 🔌',
  'Я уже в пути 🛣️',
  'Поставлю музыку 🎧',
  'Принесу игру в угадайку 🤔',
  'Я за печеньем 🍪',
  'Буду online 💻',
  'Увидимся у входа 🚪',
  'Я за наушниками 🎧',
  'Кто возьмет посуду? 🍽️',
  'Мне нужно такси 🛺',
  'У кого есть карты? 🃏',
  'Заберу пиццу по пути 🍕',
  'Кто за гирляндами? 🌟',
  'Я отпечатаю фото 📸',
  'Кто на десерт? 🍮',
  'Встречаемся у метро 🚉',
  'Я возьму мороженое 🍦',
  'Поставлю плейлист вечера 🎵',
  'Привезу настольный хоккей 🏒',
  'Я беру карты Таро 🃏',
  'Прихвачу селфи-палку 🤳',
  'Запасуся маршмеллоу 🍡',
  'Буду на самокате 🛴',
  'Захвачу настольный дартс 🎯',
  'У кого есть мяч? 🏀',
  'Привезу лампу лаву 🪔',
  'Я с домашним лимонадом 🍹',
  'Захвачу гитару-бас 🎸',
  'Принесу плейстейшен 🎮',
  'Кто возьмёт микрофон? 🎙️',
  'Я куплю фейерверки 🎆',
  'Привезу попкорн 🍿',
  'Зайду за напитками 🍻',
  'Подготовлю викторину ❓',
  'Привезу селфи-зону 📸',
  'Захвачу набор для рисования 🎨',
  'Кто принесёт настольные игры? 🎲'
];
// === ПЛАВАЮЩИЕ ЧИПЫ ===
const FH_MAX_CHIPS = 20;          // не больше 20, чтобы не фризило
let fhCloudsRoot = null;
let fhChips = [];                 // [{el, x, y, vx, vy, w, h}...]
let fhAnimId = 0;

function ensureCloudsRoot() {
  if (fhCloudsRoot && document.body.contains(fhCloudsRoot)) return fhCloudsRoot;
  if (fhCloudsRoot?.parentNode) fhCloudsRoot.parentNode.removeChild(fhCloudsRoot);
  fhCloudsRoot = document.createElement('div');
  fhCloudsRoot.id = 'fh-message-clouds';
  document.body.appendChild(fhCloudsRoot);
  return fhCloudsRoot;
}

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnChips() {
  const root = ensureCloudsRoot();

  // если уже заспавнили — просто перезапустим анимацию
  if (fhChips.length) { startFloat(); return; }

  const pool = Array.isArray(FH_MESSAGES) ? [...FH_MESSAGES] : [];
  if (!pool.length) return;

  // перемешаем и ограничим
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const list = pool.slice(0, FH_MAX_CHIPS);

  // создаём DOM-узлы
  list.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = msg;
    root.appendChild(el);

    // первичное измерение
    const { width:w = 140, height:h = 40 } = el.getBoundingClientRect();

    // стартовая позиция (не у самых краёв) и скорость
    const x = rand(20, window.innerWidth  - w - 20);
    const y = rand(20, window.innerHeight - h - 20);
    const vx = rand(-0.05, 0.05);  // px/мс
    const vy = rand(-0.04, 0.04);

    fhChips.push({ el, x, y, vx, vy, w, h });
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  startFloat();
}

function startFloat() {
  stopFloat(); // на всякий
  let last = performance.now();

  function tick(now) {
    const dt = now - last;       // мс
    last = now;

    const W = window.innerWidth;
    const H = window.innerHeight;

    for (const c of fhChips) {
      // обновляем позицию
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      // «отталкивание» от краёв
      if (c.x < 10)                   { c.x = 10;                   c.vx *= -1; }
      if (c.y < 10)                   { c.y = 10;                   c.vy *= -1; }
      if (c.x > W - c.w - 10)         { c.x = W - c.w - 10;         c.vx *= -1; }
      if (c.y > H - c.h - 10)         { c.y = H - c.h - 10;         c.vy *= -1; }

      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }

    fhAnimId = requestAnimationFrame(tick);
  }

  fhAnimId = requestAnimationFrame(tick);
}

function stopFloat() {
  if (fhAnimId) cancelAnimationFrame(fhAnimId);
  fhAnimId = 0;
}

// При ресайзе подправим границы, не пересоздавая DOM
window.addEventListener('resize', () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  fhChips.forEach(c => {
    c.x = Math.min(Math.max(10, c.x), W - c.w - 10);
    c.y = Math.min(Math.max(10, c.y), H - c.h - 10);
    c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
  });
}, { passive:true });

// Вызови это один раз при старте приложения и при смене экрана:
function mountBackgroundOnce() {
  try { spawnChips(); } catch(e){ console.warn('[chips]', e); }
}
document.addEventListener('DOMContentLoaded', mountBackgroundOnce);

const SCREENS = ['auth','home','profile','settings','create','join','wishlist','final'];

function showScreen(name) {
  SCREENS.forEach(id => {
    const el = document.getElementById(`screen-${id}`);
    if (!el) return;
    const visible = (id === name);
    el.classList.toggle('visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  mountBackgroundOnce();
}

function routeFromHash() {
  const raw = (location.hash || '#home').replace('#', '');
  const name = SCREENS.includes(raw) ? raw : 'home';
  showScreen(name);
}

window.addEventListener('hashchange', routeFromHash);
document.addEventListener('DOMContentLoaded', routeFromHash);

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-link]');
  if (!a) return;
  e.preventDefault();
  const dest = a.getAttribute('data-link');
  if (SCREENS.includes(dest)) {
    location.hash = `#${dest}`;
  }
});

function bindAuthForms() {
  const loginForm = document.getElementById('auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const login = (fd.get('login') || '').toString().trim();
      const password = (fd.get('password') || '').toString().trim();
      if (!login || !password) return;
      try {
        await signIn({ login, password });
        location.hash = '#home';
      } catch (err) {
        console.warn('[auth:login]', err?.message || err);
      }
    });
  }

  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      const nickname = (fd.get('nickname') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const password = (fd.get('password') || '').toString().trim();
      if (!nickname || !email || !password) return;
      try {
        await signUpWithNickname({ nickname, email, password });
        location.hash = '#home';
      } catch (err) {
        console.warn('[auth:register]', err?.message || err);
      }
    });
  }

  const forgot = document.querySelector('[data-action="forgot"]');
  if (forgot) {
    forgot.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt('Введите e-mail для сброса:');
      if (!email) return;
      try {
        await resetPassword(email);
        alert('Если такой e-mail существует, письмо отправлено.');
      } catch (err) {
        console.warn('[auth:reset]', err?.message || err);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', bindAuthForms);
