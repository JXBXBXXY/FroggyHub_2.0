"use client";
import Image from "next/image";

interface Props { frogWidth?: number; }

export default function FrogWithStump({ frogWidth = 680 }: Props) {
  const frogHeight = Math.round(frogWidth * 0.62);
  const stumpWidth = Math.round(frogWidth * 0.43);
  const stumpHeight = Math.round(frogHeight * 0.20);

    return (
      <div className="relative mx-auto" style={{ width: frogWidth, height: frogHeight }}>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: Math.round(frogHeight * 0.06), width: stumpWidth, height: stumpHeight }}
        >
          <Image
            src="/assets/stump.png"
            alt="\u041f\u0435\u043d\u044c"
            fill
            loading="eager"
            priority
            className="object-contain"
            sizes={`${stumpWidth}px`}
          />
        </div>
        <Image
          src="/assets/frog_idle.png"
          alt="\u041b\u044f\u0433\u0443\u0448\u043a\u0430"
          fill
          loading="eager"
          priority
          className="object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          sizes={`${frogWidth}px`}
        />
      </div>
    );
}

