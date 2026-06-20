import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins } from "@whatsbet/database";
import { verifyTotp } from "@/lib/totp";

const schema = z.object({
  code: z.string().min(6).max(6),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const db = getDb();

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin?.twoFactorSecret) {
    return NextResponse.json({ error: "Aucune configuration 2FA en cours. Relancez l'activation." }, { status: 400 });
  }

  if (!verifyTotp(admin.twoFactorSecret, body.code)) {
    return NextResponse.json(
      { error: "Code incorrect. Vérifiez l'heure de votre téléphone et le QR code scanné." },
      { status: 400 }
    );
  }

  await db
    .update(admins)
    .set({ twoFactorEnabled: true, updatedAt: new Date() })
    .where(eq(admins.id, session.adminId));

  return NextResponse.json({ success: true });
}
