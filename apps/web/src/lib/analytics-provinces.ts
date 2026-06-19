import { sql, eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, tickets, transactions } from "@whatsbet/database";
import { RDC_PROVINCES } from "@/data/rdc-provinces";
import type { ProvinceStat } from "@/components/analytics/rdc-map";

export async function getProvinceStats(): Promise<ProvinceStat[]> {
  const db = getDb();

  const playerRows = await db
    .select({ province: users.province, count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.province} is not null`)
    .groupBy(users.province);

  const ticketRows = await db
    .select({
      province: users.province,
      count: sql<number>`count(${tickets.id})::int`,
      volume: sql<string>`coalesce(sum(${tickets.stake}), 0)`,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(sql`${users.province} is not null`)
    .groupBy(users.province);

  const revenueRows = await db
    .select({
      province: users.province,
      revenue: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.userId, users.id))
    .where(and(eq(transactions.type, "deposit"), eq(transactions.status, "completed"), sql`${users.province} is not null`))
    .groupBy(users.province);

  const byProvince = new Map<string, { players: number; tickets: number; volume: number; revenue: number }>();

  for (const row of playerRows) {
    if (!row.province) continue;
    const cur = byProvince.get(row.province) ?? { players: 0, tickets: 0, volume: 0, revenue: 0 };
    cur.players = row.count;
    byProvince.set(row.province, cur);
  }
  for (const row of ticketRows) {
    if (!row.province) continue;
    const cur = byProvince.get(row.province) ?? { players: 0, tickets: 0, volume: 0, revenue: 0 };
    cur.tickets = row.count;
    cur.volume = parseFloat(row.volume ?? "0");
    byProvince.set(row.province, cur);
  }
  for (const row of revenueRows) {
    if (!row.province) continue;
    const cur = byProvince.get(row.province) ?? { players: 0, tickets: 0, volume: 0, revenue: 0 };
    cur.revenue = parseFloat(row.revenue ?? "0");
    byProvince.set(row.province, cur);
  }

  return RDC_PROVINCES.map((p) => {
    const data = byProvince.get(p.id);
    return {
      id: p.id,
      name: p.name,
      players: data?.players ?? 0,
      tickets: data?.tickets ?? 0,
      volume: data?.volume ?? 0,
      revenue: data?.revenue ?? 0,
    };
  });
}
