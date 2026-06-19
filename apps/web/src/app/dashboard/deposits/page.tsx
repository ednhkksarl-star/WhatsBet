import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { transactions, users } from "@whatsbet/database";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DepositsLiveTable } from "@/components/deposits/deposits-live-table";
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
          <DepositsLiveTable
            initialRows={rows.map(({ tx, user }) => ({
              id: tx.id,
              phone: user?.phone ?? "—",
              amount: tx.amount,
              reference: tx.reference,
              status: tx.status,
              createdAt: tx.createdAt.toISOString(),
            }))}
          />
        </Card>
      )}
    </div>
  );
}
