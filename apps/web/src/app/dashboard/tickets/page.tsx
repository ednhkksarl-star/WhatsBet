import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tickets, users } from "@whatsbet/database";
import { PageHeader } from "@/components/ui/page-header";
import { TicketsTable } from "@/components/tickets/tickets-table";

export default async function TicketsPage() {
  let rows: Array<{ ticket: typeof tickets.$inferSelect; user: typeof users.$inferSelect | null }> = [];
  try {
    rows = await getDb()
      .select({ ticket: tickets, user: users })
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .orderBy(desc(tickets.createdAt))
      .limit(50);
  } catch {
    /* DB not ready */
  }

  const tableRows = rows.map(({ ticket, user }) => ({
    id: ticket.id,
    stake: ticket.stake,
    totalOdds: ticket.totalOdds,
    potentialWin: ticket.potentialWin,
    status: ticket.status,
    isQuickBet: ticket.isQuickBet,
    createdAt: ticket.createdAt.toISOString(),
    userPhone: user?.phone ?? null,
  }));

  return (
    <div>
      <PageHeader title="Tickets" description="Tous les paris et combinés de la plateforme" />
      <TicketsTable rows={tableRows} />
    </div>
  );
}
