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

// === МОНТАЖ ФОНОВЫХ ЧИПОВ ===
const FH_MAX_CHIPS = 20;
let fhCloudsRoot = null;
let fhChipNodes = [];

/** Создаём fixed-контейнер за экранами */
function ensureCloudsRoot() {
  if (fhCloudsRoot && document.body.contains(fhCloudsRoot)) return fhCloudsRoot;
  if (fhCloudsRoot && fhCloudsRoot.parentNode) fhCloudsRoot.parentNode.removeChild(fhCloudsRoot);
  fhCloudsRoot = document.createElement('div');
  fhCloudsRoot.id = 'fh-message-clouds';
  document.body.appendChild(fhCloudsRoot);
  return fhCloudsRoot;
}

/** Равномерно раскладываем чипы по 3 колонкам и нескольким «рядам» */
function layoutChips() {
  if (!fhCloudsRoot) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const cols = [Math.round(vw * 0.08), Math.round(vw * 0.45), Math.round(vw * 0.78)];
  const rows = Math.min(8, Math.max(5, Math.floor(vh / 140))); // 5..8 рядов по высоте

  fhChipNodes.forEach((node, i) => {
    const col = cols[i % cols.length];
    const row = (i / cols.length) | 0;
    const y = Math.round((vh * 0.12) + (row % rows) * (vh * 0.08));
    node.style.left = `${col}px`;
    node.style.top  = `${Math.min(vh - 60, y)}px`;
  });
}

/** Монтируем до N чипов один раз */
function mountClouds() {
  const root = ensureCloudsRoot();
  if (fhChipNodes.length) { layoutChips(); return; }

  const pool = Array.isArray(FH_MESSAGES) ? FH_MESSAGES.slice() : [];
  if (!pool.length) return;

  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const list = pool.slice(0, FH_MAX_CHIPS);

  fhChipNodes = list.map(text => {
    const chip = document.createElement('div');
    chip.className = 'fh-chip';
    chip.textContent = text;
    root.appendChild(chip);
    return chip;
  });

  layoutChips();
}

window.addEventListener('resize', layoutChips, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(layoutChips, 180), { passive: true });

function mountBackgroundOnce() {
  try { mountClouds(); } catch (e) { console.warn('[chips]', e); }
}

const SCREENS = ['auth','home','profile','settings','create','join','wishlist','final'];

function setScrollByScreen(screenId){
  document.body.classList.remove('allow-scroll');
  if (screenId === 'wishlist') {
    document.body.classList.add('allow-scroll');
  }
}

function showScreen(name) {
  SCREENS.forEach(id => {
    const el = document.getElementById(`screen-${id}`);
    if (!el) return;
    const visible = (id === name);
    el.classList.toggle('visible', visible);
    el.setAttribute('aria-hidden', String(!visible));
  });
  setScrollByScreen(name);
  mountBackgroundOnce();
}

function routeFromHash() {
  const raw = (location.hash || '#home').replace('#', '');
  const name = SCREENS.includes(raw) ? raw : 'home';
  showScreen(name);
}

window.addEventListener('hashchange', routeFromHash);
document.addEventListener('DOMContentLoaded', () => {
  mountBackgroundOnce();
  routeFromHash();
});

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
