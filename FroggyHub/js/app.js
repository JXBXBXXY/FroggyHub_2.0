const SCREENS = ["home","auth","profile","settings"];
export function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle("visible", s === id);
    if (el) el.setAttribute("aria-hidden", String(s !== id));
  });
  if (id !== "auth") location.hash = `#${id}`;
}

function bindTopNav() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-link]");
    if (!a) return;
    const to = a.getAttribute("data-link");
    if (SCREENS.includes(to)) {
      e.preventDefault();
      showScreen(to);
    }
  });
  window.addEventListener("hashchange", () => {
    const id = (location.hash.replace("#","") || "home");
    showScreen(SCREENS.includes(id) ? id : "home");
  });
}

import { getSession, signInWithNicknameOrEmail } from "./api.js";

async function initAuthFlow() {
  // Показать home сразу (фон, меню), затем проверить сессию и показать auth при необходимости
  showScreen("home");
  const session = await getSession();
  if (!session) showScreen("auth");

  const form = document.getElementById("auth-form");
  if (form && !form.__bound) {
    form.__bound = true;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const login = fd.get("login")?.toString().trim();
      const password = fd.get("password")?.toString();
      form.querySelector("button[type=submit]")?.setAttribute("disabled","true");
      try {
        const sess = await signInWithNicknameOrEmail({ login, password });
        if (sess) {
          showScreen("home");
        }
      } catch (err) {
        console.error("Auth failed", err);
        form.querySelector("[data-error]")?.replaceChildren(document.createTextNode("Ошибка входа"));
      } finally {
        form.querySelector("button[type=submit]")?.removeAttribute("disabled");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindTopNav();
  initAuthFlow();
  startBubbles(); // см. ниже
});

// CALM bubbles
const messages = window.FH_MESSAGES || [
  "Друзья, до встречи 🌿","Я за пивом 🍺","Я приду в 9 🕘","Поставлю чайник 🫖","Заберу пиццу по пути 🍕",
  "Кто возьмет колу? 🥤","Добавил плейлист 🎶","Буду +1 🙂","Я за печеньем 🍪","Кто на метро 🚇"
];

function jitterGrid(cols=8, rows=6, margin=16) {
  const w = innerWidth, h = innerHeight;
  const cellW = Math.max(160, (w - margin*2) / cols);
  const cellH = Math.max(56,  (h - margin*2) / rows);
  const pts = [];
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    const x = margin + c*cellW + (Math.random()-0.5)*cellW*0.25;
    const y = margin + r*cellH + (Math.random()-0.5)*cellH*0.25;
    pts.push({x,y});
  }
  return {pts, cellW, cellH};
}

function createChip(msg) {
  const el = document.createElement("div");
  el.className = "fh-chip";
  el.textContent = msg;
  el.style.position = "absolute";
  el.style.padding = "6px 14px";
  el.style.borderRadius = "999px";
  el.style.background = "rgba(23, 65, 53, .85)";
  el.style.boxShadow = "0 2px 10px rgba(0,0,0,.25)";
  el.style.color = "var(--chip-fg, #e9ffe8)";
  el.style.fontSize = "14px";
  el.style.opacity = "0";
  el.style.transition = "opacity .6s ease, transform .6s ease";
  return el;
}

let bubblesState = { slots: [], idx: 0, holder: null };
function layoutChips() {
  const holder = bubblesState.holder || document.querySelector(".fh-bubbles");
  if (!holder) return;
  holder.replaceChildren();
  const { pts, cellW, cellH } = jitterGrid(9, 6, 24);
  bubblesState.slots = pts;
  bubblesState.holder = holder;

  const N = Math.min(pts.length, 28);
  for (let i=0; i<N; i++) {
    const msg = messages[(i + Math.floor(Math.random()*messages.length)) % messages.length];
    const chip = createChip(msg);
    const p = pts[i];
    chip.style.left = `${p.x}px`;
    chip.style.top  = `${p.y}px`;
    holder.appendChild(chip);
    requestAnimationFrame(()=> chip.style.opacity = "1");
  }
  // жизненный цикл
  cycleChips();
}

function cycleChips() {
  const holder = bubblesState.holder;
  if (!holder) return;
  const chips = [...holder.children];
  chips.forEach((chip, i) => {
    const delay = 800 + Math.random()*1800; // между волнами
    setTimeout(() => {
      chip.style.opacity = "0";
      chip.style.transform = `translate(${(Math.random()-0.5)*30}px, ${(Math.random()-0.5)*30}px)`;
      setTimeout(() => {
        // выбрать новый свободный слот
        const p = bubblesState.slots[(i + 3 + Math.floor(Math.random()*7)) % bubblesState.slots.length];
        chip.textContent = messages[Math.floor(Math.random()*messages.length)];
        chip.style.left = `${p.x}px`;
        chip.style.top  = `${p.y}px`;
        chip.style.transform = "translate(0,0)";
        chip.style.opacity = "1";
      }, 600);
    }, 3000 + delay);
  });
  // перезапуск цикла раз в 6–8 секунд
  setTimeout(cycleChips, 6000 + Math.random()*2000);
}

function startBubbles() {
  layoutChips();
  addEventListener("resize", () => {
    // мягко переложить сетку при ресайзе
    clearTimeout(startBubbles.__t);
    startBubbles.__t = setTimeout(layoutChips, 200);
  });
}
