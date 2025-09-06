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
// === ПЛАВАЮЩИЕ ЧИПЫ (anti-stick вер.) ===
const FH_MAX_CHIPS = 20;
const FH_PLACE_TRIES = 40;   // попыток поставить без наложений
const FH_MIN_DIST = 120;     // мин. дистанция между центрами чипов
const FH_MARGIN = 20;        // отступ от краёв
const FH_MIN_SPEED = 0.045;  // px/ms, минимальная скорость
const FH_MAX_SPEED = 0.09;   // px/ms, ограничение сверху
const FH_JITTER = 0.00012;   // случайное ускорение на тик
const FH_CORNER_KICK = 0.12; // импульс при «залипании» в углу

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
  document.body.appendChild(fhCloudsRoot);
  return fhCloudsRoot;
}

function spawnChips() {
  const root = ensureCloudsRoot();
  if (fhChips.length) { startFloat(); return; }

  const pool = Array.isArray(FH_MESSAGES) ? [...FH_MESSAGES] : [];
  if (!pool.length) return;
  //.shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const list = pool.slice(0, FH_MAX_CHIPS);

  const W = window.innerWidth;
  const H = window.innerHeight;

  function canPlace(cx, cy, w, h) {
    // границы
    if (cx - w/2 < FH_MARGIN || cy - h/2 < FH_MARGIN) return false;
    if (cx + w/2 > W - FH_MARGIN || cy + h/2 > H - FH_MARGIN) return false;
    // дистанция до уже поставленных
    for (const c of fhChips) {
      const dx = (cx) - (c.x + c.w/2);
      const dy = (cy) - (c.y + c.h/2);
      if (dx*dx + dy*dy < FH_MIN_DIST*FH_MIN_DIST) return false;
    }
    return true;
  }

  function nonZeroVelocity() {
    // случайное направление, но с минимальной длиной
    let angle = rand(0, Math.PI * 2);
    let speed = rand(FH_MIN_SPEED, FH_MAX_SPEED);
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }

  list.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'fh-chip';
    el.textContent = msg;
    root.appendChild(el);

    // измерение
    const r = el.getBoundingClientRect();
    const w = r.width  || 140;
    const h = r.height || 40;

    // размещение с анти-склейкой
    let placed = false, x = FH_MARGIN, y = FH_MARGIN;
    for (let t = 0; t < FH_PLACE_TRIES && !placed; t++) {
      const cx = rand(FH_MARGIN + w/2, W - FH_MARGIN - w/2);
      const cy = rand(FH_MARGIN + h/2, H - FH_MARGIN - h/2);
      if (canPlace(cx, cy, w, h)) {
        x = cx - w/2; y = cy - h/2; placed = true;
      }
    }
    if (!placed) {
      // fallback: поставить куда получится с отступом
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
    const W = window.innerWidth, H = window.innerHeight;

    for (const c of fhChips) {
      // лёгкий джиттер (как шум), чтобы не синхронизировались
      c.vx += rand(-FH_JITTER, FH_JITTER) * dt;
      c.vy += rand(-FH_JITTER, FH_JITTER) * dt;

      // ограничение скорости
      const sp = Math.hypot(c.vx, c.vy);
      if (sp < FH_MIN_SPEED) {
        // подталкивание в случайную сторону
        const a = rand(0, Math.PI*2);
        c.vx = Math.cos(a) * FH_MIN_SPEED;
        c.vy = Math.sin(a) * FH_MIN_SPEED;
      } else if (sp > FH_MAX_SPEED) {
        c.vx = (c.vx / sp) * FH_MAX_SPEED;
        c.vy = (c.vy / sp) * FH_MAX_SPEED;
      }

      // новая позиция
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      // отражения от границ + маленький случайный импульс
      if (c.x < FH_MARGIN)                    { c.x = FH_MARGIN;                    c.vx = Math.abs(c.vx) + rand(0, FH_JITTER*150); }
      if (c.y < FH_MARGIN)                    { c.y = FH_MARGIN;                    c.vy = Math.abs(c.vy) + rand(0, FH_JITTER*150); }
      if (c.x > W - c.w - FH_MARGIN)          { c.x = W - c.w - FH_MARGIN;          c.vx = -Math.abs(c.vx) - rand(0, FH_JITTER*150); }
      if (c.y > H - c.h - FH_MARGIN)          { c.y = H - c.h - FH_MARGIN;          c.vy = -Math.abs(c.vy) - rand(0, FH_JITTER*150); }

      // corner-kick: если слишком близко к углу дольше пары кадров — выстрелить наружу
      const nearLeft   = c.x <= FH_MARGIN + 1;
      const nearRight  = c.x >= W - c.w - FH_MARGIN - 1;
      const nearTop    = c.y <= FH_MARGIN + 1;
      const nearBottom = c.y >= H - c.h - FH_MARGIN - 1;
      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        c.stuck += dt;
        if (c.stuck > 100) { // >0.1 сек. в углу
          const ax = nearLeft ? FH_CORNER_KICK : -FH_CORNER_KICK;
          const ay = nearTop  ? FH_CORNER_KICK : -FH_CORNER_KICK;
          c.vx += ax; c.vy += ay; c.stuck = 0;
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

function stopFloat() {
  if (fhAnimId) cancelAnimationFrame(fhAnimId);
  fhAnimId = 0;
}

window.addEventListener('resize', () => {
  const W = window.innerWidth, H = window.innerHeight;
  fhChips.forEach(c => {
    c.x = clamp(c.x, FH_MARGIN, W - c.w - FH_MARGIN);
    c.y = clamp(c.y, FH_MARGIN, H - c.h - FH_MARGIN);
    c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
  });
}, { passive:true });

function mountBackgroundOnce(){ try{ spawnChips(); }catch(e){ console.warn('[chips]',e); } }
document.addEventListener('DOMContentLoaded', mountBackgroundOnce);
// пример: внутри функции, которая позиционирует чип
chip.style.left = `${x}px`;
chip.style.top  = `${y}px`;
chip.classList.add('is-placed'); // ← покажем только после расстановки
