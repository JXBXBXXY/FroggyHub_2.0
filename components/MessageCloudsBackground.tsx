"use client";
import { useEffect, useRef, useState } from "react";

// Фразы для фоновых сообщений.
const MESSAGES = [
  "давайте сегодня тусовку?",
  "в FroggyHub удобнее, чем создавать группы)",
  "а я знаю что я возьму на день рождение другу)",
  "приходи к 19:00 ✨",
  "беру настолки!",
];

// Параметры генерации.
const SAFE_TOP = 80; // под фиксированной шапкой ничего не рисуем
const RESIZE_DEBOUNCE = 180;
const BBOX_PAD = 8;

interface Cloud {
  x: number; // базовая позиция (left)
  y: number; // базовая позиция (top)
  w: number;
  h: number;
  phase: number; // стартовая фаза дрейфа
  ampX: number; // амплитуда дрейфа по X
  ampY: number; // амплитуда дрейфа по Y
  z: number; // z-index для небольшого параллакса
  text: string;
}

export default function MessageCloudsBackground() {
  const refs = useRef<HTMLDivElement[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);

  // Вычисляем позиции и размеры облачков.
  useEffect(() => {
    let timer: NodeJS.Timeout;

    function compute() {
      refs.current = [];
      const w = window.innerWidth;
      const h = window.innerHeight;
      const area = w * h;
      const isMobile = w < 640;
      const dpr = window.devicePixelRatio || 1;

      // Количество элементов зависит от площади экрана.
      let count = clamp(10, Math.round(area / 50000), 28);
      if (isMobile) count = Math.round(count * 0.8);

      // Средний размер «капсулы».
      const avgW = isMobile ? 130 : 160;
      const avgH = isMobile ? 34 : 40;

      // Радиус для Poisson-disk (адаптивный).
      const baseRadius = clamp(10, Math.min(w, h) * 0.035, 42);
      let radius = baseRadius;
      if (isMobile) radius *= 0.85;
      if (dpr >= 2) radius *= 1.1;

      // Зона героя в центре экрана (из неё исключаем точки).
      const heroW = w * 0.4;
      const heroH = h * 0.42;
      const hero = {
        left: w / 2 - heroW / 2,
        top: h / 2 - heroH / 2,
        right: w / 2 + heroW / 2,
        bottom: h / 2 + heroH / 2,
      };

      const rng = mulberry32(1); // фиксированный seed => детерминированность
      const samples = poissonDisk(w, h, radius, rng, count * 5);

      const next: Cloud[] = [];
      for (const [cx, cy] of samples) {
        const x = cx - avgW / 2;
        const y = cy - avgH / 2;
        const box = {
          left: x - BBOX_PAD,
          top: y - BBOX_PAD,
          right: x + avgW + BBOX_PAD,
          bottom: y + avgH + BBOX_PAD,
        };
        if (box.top < SAFE_TOP) continue;
        if (rectsIntersect(box, hero)) continue;
        let overlap = false;
        for (const c of next) {
          const exist = {
            left: c.x - BBOX_PAD,
            top: c.y - BBOX_PAD,
            right: c.x + c.w + BBOX_PAD,
            bottom: c.y + c.h + BBOX_PAD,
          };
          if (rectsIntersect(box, exist)) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;
        next.push({
          x,
          y,
          w: avgW,
          h: avgH,
          phase: rng() * Math.PI * 2,
          ampX: 6 + rng() * 4,
          ampY: 6 + rng() * 4,
          z: 10 + Math.floor(rng() * 10),
          text: MESSAGES[next.length % MESSAGES.length],
        });
        if (next.length >= count) break;
      }
      setClouds(next);
    }

    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(compute, RESIZE_DEBOUNCE);
    }

    compute();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Мягкий дрейф позиций с использованием transform.
  useEffect(() => {
    if (!clouds.length) return;
    const els = refs.current;
    const start = performance.now();
    let frame: number;

    function animate(now: number) {
      const t = (now - start) / 1000;
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        const el = els[i];
        if (!el) continue;
        const dx = Math.sin(t + c.phase) * c.ampX;
        const dy = Math.sin(t * 1.3 + c.phase) * c.ampY;
        el.style.transform = `translate3d(${c.x + dx}px, ${c.y + dy}px, 0)`;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [clouds]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {clouds.map((c, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          className="absolute will-change-transform opacity-20"
          style={{ transform: `translate3d(${c.x}px, ${c.y}px, 0)`, zIndex: c.z }}
        >
          <div className="rounded-2xl bg-white/8 backdrop-blur-sm ring-1 ring-white/10 px-4 py-2 text-sm text-white/80 shadow">
            {c.text}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- utils ----------

/** Псевдо-случайный генератор c фиксированным seed. */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function rectsIntersect(a: Rect, b: Rect) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Poisson-disk sampling по алгоритму Bridson.
 * Возвращает массив точек [x,y] с минимальным расстоянием radius.
 */
function poissonDisk(
  width: number,
  height: number,
  radius: number,
  rng: () => number,
  maxPoints: number
) {
  const k = 30; // попыток вокруг активной точки
  const cellSize = radius / Math.SQRT2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array<number>(gridWidth * gridHeight).fill(-1);
  const points: [number, number][] = [];
  const active: number[] = [];

  function insert(x: number, y: number) {
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    grid[gx + gy * gridWidth] = points.length;
    points.push([x, y]);
    active.push(points.length - 1);
  }

  function hasNear(x: number, y: number) {
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    for (let yy = gy - 2; yy <= gy + 2; yy++) {
      for (let xx = gx - 2; xx <= gx + 2; xx++) {
        if (xx < 0 || yy < 0 || xx >= gridWidth || yy >= gridHeight) continue;
        const idx = grid[xx + yy * gridWidth];
        if (idx !== -1) {
          const p = points[idx];
          const dx = p[0] - x;
          const dy = p[1] - y;
          if (dx * dx + dy * dy < radius * radius) return true;
        }
      }
    }
    return false;
  }

  insert(rng() * width, rng() * height);

  while (active.length && points.length < maxPoints) {
    const idx = Math.floor(rng() * active.length);
    const [x, y] = points[active[idx]];
    let placed = false;
    for (let i = 0; i < k; i++) {
      const ang = rng() * Math.PI * 2;
      const dist = radius * (1 + rng());
      const nx = x + Math.cos(ang) * dist;
      const ny = y + Math.sin(ang) * dist;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !hasNear(nx, ny)) {
        insert(nx, ny);
        placed = true;
        break;
      }
    }
    if (!placed) {
      active.splice(idx, 1);
    }
  }

  return points;
}

