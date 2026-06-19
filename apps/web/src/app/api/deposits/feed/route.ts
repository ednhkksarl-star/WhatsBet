import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { transactions, users } from "@whatsbet/database";
import { reconcilePendingDeposits } from "@/lib/deposits";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await reconcilePendingDeposits({ limit: 50 });

  const rows = await getDb()
    .select({ tx: transactions, user: users })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(eq(transactions.type, "deposit"))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    rows: rows.map(({ tx, user }) => ({
      id: tx.id,
      phone: user?.phone ?? "—",
      amount: tx.amount,
      reference: tx.reference,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
    })),
  });
}
