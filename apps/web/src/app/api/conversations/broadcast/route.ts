import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import { gatewaySendMessage } from "@/lib/gateway-client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "text requis" }, { status: 400 });
  }

  const db = getDb();
  const recipients = await db
    .selectDistinct({ id: users.id, phone: users.phone, whatsappJid: users.whatsappJid })
    .from(users)
    .innerJoin(messages, sql`${messages.userId} = ${users.id}`);

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Aucun joueur avec historique" }, { status: 400 });
  }

  const trimmed = text.trim();
  let sent = 0;
  const errors: string[] = [];

  for (const user of recipients) {
    try {
      await gatewaySendMessage({
        phone: user.phone,
        jid: user.whatsappJid,
        text: trimmed,
      });
      await db.insert(messages).values({ userId: user.id, text: trimmed, fromMe: true });
      sent++;
    } catch (err) {
      errors.push(`${user.phone}: ${err instanceof Error ? err.message : "échec"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    errors: errors.length ? errors : undefined,
  });
}
