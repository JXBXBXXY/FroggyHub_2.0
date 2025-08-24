'use client';
import Image from 'next/image';

export function EmptyState({ src, alt, children }: { src: string; alt: string; children: React.ReactNode }) {
  return (
    <div className="text-center p-8">
      <div className="mx-auto mb-4 w-40 h-40 relative">
        <Image src={src} alt={alt} fill className="object-contain" />
      </div>
      <div className="text-gray-500">{children}</div>
    </div>
  );
}
