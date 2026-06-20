import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins } from "@whatsbet/database";

export async function GET() {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [admin] = await db
    .select({
      twoFactorEnabled: admins.twoFactorEnabled,
      twoFactorSecret: admins.twoFactorSecret,
    })
    .from(admins)
    .where(eq(admins.id, session.adminId))
    .limit(1);

  if (!admin) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const pending = Boolean(admin.twoFactorSecret && !admin.twoFactorEnabled);

  return NextResponse.json({
    enabled: admin.twoFactorEnabled,
    pending,
  });
}
