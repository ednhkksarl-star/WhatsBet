import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search } from "lucide-react";

export default async function ConversationsPage() {
  const conversations: Array<{
    id: string;
    phone: string;
    name: string | null;
    lastMessage?: string;
    lastMessageAt?: Date;
  }> = [];

  try {
    const db = getDb();
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(50);

    for (const user of allUsers) {
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.userId, user.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      conversations.push({
        id: user.id,
        phone: user.phone,
        name: user.name,
        lastMessage: lastMsg?.text,
        lastMessageAt: lastMsg?.createdAt,
      });
    }

    conversations.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Conversations" description="Historique des échanges WhatsApp avec les joueurs" />

      <Card className="overflow-hidden">
        <div className="grid h-[calc(100vh-14rem)] grid-cols-1 md:grid-cols-3">
          <div className="flex flex-col border-r border-white/5">
            <div className="border-b border-white/5 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-9 h-9" disabled />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted">Aucune conversation</div>
              ) : (
                conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/dashboard/conversations/${conv.id}`}
                    className="flex items-center gap-3 border-b border-white/5 px-4 py-3.5 transition hover:bg-white/[0.03]"
                  >
                    <Avatar name={conv.name ?? conv.phone} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-white">{conv.name ?? conv.phone}</p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(conv.lastMessageAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">{conv.lastMessage ?? "Aucun message"}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="col-span-2 hidden flex-col items-center justify-center p-8 md:flex">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <MessageSquare className="h-8 w-8 text-muted" />
            </div>
            <h2 className="text-lg font-semibold text-white">Sélectionnez une conversation</h2>
            <p className="mt-2 max-w-sm text-center text-sm text-muted">
              Choisissez un joueur pour voir l&apos;historique de ses échanges avec le bot WhatsApp.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
