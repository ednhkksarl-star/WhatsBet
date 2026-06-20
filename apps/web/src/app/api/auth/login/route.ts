import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { admins, auditLogs } from "@whatsbet/database";
import { verifyTotp } from "@/lib/totp";
import { z } from "zod";
import { logger } from "@/lib/logger";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totpCode: z.string().optional(),
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

    if (admin.status === "disabled") {
      return NextResponse.json({ error: "Compte désactivé. Contactez un super admin." }, { status: 403 });
    }

    if (admin.twoFactorEnabled) {
      if (!admin.twoFactorSecret || !body.totpCode) {
        return NextResponse.json({ error: "2FA requis", requires2FA: true }, { status: 401 });
      }
      if (!verifyTotp(admin.twoFactorSecret, body.totpCode)) {
        return NextResponse.json(
          {
            error:
              "Code 2FA invalide. Vérifiez l'heure de votre téléphone ou réinitialisez le 2FA dans Configuration.",
          },
          { status: 401 }
        );
      }
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
    logger.error("login_failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
