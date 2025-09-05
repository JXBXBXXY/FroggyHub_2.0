import { supa, signInSmart, signUpWithNickname, getSession, signOut, onAuthChanged } from './api.js';

// Вспомогалки выборки
const qs = (s, r=document) => r.querySelector(s);
const qa = (s, r=document) => Array.from(r.querySelectorAll(s));

const SCREENS = ['auth','home','profile','settings','create','join'];
/** Показ экрана + обновление hash */
function showScreen(name) {
  const slug = (name || "").toString().replace(/^#/, "").replace(/^screen-/, "");
  document.querySelectorAll(".screen").forEach(el => {
    const visible = el.id === `screen-${slug}`;
    el.classList.toggle("visible", visible);
    el.setAttribute("aria-hidden", String(!visible));
    if (visible) applySmartScroll(el);
  });
  if (!slug.includes("auth")) {
    const newHash = "#" + (SCREENS.includes(slug) ? slug : slug);
    if (location.hash !== newHash) history.replaceState(null, "", newHash);
  }
}


/** Навигация по клику на элементы с [data-link] */
function bindNav(){
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('[data-link]');
    if(!a) return;
    e.preventDefault();
    const to = a.getAttribute('data-link');
    if (SCREENS.includes(to)) showScreen(to);
  });
}

/** Привязка форм авторизации (id="auth-form") и регистрации (id="register-form") */
function bindAuthForms(){
  const loginForm = qs('#auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(loginForm);
      const login = fd.get('login');
      const password = fd.get('password');
      const errBox = loginForm.querySelector('.form-error');
      try{
        errBox && (errBox.textContent = '');
        await signInSmart({ login, password });
        showScreen('home');
      }catch(err){
        console.warn('[auth:login]', err);
        errBox && (errBox.textContent = err?.message || 'Ошибка входа');
        loginForm.classList.add('shake');
        setTimeout(()=>loginForm.classList.remove('shake'), 600);
      }
    });
  }

  const regForm = qs('#register-form');
  if (regForm){
    regForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(regForm);
      const nickname = fd.get('nickname');
      const email = fd.get('email'); // можно пустым — сгенерим из никнейма
      const password = fd.get('password');
      const errBox = regForm.querySelector('.form-error');
      try{
        errBox && (errBox.textContent = '');
        await signUpWithNickname({ nickname, email, password });
        // после успешной регистрации пробуем залогинить:
        await signInSmart({ login: email || nickname, password });
        showScreen('home');
      }catch(err){
        console.warn('[auth:register]', err);
        errBox && (errBox.textContent = err?.message || 'Ошибка регистрации');
        regForm.classList.add('shake');
        setTimeout(()=>regForm.classList.remove('shake'), 600);
      }
    });
  }
}

/** Инициализация приложения */
async function bootstrap(){
  bindNav();
  bindAuthForms();

  // первичная отрисовка
  const session = await getSession().catch(()=>null);
  showScreen(session ? 'home' : 'auth');

  // слушаем изменения авторизации
  onAuthChanged((s)=>{
    showScreen(s ? 'home' : 'auth');
  });
}

// запускаемся один раз
if (!window.__FH_BOOT__) {
  window.__FH_BOOT__ = true;
  bootstrap();
}

// ---------------- BUBBLES: state & phrases ----------------
const FH_BUBBLE_MESSAGES = (window.FH_BUBBLE_MESSAGES || [
  'Друзья, до встречи 🌿', 'Я за пивом 🍺', 'Кто возьмет колу? 🥤', 'Принесу проектор 📽️',
  'Буду позже 🙈', 'Я приду к 19:00 ✨', 'Добавил плейлист 🎶', 'Закажем такси? 🚕'
]);

let bubbleNodes = [];      // чтобы не было ReferenceError
let bubbleGridEl = null;

// Равномерная сетка + лёгкий джиттер, без касаний и наложений
function layoutChips() {
  if (!bubbleGridEl) return;

  const W = bubbleGridEl.clientWidth;
  const H = bubbleGridEl.clientHeight;
  if (W === 0 || H === 0) return;

  // параметры сетки
  const cols = Math.max(6, Math.floor(W / 180));
  const rows = Math.max(5, Math.floor(H / 120));
  const cellW = W / cols;
  const cellH = H / rows;

  // кладём каждый пузырь в свою ячейку
  bubbleNodes.forEach((node, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols) % rows;

    // джиттер в пределах 20% клетки
    const jx = (Math.random() - 0.5) * 0.4 * cellW;
    const jy = (Math.random() - 0.5) * 0.4 * cellH;

    const x = Math.round(c * cellW + cellW / 2 + jx);
    const y = Math.round(r * cellH + cellH / 2 + jy);

    node.style.transform = `translate(${x}px, ${y}px)`;
  });
}

function startBubbles() {
  bubbleGridEl = document.getElementById('fh-bubbles');
  if (!bubbleGridEl) return; // тихо выходим, если контейнера нет

  // Создаём/обновляем набор «смсок»
  if (bubbleNodes.length === 0) {
    const pool = [...FH_BUBBLE_MESSAGES];
    const count = Math.min(pool.length, 28); // умеренное количество
    for (let i = 0; i < count; i++) {
      const chip = document.createElement('div');
      chip.className = 'chip chip--ghost'; // используй ваш стиль «пузыря»
      chip.textContent = pool[i % pool.length];
      chip.style.position = 'absolute';
      chip.style.willChange = 'transform, opacity';
      bubbleGridEl.appendChild(chip);
      bubbleNodes.push(chip);
    }
  }

  layoutChips();

  // мягкая жизнь пузырей: цикличное затухание и смена текста/ячейки
  setInterval(() => {
    if (bubbleNodes.length === 0) return;
    const idx = Math.floor(Math.random() * bubbleNodes.length);
    const node = bubbleNodes[idx];
    node.style.transition = 'opacity .45s ease';
    node.style.opacity = '0';
    setTimeout(() => {
      node.textContent = FH_BUBBLE_MESSAGES[Math.floor(Math.random() * FH_BUBBLE_MESSAGES.length)];
      node.style.opacity = '1';
      // чуточку перетасуем сетку
      layoutChips();
    }, 480);
  }, 1600);

  window.addEventListener('resize', () => {
    // дебаунс можно не усложнять
    layoutChips();
  });
}

// ---------------- SCROLL CONTROL ----------------
function setScrollLocked(locked) {
  document.body.classList.toggle('fh-scroll-locked', !!locked);
}

// Включаем скролл, если контент выше окна, либо экран явно помечен .scrollable
function applySmartScroll(screenEl) {
  if (!screenEl) return;
  const isExplicit = screenEl.classList.contains('scrollable');
  if (isExplicit) {
    setScrollLocked(false);
    return;
  }
  // измеряем
  const needsScroll = screenEl.scrollHeight > window.innerHeight + 8;
  setScrollLocked(!needsScroll);
}

// ---------------- BOOTSTRAP ----------------
document.addEventListener('DOMContentLoaded', () => {
  try { startBubbles(); } catch (e) { console.warn('[bubbles]', e); }

  // При первой отрисовке тоже заблокируем скролл
  const initial = document.querySelector('.screen.visible');
  applySmartScroll(initial);

  // Если где-то в коде уже есть bootstrap — не дублировать, просто
  // вставь вызовы applySmartScroll в его «после переключения экрана»
});
