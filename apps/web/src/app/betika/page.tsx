import { count, sum, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, tickets, matches } from "@whatsbet/database";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DonutChart } from "@/components/ui/charts";
import { formatCdf } from "@/lib/utils";

export default async function BetikaDashboardPage() {
  let kpis = { activeUsers: 0, totalTickets: 0, totalVolume: 0, commission: 0, matchCount: 0, won: 0, lost: 0, pending: 0 };

  try {
    const db = getDb();
    const [active] = await db.select({ count: count() }).from(users).where(eq(users.status, "active"));
    const [ticketCount] = await db.select({ count: count() }).from(tickets);
    const [volume] = await db.select({ total: sum(tickets.stake) }).from(tickets);
    const [matchCount] = await db.select({ count: count() }).from(matches);
    const [won] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "won"));
    const [lost] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "lost"));
    const [pending] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "pending"));
    const totalVolume = parseFloat(volume?.total ?? "0");
    kpis = {
      activeUsers: active?.count ?? 0,
      totalTickets: ticketCount?.count ?? 0,
      totalVolume,
      commission: totalVolume * 0.05,
      matchCount: matchCount?.count ?? 0,
      won: won?.count ?? 0,
      lost: lost?.count ?? 0,
      pending: pending?.count ?? 0,
    };
  } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader
        title="Dashboard Betika"
        description="Vue partenaire — statistiques en lecture seule"
        badge="Lecture seule"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Utilisateurs actifs" value={String(kpis.activeUsers)} icon="users" index={0} />
        <StatCard title="Tickets" value={String(kpis.totalTickets)} icon="ticket" index={1} />
        <StatCard title="Volume (CA)" value={formatCdf(kpis.totalVolume)} icon="trendingUp" index={2} />
        <StatCard title="Commissions (5%)" value={formatCdf(kpis.commission)} icon="percent" index={3} />
        <StatCard title="Matchs sync" value={String(kpis.matchCount)} icon="trophy" index={4} />
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-white">Performance des tickets</h2></CardHeader>
        <CardContent>
          <DonutChart segments={[
            { label: "Gagnés", value: kpis.won, color: "#10b981" },
            { label: "Perdus", value: kpis.lost, color: "#f43f5e" },
            { label: "En cours", value: kpis.pending, color: "#f59e0b" },
          ]} />
        </CardContent>
      </Card>
    </div>
  );
}
