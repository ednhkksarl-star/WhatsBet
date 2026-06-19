import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, transactions, auditLogs } from "@whatsbet/database";

function findTransactionWhere(reference?: string, orderNumber?: string, idempotencyKey?: string) {
  const conditions = [];
  if (idempotencyKey) conditions.push(eq(transactions.idempotencyKey, idempotencyKey));
  if (reference) conditions.push(eq(transactions.reference, reference));
  if (orderNumber) conditions.push(eq(transactions.reference, orderNumber));
  if (conditions.length === 0) return undefined;
  return conditions.length === 1 ? conditions[0] : or(...conditions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference ?? body.transaction_id ?? body.id;
    const orderNumber =
      body.orderNumber ??
      body.order_number ??
      body.simply_pay?.orderNumber ??
      body.transaction?.orderNumberFlex;
    const amount = parseFloat(body.amount ?? body.montant ?? "0");
    const status = String(body.status ?? body.code ?? "").toLowerCase();
    const userPhone = body.phone ?? body.customer_phone;
    const idempotencyKey = body.idempotency_key ?? reference;

    if (!reference && !orderNumber && !idempotencyKey) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const db = getDb();
    const whereClause = findTransactionWhere(reference, orderNumber, idempotencyKey);

    let existing = null;
    if (whereClause) {
      [existing] = await db.select().from(transactions).where(whereClause).limit(1);
    }

    if (existing?.status === "completed") {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (!existing && userPhone && reference && idempotencyKey) {
      const [user] = await db.select().from(users).where(eq(users.phone, userPhone)).limit(1);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      await db.insert(transactions).values({
        userId: user.id,
        type: "deposit",
        amount: String(amount),
        status: "pending",
        reference: orderNumber ?? reference,
        idempotencyKey,
        metadata: body,
      });

      [existing] = await db.select().from(transactions).where(whereClause!).limit(1);
    }

    const isSuccess =
      status === "success" || status === "completed" || status === "paid" || status === "0";

    if (isSuccess && existing) {
      const creditAmount = amount > 0 ? amount : parseFloat(existing.amount);
      await db
        .update(transactions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(transactions.id, existing.id));

      const [user] = await db.select().from(users).where(eq(users.id, existing.userId)).limit(1);
      if (user) {
        const newBalance = parseFloat(user.balance) + creditAmount;
        await db
          .update(users)
          .set({ balance: String(newBalance), updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      await db.insert(auditLogs).values({
        actorType: "system",
        action: "deposit_completed",
        payload: { reference, orderNumber, amount: creditAmount, userId: existing.userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SimplyPaye webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
