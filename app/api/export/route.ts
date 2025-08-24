import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export async function GET() {
  const data = {
    settings: getSettings(),
    events: [],
    guests: [],
  };
  return new NextResponse(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="froggyhub-export.json"',
    },
  });
}
