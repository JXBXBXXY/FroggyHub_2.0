import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';
import { settingsSchema } from '@/lib/schema';

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PATCH(req: Request) {
  const json = await req.json();
  const parsed = settingsSchema.partial().parse(json);
  const updated = updateSettings(parsed);
  return NextResponse.json(updated);
}
