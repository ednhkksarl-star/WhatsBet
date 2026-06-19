import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import { formatDisplayPhone } from "@/lib/conversations";
import { reconcilePendingDeposits } from "@/lib/deposits";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const selectedId = req.nextUrl.searchParams.get("selectedId") ?? undefined;
  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60_000);

  await reconcilePendingDeposits({ limit: 10 });

  const db = getDb();
  const serverTime = new Date().toISOString();

  const usersWithMessages = await db
    .selectDistinct({
      id: users.id,
      phone: users.phone,
      whatsappJid: users.whatsappJid,
      name: users.name,
      profilePictureBase64: users.profilePictureBase64,
      balance: users.balance,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(messages, eq(messages.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(100);

  const conversations = [];
  for (const user of usersWithMessages) {
    const [lastMsg] = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, user.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const [counts] = await db
      .select({
        userCount: sql<number>`count(*) filter (where ${messages.fromMe} = false)`,
        botCount: sql<number>`count(*) filter (where ${messages.fromMe} = true)`,
      })
      .from(messages)
      .where(eq(messages.userId, user.id));

    const lastAt = lastMsg?.createdAt;
    const changed = lastAt && lastAt >= since;

    conversations.push({
      id: user.id,
      phone: user.phone,
      displayPhone: formatDisplayPhone(user.phone, user.whatsappJid),
      whatsappJid: user.whatsappJid,
      profilePictureBase64: user.profilePictureBase64,
      name: user.name,
      balance: user.balance,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      lastMessage: lastMsg?.text,
      lastMessageAt: lastAt?.toISOString(),
      userMessageCount: Number(counts?.userCount ?? 0),
      botMessageCount: Number(counts?.botCount ?? 0),
      unread: lastMsg ? !lastMsg.fromMe : false,
      changed,
    });
  }

  conversations.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  let newMessages: Array<{ id: string; text: string; fromMe: boolean; createdAt: string }> = [];

  if (selectedId) {
    const rows = await db
      .select()
      .from(messages)
      .where(and(eq(messages.userId, selectedId), gte(messages.createdAt, since)))
      .orderBy(messages.createdAt);

    newMessages = rows.map((m) => ({
      id: m.id,
      text: m.text,
      fromMe: m.fromMe,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  return NextResponse.json({
    serverTime,
    conversations,
    messages: newMessages,
  });
}
