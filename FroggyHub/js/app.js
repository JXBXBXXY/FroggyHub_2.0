import { supa } from './api.js';

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

  // --- Экраны
  const $auth = document.querySelector('#screen-auth');
  const $home = document.querySelector('#screen-home');

  const show = ($el) => { [$auth,$home].forEach(x=>x&&x.classList.remove('visible')); $el && $el.classList.add('visible'); };

  // --- Простенький роутер
  async function route() {
    const hash = (location.hash || '#auth').toLowerCase();
    const supa = getSupabase();
    let session = getSavedSession();

    // быстрая проверка
    if (!session && supa?.auth) {
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), 1500);
      try {
        const { data } = await supa.auth.getSession({ signal: ctrl.signal });
        session = data?.session || null;
      } catch { /* таймаут/ошибка – игнор */ }
      clearTimeout(t);
      if (session) setSavedSession({ user: session.user, access_token: session.access_token });
    }

    const authed = !!session;

    if (!authed) {
      show($auth);
      location.hash = '#auth';
      return;
    }

    // авторизованы
    show($home);
    if (hash !== '#home') location.hash = '#home';
  }

  // --- Навигационные кнопки (делегирование)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-link]');
    if (!btn) return;
    const to = btn.getAttribute('data-link');
    if (to === 'home') location.hash = '#home';
    else if (to === 'profile') location.hash = '#profile';   // сейчас просто якорь, UI можно расширять
    else if (to === 'settings') location.hash = '#settings'; // якорь
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
          const supa = getSupabase();
          let ok = false, session = null;

          if (kind === 'login') {
            const { data, error } = await supa.auth.signInWithPassword({ email: `${nickname}@local`, password });
            if (!error) { ok = true; session = data.session; }
          } else {
            const { data, error } = await supa.auth.signUp({ email: `${nickname}@local`, password });
            if (!error) {
              // повторный вход для единообразия
              const r = await supa.auth.signInWithPassword({ email: `${nickname}@local`, password });
              session = r.data.session; ok = !r.error;
            }
          }

          if (ok && session) {
            setSavedSession({ user: session.user, access_token: session.access_token });
            location.hash = '#home'; // триггерит route()
            await route();
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
    const items = Array.from(root.querySelectorAll('.bubble'));
    if (!items.length) return;

    function layout() {
      const W = root.clientWidth;
      const H = root.clientHeight;
      const cols = Math.max(6, Math.floor(W / 240));
      const rows = Math.max(4, Math.floor(H / 160));
      const cellW = W / cols;
      const cellH = H / rows;

      items.forEach((el, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols) % rows;
        // лёгкий джиттер внутри ячейки
        const jx = (Math.random()-0.5) * cellW * 0.35;
        const jy = (Math.random()-0.5) * cellH * 0.35;
        const x = c * cellW + cellW * 0.5 + jx;
        const y = r * cellH + cellH * 0.5 + jy;

        el.__base = { x, y };
        // разные «орбиты» вокруг базовой точки
        el.__orb = {
          rX: 8 + Math.random()*24,
          rY: 6 + Math.random()*18,
          speed: 0.4 + Math.random()*0.9,
          phi: Math.random() * Math.PI * 2
        };
      });
    }

    function tick(ts) {
      items.forEach(el => {
        const b = el.__base, o = el.__orb;
        if (!b || !o) return;
        o.phi += 0.0025 * o.speed;
        const x = b.x + Math.cos(o.phi) * o.rX;
        const y = b.y + Math.sin(o.phi*1.1) * o.rY;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${Math.sin(o.phi)*4}deg)`;
        el.style.opacity = 0.92;
      });
      requestAnimationFrame(tick);
    }

    const relayout = (() => {
      let t; 
      return () => { clearTimeout(t); t = setTimeout(layout, 120); };
    })();

    layout();
    requestAnimationFrame(tick);
    window.addEventListener('resize', relayout, { passive:true });
  })();

  // --- Старт
  document.addEventListener('DOMContentLoaded', route);
  window.addEventListener('hashchange', route);
}

