import Link from "next/link";
import FrogWithStump from "@/components/FrogWithStump";
import MessageCloudsBackground from "@/components/MessageCloudsBackground";

export default function HomePage() {
  return (
    <main className="relative min-h-[100svh] flex items-center justify-center overflow-hidden px-4">
      {/* облачка ниже контента */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <MessageCloudsBackground />
      </div>

      <div className="relative z-20 flex flex-col items-center gap-6 text-center">
        <FrogWithStump />
        <h1 className="text-4xl sm:text-5xl font-semibold">FroggyHub</h1>

        {/* CTA-панель */}
        <div
          id="fh-cta"
          className="flex w-full max-w-3xl flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/20 backdrop-blur-sm rounded-xl p-3"
        >
          <Link
            href="/create"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500 text-center"
          >
            Создать событие
          </Link>

          <input
            id="joinCodeInput"
            className="flex-1 rounded bg-white/10 px-3 py-2 text-white placeholder:text-white/40 outline-none"
            placeholder="Введите 6-значный код"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
          />

          <button
            id="joinBtn"
            className="rounded bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            onClick={() => {
              const el = document.getElementById("joinCodeInput") as HTMLInputElement | null;
              const code = (el?.value || "").trim();
              if (/^\d{6}$/.test(code)) window.location.href = `/join?code=${code}`;
              else el?.focus();
            }}
          >
            Присоединиться
          </button>
        </div>
      </div>
    </main>
  );
}
