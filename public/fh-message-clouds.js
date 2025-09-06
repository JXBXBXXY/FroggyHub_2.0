(() => {
  const MESSAGES = [
    "Я приду к 19:00 ✨", "Я возьму пиццу 🍕", "Кто возьмёт колу? 🥤",
    "Ребят, постучите в дверь 🚪", "Буду позже 🙈", "Добавил плейлист 🎶",
    "Кто возьмет настолки? 🎲", "Буду через 15 минут ⏳", "Я за пивом 🍺",
    "Буду online 💻", "Встречаемся у метро 🚉", "Я за мороженым 🍦",
    "Принесу колонку 📢", "Сделаем фото 📸", "Не забудьте зарядки 🔌",
    "Привезу попкорн 🍿", "Подготовлю викторину ❓", "Нужен штопор?",
    "Устроим караоке", "Кто возьмет тарелки?", "Заберу пиццу по пути",
    "Я за салатом", "Буду с +1", "Берите тёплые вещи", "Давайте играть в мафию",
    "Принесу проектор", "У меня есть проектор", "Привезу настольный футбол",
    "Прикажу фрукты", "Кто за лимонадом?", "Друзья, до встречи",
    "У кого есть карты?", "Привезу геймпад", "Я за хлопьями",
    "Я возьму сок", "Привезу на час раньше", "Что возьмёт кофе?",
    "Где парусник?"
  ];

  const clouds = [];
  let frame;
  let resizeTimer;

  function init() {
    const container = document.getElementById('fh-message-clouds');
    if (!container) return;
    container.innerHTML = '';
    const max = MESSAGES.length;
    for (let i = 0; i < max; i++) {
      const el = document.createElement('div');
      el.className = 'fh-message-cloud';
      el.textContent = MESSAGES[i % MESSAGES.length];
      container.appendChild(el);
      const rect = el.getBoundingClientRect();
      const cloud = {
        el,
        w: rect.width,
        h: rect.height,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
      };
      clouds.push(cloud);
    }
    positionClouds();
    observeVisibility();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
  }

  function positionClouds() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const c of clouds) {
      let tries = 0;
      do {
        c.x = Math.random() * (w - c.w);
        c.y = Math.random() * (h - c.h);
        var overlap = clouds.some(o => o !== c && intersects(c, o));
        tries++;
      } while (overlap && tries < 50);
      c.vx = (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
      c.vy = (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }
  }

  function start() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  }

  function tick() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const c of clouds) {
      c.x += c.vx;
      c.y += c.vy;
      if (c.x <= 0 || c.x + c.w >= w) {
        c.vx *= -1;
        c.x = Math.max(0, Math.min(c.x, w - c.w));
      }
      if (c.y <= 0 || c.y + c.h >= h) {
        c.vy *= -1;
        c.y = Math.max(0, Math.min(c.y, h - c.h));
      }
    }
    for (let i = 0; i < clouds.length; i++) {
      const a = clouds[i];
      for (let j = i + 1; j < clouds.length; j++) {
        const b = clouds[j];
        if (intersects(a, b)) {
          const vx = a.vx; a.vx = b.vx; b.vx = vx;
          const vy = a.vy; a.vy = b.vy; b.vy = vy;
        }
      }
    }
    for (const c of clouds) {
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }
    frame = requestAnimationFrame(tick);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const c of clouds) {
        c.x = Math.min(c.x, w - c.w);
        c.y = Math.min(c.y, h - c.h);
      }
    }, 200);
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else {
      start();
    }
  }

  function observeVisibility() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.style.visibility = e.isIntersecting ? 'visible' : 'hidden';
      });
    });
    clouds.forEach((c) => observer.observe(c.el));
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
