import { eq, count, sum, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tickets, users, matches } from "@whatsbet/database";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AreaChart, DonutChart } from "@/components/ui/charts";
import { StatCard } from "@/components/ui/stat-card";
import { formatCdf } from "@/lib/utils";
import { BarChart3, Users, Ticket, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  let stats = { totalUsers: 0, totalTickets: 0, totalVolume: 0, wonTickets: 0, lostTickets: 0, pendingTickets: 0 };
  let volumeChart: { label: string; value: number }[] = [];
  let topLeagues: { league: string; count: number }[] = [];

  try {
    const db = getDb();
    const [u] = await db.select({ count: count() }).from(users);
    const [t] = await db.select({ count: count() }).from(tickets);
    const [v] = await db.select({ total: sum(tickets.stake) }).from(tickets);
    const [won] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "won"));
    const [lost] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "lost"));
    const [pending] = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "pending"));

    stats = {
      totalUsers: u?.count ?? 0,
      totalTickets: t?.count ?? 0,
      totalVolume: parseFloat(v?.total ?? "0"),
      wonTickets: won?.count ?? 0,
      lostTickets: lost?.count ?? 0,
      pendingTickets: pending?.count ?? 0,
    };

    const chart = await db
      .select({ day: sql<string>`to_char(${tickets.createdAt}, 'DD/MM')`, total: sum(tickets.stake) })
      .from(tickets)
      .where(sql`${tickets.createdAt} > now() - interval '30 days'`)
      .groupBy(sql`to_char(${tickets.createdAt}, 'DD/MM')`)
      .orderBy(sql`min(${tickets.createdAt})`);
    volumeChart = chart.map((d) => ({ label: d.day, value: parseFloat(d.total ?? "0") }));

    const leagues = await db
      .select({ league: matches.league, count: count() })
      .from(matches)
      .groupBy(matches.league)
      .orderBy(sql`count(*) desc`)
      .limit(5);
    topLeagues = leagues.map((l) => ({ league: l.league, count: l.count }));
  } catch { /* DB not ready */ }

  const ticketSegments = [
    { label: "Gagnés", value: stats.wonTickets, color: "#10b981" },
    { label: "Perdus", value: stats.lostTickets, color: "#f43f5e" },
    { label: "En cours", value: stats.pendingTickets, color: "#f59e0b" },
  ];

  return (
    <div>
      <PageHeader title="Analytics" description="Tendances, performance et insights de la plateforme" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Utilisateurs" value={String(stats.totalUsers)} icon={Users} index={0} />
        <StatCard title="Tickets total" value={String(stats.totalTickets)} icon={Ticket} index={1} />
        <StatCard title="Volume" value={formatCdf(stats.totalVolume)} icon={TrendingUp} index={2} />
        <StatCard title="Taux conversion" value={stats.totalUsers > 0 ? `${Math.round((stats.totalTickets / stats.totalUsers) * 100)}%` : "0%"} icon={BarChart3} index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card glow>
          <CardHeader><h2 className="font-semibold text-white">Volume — 30 jours</h2></CardHeader>
          <CardContent><AreaChart data={volumeChart} height={220} /></CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-white">Répartition des tickets</h2></CardHeader>
          <CardContent>
            <DonutChart segments={ticketSegments} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><h2 className="font-semibold text-white">Top ligues</h2></CardHeader>
        <CardContent>
          {topLeagues.length === 0 ? (
            <p className="text-sm text-muted">Synchronisez les matchs via The Odds API</p>
          ) : (
            <div className="space-y-3">
              {topLeagues.map((l, i) => (
                <div key={l.league} className="flex items-center gap-4">
                  <span className="w-6 text-sm font-mono text-muted">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{l.league}</span>
                      <span className="text-muted">{l.count} matchs</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-brand-yellow-500"
                        style={{ width: `${(l.count / (topLeagues[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
