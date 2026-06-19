import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { inferProvinceFromPhone, isValidDisplayPhone, normalizePhone } from "@whatsbet/shared";
import { users, auditLogs } from "@whatsbet/database";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";

const createSchema = z.object({
  phone: z.string().min(9).max(32),
  name: z.string().max(255).optional().nullable(),
  province: z.string().max(8).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "blocked", "suspended"]).default("active"),
});

export async function GET() {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getDb().select().from(users).orderBy(desc(users.createdAt)).limit(200);
  return NextResponse.json({ parieurs: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());
  const phone = normalizePhone(body.phone);
  if (!isValidDisplayPhone(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Ce numéro est déjà enregistré" }, { status: 409 });
  }

  const province = body.province ?? inferProvinceFromPhone(phone);
  const [created] = await db
    .insert(users)
    .values({
      phone,
      name: body.name?.trim() || undefined,
      province: province ?? undefined,
      city: body.city?.trim() || undefined,
      status: body.status,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "parieur_created",
    payload: { userId: created.id, phone: created.phone },
  });

  return NextResponse.json({ parieur: created }, { status: 201 });
}
