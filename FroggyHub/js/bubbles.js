// js/bubbles.js
export function initBubbles({ containerId = 'fh-message-clouds', count = 7 } = {}) {
  const root = document.getElementById(containerId);
  if (!root) return;

  const MARGIN = 12;                 // внутренний "зазор" от краёв
  const CELL_W = 160, CELL_H = 120;  // виртуальная сетка
  const MIN_DIST = 48;               // мин. дистанция между центрами
  const LIFETIME = 3200;             // "жизнь" в мс
  const ENTER_MS = 320, EXIT_MS = 320;

  // соберём тексты из уже имеющихся .bubble.chip (если есть), иначе fallback
  const texts = Array.from(root.querySelectorAll('.bubble.chip'))
    .map(n => n.textContent.trim())
    .filter(Boolean);
  const FALLBACK = [
    'Я возьму пиццу', 'Я приду в 9', 'Постучите в дверь', 'Куплю свечи',
    'Нужны тарелки?', 'Я возьму игры', 'Без лука, пожалуйста', 'Кто за музыкой?',
    'Скину адрес в чат', 'Нужен чайник?', 'Буду через 15', 'Я заберу торт',
  ];
  const pool = texts.length ? texts : FALLBACK;

  // очищаем контейнер — но НЕ трогаем исходные DOM-узлы вне контейнера
  root.innerHTML = '';

  function getGridPositions(w, h) {
    const cols = Math.max(1, Math.floor((w - MARGIN * 2) / CELL_W));
    const rows = Math.max(1, Math.floor((h - MARGIN * 2) / CELL_H));
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = MARGIN + c * CELL_W + Math.random() * 32 - 16;
        const y = MARGIN + r * CELL_H + Math.random() * 24 - 12;
        cells.push({ x, y });
      }
    }
    return cells.sort(() => Math.random() - 0.5);
  }

  function okDistance(x, y, placed) {
    for (const p of placed) {
      const dx = p.x - x, dy = p.y - y;
      if (Math.hypot(dx, dy) < MIN_DIST) return false;
    }
    return true;
  }

  function spawnWave() {
    const { clientWidth: w, clientHeight: h } = root;
    const cells = getGridPositions(w, h);
    const placed = [];
    const items = [];

    // выбираем не более `count` корректных позиций
    for (let i = 0; i < cells.length && placed.length < count; i++) {
      const { x, y } = cells[i];
      if (okDistance(x, y, placed)) {
        placed.push({ x, y });
      }
    }

    // создаём элементы на выбранных местах
    placed.forEach((pos, idx) => {
      const el = document.createElement('div');
      el.className = 'bubble chip bubble-enter';
      el.textContent = pool[Math.floor(Math.random() * pool.length)];
      // задаём кастомные CSS-переменные для трансформа
      el.style.setProperty('--tx', `${pos.x}px`);
      el.style.setProperty('--ty', `${pos.y}px`);
      root.appendChild(el);
      // после enter → alive → exit → remove → respawn
      setTimeout(() => {
        el.classList.remove('bubble-enter');
        el.classList.add('bubble-alive');
        setTimeout(() => {
          el.classList.remove('bubble-alive');
          el.classList.add('bubble-exit');
          setTimeout(() => {
            el.remove();
            // запускаем новый пузырь вместо удалённого
            respawnOne();
          }, EXIT_MS);
        }, LIFETIME);
      }, ENTER_MS);
      items.push(el);
    });
  }

  function respawnOne() {
    const { clientWidth: w, clientHeight: h } = root;
    const existing = Array.from(root.querySelectorAll('.bubble.chip'))
      .map(el => {
        const tx = parseFloat(getComputedStyle(el).getPropertyValue('--tx')) || 0;
        const ty = parseFloat(getComputedStyle(el).getPropertyValue('--ty')) || 0;
        return { x: tx, y: ty };
      });

    const cells = getGridPositions(w, h);
    let candidate = null;
    for (const c of cells) {
      if (okDistance(c.x, c.y, existing)) { candidate = c; break; }
    }
    if (!candidate) return;

    const el = document.createElement('div');
    el.className = 'bubble chip bubble-enter';
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    el.style.setProperty('--tx', `${candidate.x}px`);
    el.style.setProperty('--ty', `${candidate.y}px`);
    root.appendChild(el);

    setTimeout(() => {
      el.classList.remove('bubble-enter');
      el.classList.add('bubble-alive');
      setTimeout(() => {
        el.classList.remove('bubble-alive');
        el.classList.add('bubble-exit');
        setTimeout(() => el.remove(), EXIT_MS);
      }, LIFETIME);
    }, ENTER_MS);
  }

  // первая волна
  spawnWave();
  // на ресайз — пересоздаём волны мягко (чтобы не залипали в углу)
  let rid = null;
  window.addEventListener('resize', () => {
    if (rid) cancelAnimationFrame(rid);
    rid = requestAnimationFrame(() => {
      root.innerHTML = '';
      spawnWave();
    });
  }, { passive: true });
}
