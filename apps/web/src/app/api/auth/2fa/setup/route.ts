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
  const secret = generateTotpSecret();
  const uri = getOtpAuthUri(session.email, secret);

  await db
    .update(admins)
    .set({ twoFactorSecret: secret, twoFactorEnabled: true, updatedAt: new Date() })
    .where(eq(admins.id, session.adminId));

  return NextResponse.json({ secret, uri });
}
