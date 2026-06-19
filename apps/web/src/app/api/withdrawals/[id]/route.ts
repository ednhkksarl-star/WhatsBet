import { NextRequest, NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { withdrawals, users, auditLogs } from "@whatsbet/database";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await req.json();
  const db = getDb();

  const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
  if (!withdrawal || withdrawal.status !== "pending") {
    return NextResponse.json({ error: "Invalid withdrawal" }, { status: 400 });
  }

  if (action === "rejected") {
    const [user] = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1);
    if (user) {
      const refunded = parseFloat(user.balance) + parseFloat(withdrawal.amount);
      await db.update(users).set({ balance: String(refunded), updatedAt: new Date() }).where(eq(users.id, user.id));
    }
    await db.update(withdrawals).set({ status: "rejected", reviewedBy: session.adminId, reviewedAt: new Date() }).where(eq(withdrawals.id, id));
  } else if (action === "approved") {
    await db.update(withdrawals).set({ status: "approved", reviewedBy: session.adminId, reviewedAt: new Date() }).where(eq(withdrawals.id, id));
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
