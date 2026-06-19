import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, sum } from "drizzle-orm";
import { z } from "zod";
import { inferProvinceFromPhone, isValidDisplayPhone, normalizePhone } from "@whatsbet/shared";
import { users, tickets, transactions, withdrawals, auditLogs } from "@whatsbet/database";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";

const updateSchema = z.object({
  phone: z.string().min(9).max(32).optional(),
  name: z.string().max(255).optional().nullable(),
  province: z.string().max(8).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "blocked", "suspended"]).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Parieur introuvable" }, { status: 404 });
  }

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

  return NextResponse.json({
    parieur: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    stats: {
      ticketsCount: ticketStats?.count ?? 0,
      ticketsVolume: parseFloat(ticketStats?.volume ?? "0"),
      depositsTotal: parseFloat(depositStats?.total ?? "0"),
      withdrawalsTotal: parseFloat(withdrawalStats?.total ?? "0"),
    },
    recentTransactions: recentTransactions.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    recentTickets: recentTickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Parieur introuvable" }, { status: 404 });
  }

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (body.phone !== undefined) {
    const phone = normalizePhone(body.phone);
    if (!isValidDisplayPhone(phone)) {
      return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
    }
    if (phone !== user.phone) {
      const [taken] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      if (taken) {
        return NextResponse.json({ error: "Ce numéro est déjà utilisé" }, { status: 409 });
      }
      updates.phone = phone;
      if (body.province === undefined && !user.province) {
        updates.province = inferProvinceFromPhone(phone) ?? undefined;
      }
    }
  }

  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.province !== undefined) updates.province = body.province || null;
  if (body.city !== undefined) updates.city = body.city?.trim() || null;
  if (body.status !== undefined) updates.status = body.status;

  const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "parieur_updated",
    payload: { userId: id, changes: body },
  });

  return NextResponse.json({ parieur: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "Parieur introuvable" }, { status: 404 });
  }

  const [ticketRow] = await db.select({ count: count() }).from(tickets).where(eq(tickets.userId, id));
  const [txRow] = await db.select({ count: count() }).from(transactions).where(eq(transactions.userId, id));
  const [wdRow] = await db.select({ count: count() }).from(withdrawals).where(eq(withdrawals.userId, id));

  const hasActivity = (ticketRow?.count ?? 0) + (txRow?.count ?? 0) + (wdRow?.count ?? 0) > 0;
  if (hasActivity || parseFloat(user.balance) > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un parieur avec solde ou historique. Bloquez-le plutôt." },
      { status: 409 }
    );
  }

  await db.delete(users).where(eq(users.id, id));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "parieur_deleted",
    payload: { userId: id, phone: user.phone },
  });

  return NextResponse.json({ success: true });
}
