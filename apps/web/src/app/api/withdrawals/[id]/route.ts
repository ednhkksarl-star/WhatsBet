import { NextRequest, NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { withdrawals, users, auditLogs } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { formatCdf } from "@whatsbet/shared";
import { gatewaySendMessage } from "@/lib/gateway-client";
import { logUserNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();
  const db = getDb();

  const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
  }

  if (action === "rejected") {
    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Invalid withdrawal state" }, { status: 400 });
    }
    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
    if (user) {
      const refunded = parseFloat(user.balance) + parseFloat(withdrawal.amount);
      await db.update(users).set({ balance: String(refunded), updatedAt: new Date() }).where(eq(users.id, user.id));
    }
    await db.update(withdrawals).set({ status: "rejected", reviewedBy: session.adminId, reviewedAt: new Date() }).where(eq(withdrawals.id, id));
  } else if (action === "approved") {
    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Invalid withdrawal state" }, { status: 400 });
    }
    await db.update(withdrawals).set({ status: "approved", reviewedBy: session.adminId, reviewedAt: new Date() }).where(eq(withdrawals.id, id));
  } else if (action === "paid") {
    if (withdrawal.status !== "approved") {
      return NextResponse.json({ error: "Le retrait doit être approuvé avant paiement" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db
      .update(withdrawals)
      .set({ status: "paid", paidAt: new Date(), reviewedBy: session.adminId, reviewedAt: new Date() })
      .where(eq(withdrawals.id, id));

    const msg = `✅ Votre retrait de *${formatCdf(parseFloat(withdrawal.amount))}* a été payé sur *${withdrawal.mobileMoneyNumber}*. Merci de jouer avec WhatsBet !`;

    try {
      await gatewaySendMessage({
        phone: user.phone,
        jid: user.whatsappJid,
        text: msg,
      });
      await logUserNotification({ userId: user.id, type: "withdrawal_paid", message: msg, sent: true });
    } catch (err) {
      logger.error("withdrawal_paid_notification_failed", {
        withdrawalId: id,
        error: err instanceof Error ? err.message : String(err),
      });
      await logUserNotification({ userId: user.id, type: "withdrawal_paid", message: msg, sent: false });
    }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: `withdrawal_${action}`,
    payload: { withdrawalId: id },
  });

  return NextResponse.json({ success: true });
}
