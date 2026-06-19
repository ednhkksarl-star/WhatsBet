import { NextRequest, NextResponse } from "next/server";
import { getSession, canWrite } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, auditLogs } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["active", "blocked", "suspended"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canWrite(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = schema.parse(await req.json());
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.update(users).set({ status: body.status, updatedAt: new Date() }).where(eq(users.id, id));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: `user_${body.status}`,
    payload: { userId: id, previousStatus: user.status },
  });

  return NextResponse.json({ success: true, status: body.status });
}
