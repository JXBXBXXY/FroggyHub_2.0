'use client';
import { ReactNode } from 'react';

export function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
