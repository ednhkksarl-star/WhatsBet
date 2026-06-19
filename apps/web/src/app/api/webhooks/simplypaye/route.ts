import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, transactions, auditLogs } from "@whatsbet/database";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference ?? body.transaction_id ?? body.id;
    const amount = parseFloat(body.amount ?? body.montant ?? "0");
    const status = (body.status ?? "").toLowerCase();
    const userPhone = body.phone ?? body.customer_phone;
    const idempotencyKey = body.idempotency_key ?? reference;

    if (!reference || !idempotencyKey) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const db = getDb();

    const [existing] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing?.status === "completed") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (!existing && userPhone) {
      const [user] = await db.select().from(users).where(eq(users.phone, userPhone)).limit(1);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      await db.insert(transactions).values({
        userId: user.id,
        type: "deposit",
        amount: String(amount),
        status: "pending",
        reference,
        idempotencyKey,
        metadata: body,
      });
    }

    if (status === "success" || status === "completed" || status === "paid") {
      const [tx] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.idempotencyKey, idempotencyKey))
        .limit(1);

      if (tx) {
        await db.update(transactions).set({ status: "completed", completedAt: new Date() }).where(eq(transactions.id, tx.id));

        const [user] = await db.select().from(users).where(eq(users.id, tx.userId)).limit(1);
        if (user) {
          const newBalance = parseFloat(user.balance) + amount;
          await db.update(users).set({ balance: String(newBalance), updatedAt: new Date() }).where(eq(users.id, user.id));
        }

        await db.insert(auditLogs).values({
          actorType: "system",
          action: "deposit_completed",
          payload: { reference, amount, userId: tx.userId },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SimplyPaye webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
