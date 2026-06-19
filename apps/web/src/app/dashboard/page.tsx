import { eq, desc, count, sum, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, tickets, transactions, withdrawals, auditLogs } from "@whatsbet/database";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AreaChart } from "@/components/ui/charts";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCdf } from "@/lib/utils";
import Link from "next/link";
import {
  Users, Ticket, ArrowDownCircle, ArrowUpCircle, TrendingUp, Percent,
  Activity, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

async function getDashboardData() {
  const db = getDb();
  const [userCount] = await db.select({ count: count() }).from(users);
  const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.status, "active"));
  const [ticketCount] = await db.select({ count: count() }).from(tickets);
  const [volume] = await db.select({ total: sum(tickets.stake) }).from(tickets);
  const [deposits] = await db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "deposit"));
  const [pendingWithdrawals] = await db.select({ count: count() }).from(withdrawals).where(eq(withdrawals.status, "pending"));
  const recentLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8);
  const recentTickets = await db
    .select({ ticket: tickets, user: users })
    .from(tickets)
    .leftJoin(users, eq(tickets.userId, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(5);

  const totalVolume = parseFloat(volume?.total ?? "0");

  // Volume chart — last 7 days
  const chartData = await db
    .select({
      day: sql<string>`to_char(${tickets.createdAt}, 'DD/MM')`,
      total: sum(tickets.stake),
    })
    .from(tickets)
    .where(sql`${tickets.createdAt} > now() - interval '7 days'`)
    .groupBy(sql`to_char(${tickets.createdAt}, 'DD/MM')`)
    .orderBy(sql`min(${tickets.createdAt})`);

  return {
    totalUsers: userCount?.count ?? 0,
    activeUsers: activeUsers?.count ?? 0,
    totalTickets: ticketCount?.count ?? 0,
    totalVolume,
    totalDeposits: parseFloat(deposits?.total ?? "0"),
    pendingWithdrawals: pendingWithdrawals?.count ?? 0,
    commission: totalVolume * 0.05,
    recentLogs,
    recentTickets,
    chartData: chartData.map((d) => ({ label: d.day, value: parseFloat(d.total ?? "0") })),
  };
}

export default async function DashboardPage() {
  let data = {
    totalUsers: 0, activeUsers: 0, totalTickets: 0, totalVolume: 0,
    totalDeposits: 0, pendingWithdrawals: 0, commission: 0,
    recentLogs: [] as Awaited<ReturnType<typeof getDashboardData>>["recentLogs"],
    recentTickets: [] as Awaited<ReturnType<typeof getDashboardData>>["recentTickets"],
    chartData: [] as { label: string; value: number }[],
  };

  try { data = await getDashboardData(); } catch { /* DB not ready */ }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de la plateforme WhatsBet"
        action={
          data.pendingWithdrawals > 0 ? (
            <Link href="/dashboard/withdrawals">
              <Button variant="danger" size="sm">
                {data.pendingWithdrawals} retrait{data.pendingWithdrawals > 1 ? "s" : ""} en attente
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Utilisateurs" value={String(data.totalUsers)} change={`${data.activeUsers} actifs`} icon={Users} index={0} />
        <StatCard title="Tickets" value={String(data.totalTickets)} icon={Ticket} index={1} />
        <StatCard title="Volume parié" value={formatCdf(data.totalVolume)} icon={TrendingUp} index={2} />
        <StatCard title="Dépôts" value={formatCdf(data.totalDeposits)} changeType="positive" icon={ArrowDownCircle} index={3} />
        <StatCard title="Retraits pending" value={String(data.pendingWithdrawals)} changeType={data.pendingWithdrawals > 0 ? "negative" : "neutral"} icon={ArrowUpCircle} index={4} />
        <StatCard title="Commissions" value={formatCdf(data.commission)} change="5%" icon={Percent} index={5} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" glow>
          <CardHeader>
            <h2 className="font-semibold text-white">Volume des paris — 7 jours</h2>
            <Link href="/dashboard/analytics" className="text-xs text-brand-yellow-500 hover:underline">Voir analytics →</Link>
          </CardHeader>
          <CardContent>
            <AreaChart data={data.chartData.length > 0 ? data.chartData : [
              { label: "Lun", value: 0 }, { label: "Mar", value: 0 }, { label: "Mer", value: 0 },
              { label: "Jeu", value: 0 }, { label: "Ven", value: 0 }, { label: "Sam", value: 0 }, { label: "Dim", value: 0 },
            ]} height={200} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Activity className="h-4 w-4 text-brand-yellow-500" />
              Activité récente
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted">Aucune activité récente</p>
            ) : (
              data.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-yellow-500" />
                  <div>
                    <p className="font-medium text-white">{log.action}</p>
                    <p className="text-xs text-muted">{new Date(log.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="font-semibold text-white">Derniers tickets</h2>
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">Tout voir <ArrowRight className="h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {data.recentTickets.length === 0 ? (
              <p className="p-6 text-sm text-muted">Aucun ticket pour le moment</p>
            ) : (
              data.recentTickets.map(({ ticket, user }) => (
                <div key={ticket.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{user?.phone ?? "—"}</p>
                    <p className="text-xs text-muted">{formatCdf(ticket.stake)} · ×{parseFloat(ticket.totalOdds).toFixed(2)}</p>
                  </div>
                  <Badge status={ticket.status} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
