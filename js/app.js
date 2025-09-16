(function bootstrapRouter(){
  if (document.documentElement.dataset.wired === '1') return;
  document.documentElement.dataset.wired = '1';

  // --- Helpers
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const byId = id => document.getElementById(id);

  function navigateTo(route) {
    if (!route) return;
    const target = byId(`screen-${route}`);
    $$('.screen').forEach(el => el.hidden = true);
    if (target) target.hidden = false;
    // active state
    $$('[data-route],[data-nav]').forEach(b => {
      const r = b.dataset.route || b.dataset.nav;
      const active = r === route;
      b.classList.toggle('active', active);
      b.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (location.hash !== `#${route}`) {
      history.replaceState(null, '', `#${route}`);
    }
    if (typeof window.onRouteChange === 'function') {
      try { window.onRouteChange(route); } catch(e) { console.warn(e); }
    }
  }

  function handleAction(action, el) {
    const sel = el?.dataset?.target;
    const target = sel ? document.querySelector(sel) : null;
    switch (action) {
      case 'open-modal':
        if (target) target.hidden = false;
        else console.warn('open-modal: target not found', sel);
        break;
      case 'close-modal':
        if (target) target.hidden = true;
        else console.warn('close-modal: target not found', sel);
        break;
      case 'toggle':
        if (target) target.hidden = !target.hidden;
        else {
          el.classList.toggle('active');
          el.setAttribute('aria-pressed', el.classList.contains('active') ? 'true' : 'false');
        }
        break;
      case 'copy': {
        let text = el.dataset.copy || (target?.value ?? target?.textContent ?? el.textContent ?? '').trim();
        if (!text) { console.warn('copy: nothing to copy'); break; }
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(console.warn);
        else {
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch(e) { console.warn(e); }
          ta.remove();
        }
        break;
      }
      case 'logout':
        if (typeof window.logout === 'function') window.logout();
        else console.warn('logout: handler not implemented');
        break;
      case 'create':
        if (typeof window.createEvent === 'function') window.createEvent();
        else console.warn('create: handler not implemented');
        break;
      case 'join':
        if (typeof window.joinByCode === 'function') window.joinByCode();
        else console.warn('join: handler not implemented');
        break;
      case 'save':
        if (typeof window.saveForm === 'function') window.saveForm();
        else console.warn('save: handler not implemented');
        break;
      case 'refresh':
        location.reload();
        break;
      case 'back':
        history.back();
        break;
      default:
        console.warn('Unknown action', action);
    }
  }

  // --- Delegate clicks
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a,button,[role="button"]');
    if (!el || el.matches('[disabled],[aria-disabled="true"]')) return;

    // explicit URL
    const direct = el.dataset.href || (el.tagName === 'A' ? el.getAttribute('href') : null);
    if (direct && !direct.startsWith('#')) {
      e.preventDefault();
      window.location.assign(direct);
      return;
    }
    // route
    const hash = (direct && direct.startsWith('#')) ? direct.slice(1) : (el.dataset.route || el.dataset.nav);
    if (hash) {
      e.preventDefault();
      navigateTo(hash);
      return;
    }
    // action
    const action = el.dataset.action;
    if (action) {
      e.preventDefault();
      handleAction(action, el);
      return;
    }
  }, { capture: true });

  // keyboard support for role="button"
  document.addEventListener('keydown', (e) => {
    const el = e.target.closest('[role="button"]');
    if (!el) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });

  // hash routing
  window.addEventListener('hashchange', () => {
    const r = location.hash.slice(1);
    if (r) navigateTo(r);
  });

  // background layers safety
  ['.background-layer', '.bg-bubbles', '.fh-bubbles'].forEach(sel => {
    document.querySelectorAll(sel).forEach(n => {
      if (!n.style.pointerEvents) n.style.pointerEvents = 'none';
    });
  });

  // auto-tag obvious buttons/links (non-destructive)
  document.addEventListener('DOMContentLoaded', () => {
    const pairs = [
      { q: 'button, a', text: 'Профиль', attr: ['data-route','profile'] },
      { q: 'button, a', text: 'Настройки', attr: ['data-route','settings'] },
      { q: '.logo, a', text: 'FroggyHub', attr: ['data-route','home'] },
      { q: 'button, a', text: 'Создать событие', attr: ['data-action','create'] },
      { q: 'button, a', text: 'Присоединиться', attr: ['data-action','join'] },
      { q: '#hub-logout, [data-logout]', text: '', attr: ['data-action','logout'] },
    ];
    pairs.forEach(({q,text,attr:[name,val]})=>{
      $$(q).forEach(el=>{
        if (el.hasAttribute(name)) return;
        const t = (el.getAttribute('aria-label') || el.textContent || '').trim();
        if (!text || t.includes(text)) el.setAttribute(name, val);
      });
    });

    // diagnostics
    const interactive = $$('a[href],button,[data-action],[data-route],[data-nav]');
    console.debug('[FroggyHub] interactive nodes:', interactive.length);
    interactive.forEach((n,i)=>{
      const info = {
        i,
        href: n.getAttribute('href') || n.dataset.href || '',
        route: n.dataset.route || n.dataset.nav || '',
        action: n.dataset.action || ''
      };
      if (!info.href && !info.route && !info.action) {
        console.warn('[FroggyHub] untagged interactive:', n);
      }
    });

    const initial = location.hash.slice(1);
    if (initial) navigateTo(initial);
  });
})();

