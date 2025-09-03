import "./globals.css";
import type { Metadata } from "next";
import GlassLogoBackground from "@/components/GlassLogoBackground";

export const metadata: Metadata = { title: "FroggyHub — события и вишлисты" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preload" href="/assets/frog_idle.png" as="image" />
      </head>
      {/* предотвращаем «дрожание» при появлении скролла */}
      <body className="min-h-screen text-white overflow-hidden">
        <GlassLogoBackground />
        {/* весь контент поверх фона */}
        <div className="relative z-20 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
