"use client";
import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "давайте сегодня тусовку?",
  "в FroggyHub удобнее, чем создавать группы)",
  "а я знаю что я возьму на день рождение другу)",
  "приходи к 19:00 ✨",
  "беру настолки!",
];

const PADDING = 48;
const MIN_GAP = 16;
const AMP_X = 12;
const AMP_Y = 14;
const ITERATIONS = 200;
const RESIZE_DEBOUNCE = 250;

interface LayoutState {
  baseX: number;
  baseY: number;
  phase: number;
}

export default function MessageCloudsBackground() {
  const refs = useRef<HTMLDivElement[]>([]);
  const [layout, setLayout] = useState<LayoutState[]>([]);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    function computeLayout() {
      const els = refs.current;
      if (!els.length) return;

      const sizes = els.map((el) => {
        const rect = el.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
      });

      const bounds = {
        left: PADDING,
        top: PADDING,
        width: window.innerWidth - PADDING * 2,
        height: window.innerHeight - PADDING * 2,
      };

      let positions = initialRandomPositions(sizes, bounds);
      positions = resolveOverlaps(positions, sizes, bounds);

      const state = positions.map((p) => ({
        baseX: p.x,
        baseY: p.y,
        phase: Math.random() * Math.PI * 2,
      }));
      setLayout(state);
    }

    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(computeLayout, RESIZE_DEBOUNCE);
    };

    computeLayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!layout.length) return;
    const els = refs.current;
    const start = performance.now();
    const bounds = {
      left: PADDING,
      top: PADDING,
      right: window.innerWidth - PADDING,
      bottom: window.innerHeight - PADDING,
    };
    let frame: number;

    function animate(now: number) {
      const t = (now - start) / 1000;
      for (let i = 0; i < layout.length; i++) {
        const s = layout[i];
        const el = els[i];
        const dx = Math.sin(t + s.phase) * AMP_X;
        const dy = Math.sin((t + s.phase * 1.37)) * AMP_Y;
        let x = s.baseX + dx;
        let y = s.baseY + dy;
        x = clamp(x, bounds.left, bounds.right - el.offsetWidth);
        y = clamp(y, bounds.top, bounds.bottom - el.offsetHeight);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [layout]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {MESSAGES.map((m, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          className="absolute will-change-transform opacity-20"
          style={{ transform: "translate3d(-9999px,-9999px,0)" }}
        >
          <div className="rounded-2xl bg-white/8 backdrop-blur-sm ring-1 ring-white/10 px-4 py-2 text-sm text-white/80 shadow">
            {m}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Size { w: number; h: number; }
interface Position { x: number; y: number; }

function initialRandomPositions(sizes: Size[], bounds: { left: number; top: number; width: number; height: number }): Position[] {
  return sizes.map((s) => ({
    x: bounds.left + Math.random() * (bounds.width - s.w),
    y: bounds.top + Math.random() * (bounds.height - s.h),
  }));
}

function resolveOverlaps(positions: Position[], sizes: Size[], bounds: { left: number; top: number; width: number; height: number }): Position[] {
  const grid = createGridTargets(sizes, bounds);
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = { ...positions[i], w: sizes[i].w, h: sizes[i].h };
        const b = { ...positions[j], w: sizes[j].w, h: sizes[j].h };
        const ax = a.x + a.w / 2;
        const ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2;
        const by = b.y + b.h / 2;
        const dx = ax - bx;
        const dy = ay - by;
        const overlapX = (a.w + b.w) / 2 + MIN_GAP - Math.abs(dx);
        const overlapY = (a.h + b.h) / 2 + MIN_GAP - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const overlap = Math.min(overlapX, overlapY) / 2;
          const angle = Math.atan2(dy, dx);
          const ox = Math.cos(angle) * overlap;
          const oy = Math.sin(angle) * overlap;
          positions[i].x += ox;
          positions[i].y += oy;
          positions[j].x -= ox;
          positions[j].y -= oy;
        }
      }
    }
    for (let i = 0; i < positions.length; i++) {
      positions[i].x += (grid[i].x - positions[i].x) * 0.05;
      positions[i].y += (grid[i].y - positions[i].y) * 0.05;
      positions[i].x = clamp(positions[i].x, bounds.left, bounds.left + bounds.width - sizes[i].w);
      positions[i].y = clamp(positions[i].y, bounds.top, bounds.top + bounds.height - sizes[i].h);
    }
  }
  return positions;
}

function createGridTargets(sizes: Size[], bounds: { left: number; top: number; width: number; height: number }): Position[] {
  const n = sizes.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = bounds.width / cols;
  const cellH = bounds.height / rows;
  const targets: Position[] = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    targets.push({
      x: bounds.left + col * cellW + cellW / 2 - sizes[i].w / 2,
      y: bounds.top + row * cellH + cellH / 2 - sizes[i].h / 2,
    });
  }
  return targets;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}