import { supa } from './api.js';

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
  'Я возьму мороженое 🍦'
];

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickMessage() {
  return FH_MESSAGES[Math.floor(Math.random() * FH_MESSAGES.length)];
}

function rectAt(pos, el) {
  const { width, height } = el.getBoundingClientRect();
  return { left: pos.x, top: pos.y, right: pos.x + width, bottom: pos.y + height };
}

function rectsOverlap(a, b, pad = 0) {
  return !(a.right + pad < b.left || a.left - pad > b.right || a.bottom + pad < b.top || a.top - pad > b.bottom);
}

function overlapsAny(pos, el) {
  const r1 = rectAt(pos, el);
  const nodes = document.querySelectorAll('.fh-bubble.fh-bubble--in');
  for (const n of nodes) {
    if (n === el) continue;
    const r2 = n.getBoundingClientRect();
    if (rectsOverlap(r1, r2, 6)) return true;
  }
  return false;
}

function clampToContainer(p, el) {
  const c = el.parentElement.getBoundingClientRect();
  const { width, height } = el.getBoundingClientRect();
  return {
    x: Math.max(8, Math.min(c.width - width - 8, p.x)),
    y: Math.max(8, Math.min(c.height - height - 8, p.y)),
  };
}

function lifeCycle(bubble, anchor) {
  const el = bubble.el;
  if (prefersReduced) {
    bubble.timer = setInterval(() => {
      el.textContent = pickMessage();
    }, 10000 + Math.random() * 2000);
    return;
  }

  const run = () => {
    const visibleMs = 3000 + Math.random() * 1000;
    bubble.timer = setTimeout(() => {
      el.classList.remove('fh-bubble--in');
      el.classList.add('fh-bubble--out');

      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        el.textContent = pickMessage();

        const dx = Math.random() * 80 - 40;
        const dy = Math.random() * 80 - 40;
        const target = clampToContainer({ x: anchor.x + dx, y: anchor.y + dy }, el);

        let tries = 0;
        while (tries < 30 && overlapsAny(target, el)) {
          target.x += Math.random() * 20 - 10;
          target.y += Math.random() * 20 - 10;
          tries++;
        }

        el.style.left = `${target.x}px`;
        el.style.top = `${target.y}px`;

        el.classList.remove('fh-bubble--out');
        requestAnimationFrame(() => el.classList.add('fh-bubble--in'));

        run();
      };

      el.addEventListener('transitionend', onEnd, { once: true });
    }, visibleMs);
  };
  run();
}

function findNonOverlappingPosition(container, el, placed) {
  const c = container.getBoundingClientRect();
  let tries = 0;
  let x, y;
  do {
    x = 24 + Math.random() * (c.width - 160);
    y = 24 + Math.random() * (c.height - 60);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const r1 = el.getBoundingClientRect();
    const hit = placed.some(p => rectsOverlap(r1, p.el.getBoundingClientRect(), 8));
    if (!hit) break;
    tries++;
  } while (tries < 60);
  return { x, y };
}

function desiredBubbleCount() {
  const area = window.innerWidth * window.innerHeight;
  return Math.min(80, Math.max(20, Math.round(area / 12000)));
}

