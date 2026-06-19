import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tickets, users } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";
import { Ticket } from "lucide-react";

export default async function TicketsPage() {
  let rows: Array<{ ticket: typeof tickets.$inferSelect; user: typeof users.$inferSelect | null }> = [];
  try {
    rows = await getDb()
      .select({ ticket: tickets, user: users })
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .orderBy(desc(tickets.createdAt))
      .limit(50);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Tickets" description="Tous les paris et combinés de la plateforme" />

      {rows.length === 0 ? (
        <EmptyState icon={Ticket} title="Aucun ticket" description="Les tickets apparaîtront ici dès que les joueurs commenceront à parier via WhatsApp." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Joueur</th>
                  <th className="px-6 py-4">Mise</th>
                  <th className="px-6 py-4">Cote</th>
                  <th className="px-6 py-4">Gain pot.</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(({ ticket, user }) => (
                  <tr key={ticket.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-xs text-muted">{ticket.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-white">{user?.phone ?? "—"}</td>
                    <td className="px-6 py-4">{formatCdf(ticket.stake)}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-yellow-500">×{parseFloat(ticket.totalOdds).toFixed(2)}</td>
                    <td className="px-6 py-4">{formatCdf(ticket.potentialWin)}</td>
                    <td className="px-6 py-4">
                      {ticket.isQuickBet ? (
                        <span className="rounded-full bg-brand-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-yellow-500">QuickBet</span>
                      ) : (
                        <span className="text-muted">Manuel</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><Badge status={ticket.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
