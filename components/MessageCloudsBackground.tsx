"use client";

const MESSAGES = [
  "давайте сегодня тусовку?",
  "в FroggyHub удобнее, чем создавать группы)",
  "а я знаю что я возьму на день рождение другу)",
  "приходи к 19:00 ✨",
  "беру настолки!",
];

export default function MessageCloudsBackground() {
  const spots = [
    { top: "12%", left: "8%", r: -8 }, { top: "20%", left: "72%", r: 7 },
    { top: "36%", left: "18%", r: 4 },  { top: "44%", left: "60%", r: -6 },
    { top: "62%", left: "10%", r: 8 },  { top: "68%", left: "70%", r: -10 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {spots.map((s, i) => (
        <div key={i} className="absolute"
             style={{ top: s.top, left: s.left, transform:`rotate(${s.r}deg)`, opacity:0.18 }}>
          <div className="rounded-2xl bg-white/8 backdrop-blur-sm ring-1 ring-white/10 px-4 py-2 text-sm text-white/80 shadow">
            {MESSAGES[i % MESSAGES.length]}
          </div>
        </div>
      ))}
    </div>
  );
}

