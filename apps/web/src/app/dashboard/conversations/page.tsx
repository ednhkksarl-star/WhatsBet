import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import { isValidDisplayPhone } from "@whatsbet/shared";
import { formatDisplayPhone } from "@/lib/conversations";
import { syncInvalidUserPhones } from "@/lib/sync-user-phone";
import {
  ConversationsModule,
  type ConversationMessage,
  type ConversationSummary,
} from "@/components/conversations/conversations-module";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConversationsPage({ searchParams }: Props) {
  const { id: selectedId } = await searchParams;
  const conversations: ConversationSummary[] = [];
  let selectedMessages: ConversationMessage[] = [];

  try {
    const db = getDb();
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

    await syncInvalidUserPhones(
      usersWithMessages.filter((u) => u.whatsappJid && !isValidDisplayPhone(u.phone)).map((u) => u.id)
    );

    for (const user of usersWithMessages) {
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, user.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const [freshUser] = await db
        .select({ phone: users.phone })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const phone = freshUser?.phone ?? user.phone;

      const [counts] = await db
        .select({
          userCount: sql<number>`count(*) filter (where ${messages.fromMe} = false)`,
          botCount: sql<number>`count(*) filter (where ${messages.fromMe} = true)`,
        })
        .from(messages)
        .where(eq(messages.userId, user.id));

      conversations.push({
        id: user.id,
        phone,
        displayPhone: formatDisplayPhone(phone, user.whatsappJid),
        whatsappJid: user.whatsappJid,
        profilePictureBase64: user.profilePictureBase64,
        name: user.name,
        balance: user.balance,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        lastMessage: lastMsg?.text,
        lastMessageAt: lastMsg?.createdAt.toISOString(),
        userMessageCount: Number(counts?.userCount ?? 0),
        botMessageCount: Number(counts?.botCount ?? 0),
        unread: lastMsg ? !lastMsg.fromMe : false,
      });
    }

    conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    if (selectedId) {
      const rows = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, selectedId))
        .orderBy(desc(messages.createdAt))
        .limit(200);

      selectedMessages = rows.map((m) => ({
        id: m.id,
        text: m.text,
        fromMe: m.fromMe,
        createdAt: m.createdAt.toISOString(),
      }));
    }
  } catch {
    /* DB not ready */
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col lg:-m-8">
      <ConversationsModule
        conversations={conversations}
        messages={selectedMessages}
        selectedId={selectedId}
      />
    </div>
  );
}
