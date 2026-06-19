import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { notifications, users } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/page-header";
import { Bell, MessageCircle } from "lucide-react";

export default async function NotificationsPage() {
  let rows: Array<{ notif: typeof notifications.$inferSelect; user: typeof users.$inferSelect | null }> = [];

  try {
    rows = await getDb()
      .select({ notif: notifications, user: users })
      .from(notifications)
      .leftJoin(users, eq(notifications.userId, users.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Historique des notifications WhatsApp envoyées aux joueurs"
        badge={`${rows.filter((r) => r.notif.sent).length} envoyées`}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          description="Les notifications apparaîtront ici lorsque des tickets seront créés, gagnés ou que des dépôts seront confirmés."
        />
      ) : (
        <div className="space-y-3">
          {rows.map(({ notif, user }) => (
            <Card key={notif.id}>
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-800/60">
                  <MessageCircle className="h-5 w-5 text-brand-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{user?.phone ?? "—"}</span>
                    <Badge status={notif.sent ? "completed" : "pending"} />
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">{notif.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{notif.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(notif.createdAt).toLocaleString("fr-FR")}
                    {notif.sentAt && ` · Envoyé ${new Date(notif.sentAt).toLocaleString("fr-FR")}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
