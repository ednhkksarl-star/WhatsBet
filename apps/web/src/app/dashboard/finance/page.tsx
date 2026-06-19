import { eq, count, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { transactions, withdrawals, tickets } from "@whatsbet/database";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Wallet, Percent, TrendingUp } from "lucide-react";

export default async function FinancePage() {
  let finance = {
    totalDeposits: 0, totalWithdrawals: 0, pendingWithdrawals: 0,
    totalVolume: 0, commission: 0, netRevenue: 0,
    recentDeposits: [] as { amount: string; status: string; createdAt: Date }[],
    recentWithdrawals: [] as { amount: string; status: string; createdAt: Date }[],
  };

  try {
    const db = getDb();
    const [dep] = await db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "deposit"));
    const [withTotal] = await db.select({ total: sum(withdrawals.amount) }).from(withdrawals).where(eq(withdrawals.status, "paid"));
    const [pendingW] = await db.select({ count: count() }).from(withdrawals).where(eq(withdrawals.status, "pending"));
    const [vol] = await db.select({ total: sum(tickets.stake) }).from(tickets);

    const totalDeposits = parseFloat(dep?.total ?? "0");
    const totalWithdrawals = parseFloat(withTotal?.total ?? "0");
    const totalVolume = parseFloat(vol?.total ?? "0");
    const commission = totalVolume * 0.05;

    const recentDeposits = await db.select({ amount: transactions.amount, status: transactions.status, createdAt: transactions.createdAt })
      .from(transactions).where(eq(transactions.type, "deposit")).orderBy(transactions.createdAt).limit(5);
    const recentWithdrawals = await db.select({ amount: withdrawals.amount, status: withdrawals.status, createdAt: withdrawals.createdAt })
      .from(withdrawals).orderBy(withdrawals.createdAt).limit(5);

    finance = {
      totalDeposits, totalWithdrawals, pendingWithdrawals: pendingW?.count ?? 0,
      totalVolume, commission, netRevenue: commission + totalDeposits - totalWithdrawals,
      recentDeposits, recentWithdrawals,
    };
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader title="Finance" description="Vue consolidée des flux financiers de la plateforme" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Dépôts totaux" value={formatCdf(finance.totalDeposits)} icon={ArrowDownCircle} changeType="positive" index={0} />
        <StatCard title="Retraits payés" value={formatCdf(finance.totalWithdrawals)} icon={ArrowUpCircle} index={1} />
        <StatCard title="Volume parié" value={formatCdf(finance.totalVolume)} icon={TrendingUp} index={2} />
        <StatCard title="Commissions (5%)" value={formatCdf(finance.commission)} icon={Percent} index={3} />
        <StatCard title="Revenu net estimé" value={formatCdf(finance.netRevenue)} icon={Wallet} changeType="positive" index={4} />
        <StatCard title="Retraits en attente" value={String(finance.pendingWithdrawals)} changeType={finance.pendingWithdrawals > 0 ? "negative" : "neutral"} icon={ArrowUpCircle} index={5} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold text-white">Derniers dépôts</h2></CardHeader>
          <CardContent className="space-y-3">
            {finance.recentDeposits.length === 0 ? (
              <p className="text-sm text-muted">Aucun dépôt</p>
            ) : (
              finance.recentDeposits.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-mono text-sm text-success">{formatCdf(d.amount)}</span>
                  <div className="flex items-center gap-3">
                    <Badge status={d.status} />
                    <span className="text-xs text-muted">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-white">Derniers retraits</h2></CardHeader>
          <CardContent className="space-y-3">
            {finance.recentWithdrawals.length === 0 ? (
              <p className="text-sm text-muted">Aucun retrait</p>
            ) : (
              finance.recentWithdrawals.map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-mono text-sm text-white">{formatCdf(w.amount)}</span>
                  <div className="flex items-center gap-3">
                    <Badge status={w.status} />
                    <span className="text-xs text-muted">{new Date(w.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
