import { getDb } from "@/lib/db";
import { transactions } from "@whatsbet/database";

export async function recordBet(params: {
  userId: string;
  amount: number;
  ticketId: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(transactions).values({
    userId: params.userId,
    type: "bet",
    amount: String(params.amount),
    status: "completed",
    reference: `bet-${params.ticketId}`,
    idempotencyKey: `bet-${params.ticketId}`,
    metadata: { ticketId: params.ticketId, ...params.metadata },
    completedAt: new Date(),
  });
}

export async function recordWin(params: {
  userId: string;
  amount: number;
  ticketId: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(transactions).values({
    userId: params.userId,
    type: "win",
    amount: String(params.amount),
    status: "completed",
    reference: `win-${params.ticketId}`,
    idempotencyKey: `win-${params.ticketId}`,
    metadata: { ticketId: params.ticketId, ...params.metadata },
    completedAt: new Date(),
  });
}
