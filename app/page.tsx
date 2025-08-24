import Link from "next/link";
import FrogWithStump from "@/components/FrogWithStump";
import MessageCloudsBackground from "@/components/MessageCloudsBackground";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0b241b]">
      <MessageCloudsBackground />
      <div className="relative z-10 flex flex-col items-center">
        <FrogWithStump frogWidth={680} />
        <Link href="/settings" className="mt-8 rounded bg-green-600 px-6 py-3 text-white hover:bg-green-500">
          Настройки
        </Link>
      </div>
    </main>
  );
}

