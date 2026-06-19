import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { withdrawals, users } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";
import { WithdrawalActions } from "@/components/withdrawal-actions";
import { ArrowUpCircle } from "lucide-react";

export default async function WithdrawalsPage() {
  let rows: Array<{ w: typeof withdrawals.$inferSelect; user: typeof users.$inferSelect | null }> = [];
  try {
    rows = await getDb()
      .select({ w: withdrawals, user: users })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.createdAt))
      .limit(50);
  } catch { /* DB not ready */ }

  const pending = rows.filter((r) => r.w.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Retraits"
        description="Validation manuelle des demandes de retrait Mobile Money"
        badge={pending > 0 ? `${pending} en attente` : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState icon={ArrowUpCircle} title="Aucun retrait" description="Les demandes de retrait des joueurs apparaîtront ici pour validation." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Joueur</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Mobile Money</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(({ w, user }) => (
                  <tr key={w.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white">{user?.phone ?? "—"}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{formatCdf(w.amount)}</td>
                    <td className="px-6 py-4 font-mono text-muted">{w.mobileMoneyNumber}</td>
                    <td className="px-6 py-4 text-muted">{new Date(w.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-4"><Badge status={w.status} /></td>
                    <td className="px-6 py-4"><WithdrawalActions id={w.id} status={w.status} /></td>
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
