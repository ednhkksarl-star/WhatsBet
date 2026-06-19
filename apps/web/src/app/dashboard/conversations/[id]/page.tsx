import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, messages } from "@whatsbet/database";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversationDetailPage({ params }: Props) {
  const { id: userId } = await params;
  const db = getDb();

  let user: typeof users.$inferSelect | undefined;
  let userMessages: (typeof messages.$inferSelect)[] = [];

  try {
    [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) notFound();
    userMessages = await db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt)).limit(100);
  } catch {
    notFound();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/dashboard/conversations" className="text-muted hover:text-white md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={user.name ?? user.phone} size="lg" />
        <div>
          <h1 className="text-lg font-bold text-white">{user.name ?? user.phone}</h1>
          <p className="text-sm text-muted">{user.phone} · {formatCdf(user.balance)}</p>
        </div>
        <Badge status={user.status} className="ml-auto" />
      </div>

      <div className="glass flex flex-1 flex-col overflow-hidden rounded-2xl">
        <div className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto p-4 scrollbar-thin">
          {userMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">Aucun message échangé</div>
          ) : (
            userMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.fromMe
                      ? "rounded-tr-sm bg-brand-yellow-500 text-brand-blue-950"
                      : "rounded-tl-sm bg-white/10 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`mt-1 text-[10px] ${msg.fromMe ? "text-brand-blue-950/60" : "text-muted"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/5 p-4">
          <p className="text-center text-xs text-muted">Réponse manuelle — bientôt disponible</p>
        </div>
      </div>
    </div>
  );
}
