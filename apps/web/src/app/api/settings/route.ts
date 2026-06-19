import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { settings } from "@whatsbet/database";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    const allSettings = await db.select().from(settings);
    
    const result: Record<string, unknown> = {};
    allSettings.forEach(s => {
      result[s.key] = s.value;
    });

    return NextResponse.json({
      botNumber: (result.bot_number as string) || "",
    });
  } catch (err) {
    console.error("Failed to get settings:", err);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    const { botNumber } = body;

    // Upsert bot_number
    const existing = await db.select().from(settings).where(eq(settings.key, "bot_number")).limit(1);
    
    if (existing.length > 0) {
      await db.update(settings)
        .set({ value: botNumber, updatedAt: new Date() })
        .where(eq(settings.key, "bot_number"));
    } else {
      await db.insert(settings)
        .values({ key: "bot_number", value: botNumber });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save settings:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
