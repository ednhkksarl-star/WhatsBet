import { notFound } from "next/navigation";
import Link from "next/link";
import { and, count, desc, eq, sum } from "drizzle-orm";
import { ArrowLeft, Ticket, Wallet } from "lucide-react";
import { getDb } from "@/lib/db";
import { users, tickets, transactions, withdrawals } from "@whatsbet/database";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ParieurDetailActions } from "@/components/parieurs/parieur-detail-actions";
import { provinceLabel } from "@/lib/province-label";
import { formatCdf } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ParieurDetailPage({ params }: Props) {
  const { id } = await params;
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) notFound();

  const [ticketStats] = await db
    .select({ count: count(), volume: sum(tickets.stake) })
    .from(tickets)
    .where(eq(tickets.userId, id));

  const [depositStats] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.userId, id), eq(transactions.type, "deposit"), eq(transactions.status, "completed")));

  const [withdrawalStats] = await db
    .select({ total: sum(withdrawals.amount) })
    .from(withdrawals)
    .where(and(eq(withdrawals.userId, id), eq(withdrawals.status, "paid")));

  const recentTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, id))
    .orderBy(desc(transactions.createdAt))
    .limit(10);

  const recentTickets = await db
    .select({
      id: tickets.id,
      stake: tickets.stake,
      totalOdds: tickets.totalOdds,
      potentialWin: tickets.potentialWin,
      status: tickets.status,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .where(eq(tickets.userId, id))
    .orderBy(desc(tickets.createdAt))
    .limit(10);

  const avatarSrc = user.profilePictureBase64
    ? user.profilePictureBase64.startsWith("data:")
      ? user.profilePictureBase64
      : `data:image/jpeg;base64,${user.profilePictureBase64}`
    : undefined;

  const parieurForClient = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return (
    <div>
      <Link
        href="/dashboard/parieurs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux parieurs
      </Link>

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={user.name ?? user.phone} src={avatarSrc} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{user.name ?? "Sans nom"}</h1>
              <Badge status={user.status} />
            </div>
            <p className="mt-1 font-mono text-muted">{user.phone}</p>
            <p className="mt-2 text-sm text-muted">
              {provinceLabel(user.province)}
              {user.city ? ` · ${user.city}` : ""} · Inscrit le{" "}
              {new Date(user.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </p>
          </div>
        </div>
        <ParieurDetailActions parieur={parieurForClient} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Solde actuel" value={formatCdf(user.balance)} icon="wallet" index={0} />
        <StatCard
          title="Dépôts"
          value={formatCdf(depositStats?.total ?? "0")}
          icon="arrowDownCircle"
          changeType="positive"
          index={1}
        />
        <StatCard title="Retraits payés" value={formatCdf(withdrawalStats?.total ?? "0")} icon="arrowUpCircle" index={2} />
        <StatCard
          title="Volume parié"
          value={formatCdf(ticketStats?.volume ?? "0")}
          icon="trendingUp"
          index={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Wallet className="h-4 w-4 text-brand-yellow-500" />
              Transactions récentes
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted">Aucune transaction</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm capitalize text-white">{tx.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted">{new Date(tx.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-brand-yellow-500">{formatCdf(tx.amount)}</p>
                    <Badge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Ticket className="h-4 w-4 text-brand-yellow-500" />
              Tickets récents ({ticketStats?.count ?? 0})
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-muted">Aucun ticket</p>
            ) : (
              recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted">{t.id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-white">{formatCdf(t.stake)}</p>
                    <Badge status={t.status} />
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
