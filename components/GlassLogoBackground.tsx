"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function GlassLogoBackground() {
  const pathname = usePathname();
  const isHero = pathname === "/" || pathname === "/final";

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/assets/froggy_glass_bg.jpeg"
        alt=""
        fill
        priority
        // На десктопе — cover; на мобилках — слегка отцентрован вверх, чтобы не обрезать «Froggy»
        className={`object-cover transition-all will-change-transform ${
          isHero ? "blur-0 scale-100" : "blur-[6px] scale-[1.03] opacity-90"
        } bg-[#0b241b] [object-position:center_45%] sm:[object-position:center]`}
        sizes="100vw"
      />
      {/* мягкое затемнение, чтобы CTA и текст читались */}
      <div className="absolute inset-0 bg-[#0b241b]/55" />
    </div>
  );
}
