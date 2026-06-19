import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { messages, conversationSessions } from "@whatsbet/database";

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userIds } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds requis" }, { status: 400 });
  }

  const db = getDb();
  await db.delete(messages).where(inArray(messages.userId, userIds));
  await db.delete(conversationSessions).where(inArray(conversationSessions.userId, userIds));

  return NextResponse.json({ ok: true, deleted: userIds.length });
}
