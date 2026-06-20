import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins } from "@whatsbet/database";

const schema = z.object({
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await req.json());
  const db = getDb();

  const [admin] = await db.select().from(admins).where(eq(admins.id, session.adminId)).limit(1);
  if (!admin) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const valid = await bcrypt.compare(body.password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  await db
    .update(admins)
    .set({ twoFactorSecret: null, twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(admins.id, session.adminId));

  return NextResponse.json({ success: true });
}
