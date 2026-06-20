import { NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { generateTotpSecret, getOtpAuthUri } from "@/lib/totp";

export async function POST() {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [admin] = await db
    .select({ twoFactorEnabled: admins.twoFactorEnabled })
    .from(admins)
    .where(eq(admins.id, session.adminId))
    .limit(1);

  if (admin?.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Le 2FA est déjà actif. Désactivez-le d'abord pour le reconfigurer." },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  const uri = getOtpAuthUri(session.email, secret);

  await db
    .update(admins)
    .set({ twoFactorSecret: secret, twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(admins.id, session.adminId));

  return NextResponse.json({ secret, uri, email: session.email, pending: true });
}
