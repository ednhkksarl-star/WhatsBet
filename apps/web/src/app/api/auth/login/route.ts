import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { admins, auditLogs } from "@whatsbet/database";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const db = getDb();

    const [admin] = await db.select().from(admins).where(eq(admins.email, body.email)).limit(1);
    if (!admin) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const valid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    await createSession({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    });

    await db.insert(auditLogs).values({
      actorType: "admin",
      actorId: admin.id,
      action: "login",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    return NextResponse.json({ success: true, role: admin.role });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
