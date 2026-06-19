import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import { gatewaySendMessage } from "@/lib/gateway-client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId, text } = await req.json();
  if (!userId || !text?.trim()) {
    return NextResponse.json({ error: "userId et text requis" }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  try {
    await gatewaySendMessage({
      phone: user.phone,
      jid: user.whatsappJid,
      text: text.trim(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Échec envoi WhatsApp" },
      { status: 503 }
    );
  }

  const [msg] = await db
    .insert(messages)
    .values({ userId: user.id, text: text.trim(), fromMe: true })
    .returning();

  return NextResponse.json({
    ok: true,
    message: {
      id: msg.id,
      text: msg.text,
      fromMe: msg.fromMe,
      createdAt: msg.createdAt.toISOString(),
    },
  });
}
