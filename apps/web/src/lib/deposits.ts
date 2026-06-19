import { eq, and, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, transactions, messages, auditLogs } from "@whatsbet/database";
import { formatCdf } from "@whatsbet/shared";
import { checkPaymentStatus, isPaymentSuccess } from "@/lib/simplypaye";
import { gatewaySendMessage } from "@/lib/gateway-client";
import { logUserNotification } from "@/lib/notifications";

export async function completeDepositTransaction(
  txId: string,
  options?: { notifyWhatsApp?: boolean }
): Promise<boolean> {
  const db = getDb();
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
  if (!tx || tx.status === "completed" || tx.type !== "deposit") return false;

  const creditAmount = parseFloat(tx.amount);
  await db
    .update(transactions)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(transactions.id, tx.id));

  const [user] = await db.select().from(users).where(eq(users.id, tx.userId)).limit(1);
  if (!user) return true;

  const newBalance = parseFloat(user.balance) + creditAmount;
  await db
    .update(users)
    .set({ balance: String(newBalance), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db.insert(auditLogs).values({
    actorType: "system",
    action: "deposit_completed",
    payload: { transactionId: tx.id, reference: tx.reference, amount: creditAmount, userId: user.id },
  });

  const confirmation = `✅ Dépôt confirmé !\n\n*${formatCdf(creditAmount)}* ont été ajoutés à votre solde.\n\n💰 Nouveau solde : *${formatCdf(newBalance)}*\n\nTapez *matchs* ou *quick* pour parier.`;

  if (options?.notifyWhatsApp !== false) {
    try {
      await gatewaySendMessage({
        phone: user.phone,
        jid: user.whatsappJid,
        text: confirmation,
      });
      await db.insert(messages).values({ userId: user.id, text: confirmation, fromMe: true });
      await logUserNotification({
        userId: user.id,
        type: "deposit_completed",
        message: confirmation,
        sent: true,
      });
    } catch {
      /* gateway offline — balance still credited */
    }
  } else {
    await db.insert(messages).values({ userId: user.id, text: confirmation, fromMe: true });
  }

  return true;
}

export async function reconcilePendingDeposits(options?: {
  userId?: string;
  limit?: number;
}): Promise<{ checked: number; completed: number }> {
  const db = getDb();
  const conditions = [eq(transactions.type, "deposit"), eq(transactions.status, "pending")];
  if (options?.userId) conditions.push(eq(transactions.userId, options.userId));

  const pending = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt))
    .limit(options?.limit ?? 20);

  let completed = 0;
  for (const tx of pending) {
    if (!tx.reference) continue;
    try {
      const status = await checkPaymentStatus(tx.reference);
      if (isPaymentSuccess(status)) {
        const ok = await completeDepositTransaction(tx.id);
        if (ok) completed++;
      }
    } catch {
      /* skip unreachable SimplyPaye status */
    }
  }

  return { checked: pending.length, completed };
}