function debounce(fn, wait = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function spawnBubbles(container, count) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'fh-bubble';
    el.textContent = pickMessage();
    container.appendChild(el);

    const pos = findNonOverlappingPosition(container, el, placed);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    requestAnimationFrame(() => el.classList.add('fh-bubble--in'));

    const bubble = { el };
    const anchor = { x: pos.x, y: pos.y };
    const delay = Math.random() * 400;
    setTimeout(() => lifeCycle(bubble, anchor), delay);

    placed.push({ el, x: pos.x, y: pos.y });
  }
}

// ---- BOOTSTRAP (один раз) -----------------------------------
if (!window.FH) window.FH = {};
if (window.FH.__booted) { /* уже проинициализировано */ }
else {
  window.FH.__booted = true;

  // -------- Supabase: получить клиент (через существующий _supabase.js)
  // ожидается window.supabase уже сконфигурирован
  const getSupabase = () => supa;

  // Локальный кэш сессии
  const LS_KEY = 'fh_session';
  const getSavedSession = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
    catch { return null; }
  };
  const setSavedSession = (s) => {
    try { s ? localStorage.setItem(LS_KEY, JSON.stringify(s)) : localStorage.removeItem(LS_KEY); } catch {}
  };

  // --- Роутинг и навигация
  const screenNodes = Array.from(document.querySelectorAll('[id^="screen-"]'));
  const screenMap = new Map();
  for (const node of screenNodes) {
    if (!(node instanceof HTMLElement)) continue;
    const id = node.id || '';
    if (!id.startsWith('screen-')) continue;
    const key = id.slice(7).toLowerCase();
    if (!screenMap.has(key)) screenMap.set(key, node);
  }
  let currentRoute = '';

  const ACTION_FUNCTIONS = {
    logout: ['logout'],
    create: ['create', 'createEvent', 'startCreateFlow'],
    join: ['join', 'joinEvent', 'joinByCode'],
    save: ['save', 'saveEvent', 'saveChanges'],
    refresh: ['refresh', 'refreshData', 'reload'],
    back: ['back', 'goBack', 'navigateBack'],
  };

  const normalizeRoute = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^#/, '').toLowerCase();
  };

  const getHashRoute = () => normalizeRoute(location.hash.slice(1));

  const getRouteCandidate = (el) => {
    if (!el || !(el instanceof HTMLElement)) return '';
    const { dataset } = el;
    if (dataset?.route) return dataset.route;
    if (dataset?.nav) return dataset.nav;
    if (dataset?.link) return dataset.link;
    if (dataset?.go) return dataset.go;
    const href = el.getAttribute('href');
    if (href && href.startsWith('#')) return href.slice(1);
    return '';
  };

  const getElementLabel = (el) => {
    if (!el) return '';
    const aria = el.getAttribute?.('aria-label');
    if (aria) return aria.trim();
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return text;
    const title = el.getAttribute?.('title');
    return title ? title.trim() : '';
  };

  function updateActiveNav(route) {
    const interactive = document.querySelectorAll('a, button, [role="button"]');
    interactive.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const candidate = normalizeRoute(getRouteCandidate(el));
      const isActive = candidate && candidate === route;
      el.classList.toggle('active', isActive);
      if (isActive) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
  }

  function navigateTo(route) {
    const desired = normalizeRoute(route);
    let nextRoute = desired;
    let target = desired ? screenMap.get(desired) : null;

    if (!target) {
      if (screenMap.has('home')) {
        nextRoute = 'home';
        target = screenMap.get('home');
      } else if (screenMap.has('auth')) {
        nextRoute = 'auth';
        target = screenMap.get('auth');
      } else {
        const first = screenMap.entries().next().value;
        if (first) {
          nextRoute = first[0];
          target = first[1];
        } else {
          nextRoute = '';
        }
      }
    }

    screenMap.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.hidden = true;
      node.classList.remove('visible');
    });

    if (target instanceof HTMLElement) {
      target.hidden = false;
      if (target.classList.contains('screen')) target.classList.add('visible');
      else target.classList.remove('hidden');
    }

    currentRoute = nextRoute;
    updateActiveNav(currentRoute);

    const baseUrl = `${location.pathname}${location.search}`;
    const hashUrl = currentRoute ? `${baseUrl}#${currentRoute}` : baseUrl;
    history.replaceState(null, '', hashUrl);
    window.onRouteChange?.(currentRoute);
    return currentRoute;
  }

  function ensureBackgroundGuards() {
    document.querySelectorAll('.background-layer, .bg-bubbles').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (!el.style.pointerEvents) el.style.pointerEvents = 'none';
      if (!el.style.zIndex) el.style.zIndex = '0';
    });
  }

  function autoAttachDataAttributes() {
    const interactive = document.querySelectorAll('a, button, [role="button"]');
    interactive.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const label = getElementLabel(el).toLowerCase();
      if (!el.dataset.route && !el.dataset.nav) {
        if (label === 'профиль') el.dataset.route = 'profile';
        else if (label === 'настройки') el.dataset.route = 'settings';
        else if (label === 'меню' || label === 'froggyhub' || el.classList.contains('logo')) el.dataset.route = 'home';
      }
      if (!el.dataset.action) {
        if (label === 'создать событие') el.dataset.action = 'create';
        else if (label === 'присоединиться') el.dataset.action = 'join';
        else if (label === 'выйти') el.dataset.action = 'logout';
      }
    });
  }

  function logInteractiveElements() {
    const rows = [];
    const interactive = document.querySelectorAll('a, button, [role="button"]');
    interactive.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const label = getElementLabel(el);
      const route = normalizeRoute(getRouteCandidate(el));
      const action = el.dataset.action || '';
      const href = el.dataset.href || el.getAttribute('href') || '';
      const tag = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '');
      if (route || action || href) {
        rows.push({ element: tag, label, route, action, href });
      } else {
        const isButton = el.tagName === 'BUTTON';
        const btnType = isButton ? (el.getAttribute('type') || 'submit').toLowerCase() : '';
        if (!isButton || (btnType !== 'submit' && btnType !== 'reset')) {
          console.warn('Interactive element without route/action', el);
        }
      }
    });
    if (rows.length) {
      console.info('Interactive elements summary:');
      console.table(rows);
    }
  }

  function invokeGlobalAction(action, el) {
    const candidates = ACTION_FUNCTIONS[action];
    if (!candidates) return false;
    for (const name of candidates) {
      const fn = window[name];
      if (typeof fn === 'function') {
        fn.call(window, el);
        return true;
      }
    }
    console.warn(`No handler for action "${action}"`, el);
    return false;
  }

  function handleAction(action, el) {
    if (!action || !el) return false;
    const normalized = action.toLowerCase();
    const targetSelector = el.dataset.target;
    const target = targetSelector ? document.querySelector(targetSelector) : null;

    switch (normalized) {
      case 'open-modal': {
        const modal = target || el.closest('dialog');
        if (modal instanceof HTMLDialogElement) {
          modal.showModal();
        } else if (modal instanceof HTMLElement) {
          modal.hidden = false;
          modal.classList.remove('hidden');
        } else {
          console.warn('Target not found for open-modal', el);
        }
        return true;
      }
      case 'close-modal': {
        const modal = target || el.closest('dialog');
        if (modal instanceof HTMLDialogElement) {
          modal.close();
        } else if (modal instanceof HTMLElement) {
          modal.hidden = true;
          modal.classList.remove('visible');
          modal.classList.remove('active');
        } else {
          console.warn('Target not found for close-modal', el);
        }
        return true;
      }
      case 'toggle': {
        if (target instanceof HTMLElement) {
          target.hidden = !target.hidden;
        } else {
          el.classList.toggle('active');
        }
        return true;
      }
      case 'copy': {
        const sourceText = el.dataset.copy
          || (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : target?.textContent)
          || (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value : el.textContent);
        const text = (sourceText || '').toString().trim();
        if (!text) {
          console.warn('Nothing to copy', el);
          return true;
        }
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch((err) => console.warn('Copy failed', err));
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); }
          catch (err) { console.warn('Copy failed', err); }
          document.body.removeChild(ta);
        }
        return true;
      }
      case 'logout':
      case 'create':
      case 'join':
      case 'save':
      case 'refresh':
      case 'back':
        return invokeGlobalAction(normalized, el);
      default:
        console.warn('Unknown action', action, el);
        return false;
    }
  }

  function handleDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0) return;
    const el = event.target.closest('a, button, [role="button"]');
    if (!el || !(el instanceof HTMLElement)) return;
    if (el.matches('[disabled], [aria-disabled="true"]')) return;

    const action = el.dataset.action;
    if (action) {
      const handled = handleAction(action, el);
      if (handled) {
        event.preventDefault();
        return;
      }
    }

    const dataHref = el.dataset.href;
    if (dataHref) {
      event.preventDefault();
      if (dataHref.startsWith('#')) navigateTo(dataHref.slice(1));
      else window.location.assign(dataHref);
      return;
    }

    const routeCandidate = getRouteCandidate(el);
    if (routeCandidate) {
      if (screenMap.size > 0) {
        navigateTo(routeCandidate);
        event.preventDefault();
      }
      return;
    }

    const href = el.getAttribute('href');
    if (href && href.startsWith('#')) {
      if (screenMap.size > 0) {
        event.preventDefault();
        navigateTo(href.slice(1));
      }
    }
  }

  function handleKeydown(event) {
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const el = event.target;
    if (!(el instanceof HTMLElement)) return;
    if (el.getAttribute('role') !== 'button') return;
    if (el.matches('[disabled], [aria-disabled="true"]')) return;
    event.preventDefault();
    el.click();
  }

  async function route(preferredRoute) {
    const supaClient = getSupabase();
    let session = getSavedSession();
    let routeHint = normalizeRoute(preferredRoute);

    if (!session && supaClient?.auth) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      try {
        const { data } = await supaClient.auth.getSession({ signal: ctrl.signal });
        session = data?.session || null;
      } catch { /* ignore */ }
      clearTimeout(timer);
      if (session) setSavedSession({ user: session.user, access_token: session.access_token });
    }

    const authed = !!session;
    window.FH.session = session || null;

    if (!authed) {
      setSavedSession(null);
      const fallback = routeHint && routeHint !== 'home' ? routeHint : 'auth';
      navigateTo(fallback);
      return;
    }

    let targetRoute = routeHint;
    if (!targetRoute || targetRoute === 'auth') targetRoute = 'home';
    if (targetRoute && !screenMap.has(targetRoute)) {
      targetRoute = screenMap.has('home') ? 'home' : targetRoute;
    }
    navigateTo(targetRoute);
  }

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleKeydown, true);

  const onDomReady = () => {
    ensureBackgroundGuards();
    autoAttachDataAttributes();
    logInteractiveElements();
    const initialRoute = getHashRoute();
    route(initialRoute);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onDomReady);
  else onDomReady();

  window.addEventListener('hashchange', () => {
    route(getHashRoute());
  });

  // --- Обработчики форм логина/регистрации
  (function bindAuth() {
    const loginForm  = document.querySelector('#loginForm');
    const signupForm = document.querySelector('#signupForm');
    async function handle(form, kind) {
      if (!form) return;
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const nickname = (fd.get('nickname') || '').toString().trim();
        const password = (fd.get('password') || '').toString();
        if (!nickname || !password) return;

        try {
          const supaClient = getSupabase();
          let ok = false, session = null;

          if (kind === 'login') {
            const { data, error } = await supaClient.auth.signInWithPassword({ email: `${nickname}@local`, password });
            if (!error) { ok = true; session = data.session; }
          } else {
            const { data, error } = await supaClient.auth.signUp({ email: `${nickname}@local`, password });
            if (!error) {
              const r = await supaClient.auth.signInWithPassword({ email: `${nickname}@local`, password });
              session = r.data.session; ok = !r.error;
            }
          }

          if (ok && session) {
            setSavedSession({ user: session.user, access_token: session.access_token });
            navigateTo('home');
            await route('home');
          }
        } catch (err) { /* можно показать тост */ }
      });
    }
    handle(loginForm, 'login');
    handle(signupForm, 'signup');
  })();

  // ---- Фоновые «смс» (сетка + локальные орбиты)
  (function bubbles() {
    const root = document.querySelector('.fh-bubbles');
    if (!root) return;
    root.innerHTML = '';
    spawnBubbles(root, desiredBubbleCount());

    window.addEventListener('resize', debounce(() => {
      const box = document.querySelector('.fh-bubbles');
      if (!box) return;
      box.innerHTML = '';
      spawnBubbles(box, desiredBubbleCount());
    }, 200));
  })();
}
