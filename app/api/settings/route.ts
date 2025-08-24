import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { settingsSchema } from "@/lib/schema";

export async function GET() {
  const data = await getSettings();
  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const current = await getSettings();
    const merged = { ...current, ...body };
    const parsed = settingsSchema.parse(merged);
    await updateSettings(parsed);
    return NextResponse.json(parsed, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Invalid payload" }, { status: 400 });
  }
}

