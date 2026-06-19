import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { transactions, users } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";
import { ArrowDownCircle } from "lucide-react";

export default async function DepositsPage() {
  let rows: Array<{ tx: typeof transactions.$inferSelect; user: typeof users.$inferSelect | null }> = [];
  try {
    rows = await getDb()
      .select({ tx: transactions, user: users })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, "deposit"))
      .orderBy(desc(transactions.createdAt))
      .limit(50);
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Dépôts" description="Historique des dépôts SimplyPaye" />

      {rows.length === 0 ? (
        <EmptyState icon={ArrowDownCircle} title="Aucun dépôt" description="Les dépôts Mobile Money des joueurs seront listés ici." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Joueur</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(({ tx, user }) => (
                  <tr key={tx.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white">{user?.phone ?? "—"}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-success">{formatCdf(tx.amount)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted">{tx.reference ?? "—"}</td>
                    <td className="px-6 py-4 text-muted">{new Date(tx.createdAt).toLocaleString("fr-FR")}</td>
                    <td className="px-6 py-4"><Badge status={tx.status} /></td>
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
