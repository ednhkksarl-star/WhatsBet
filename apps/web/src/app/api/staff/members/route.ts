import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, canManageStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { admins, staffRoles, auditLogs } from "@whatsbet/database";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureDefaultStaffRoles } from "@/lib/staff-seed";

const createSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  staffRoleId: z.string().uuid(),
  avatarBase64: z.string().max(500_000).optional().nullable(),
  status: z.enum(["active", "disabled"]).default("active"),
});

export async function GET() {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDefaultStaffRoles();
  const db = getDb();
  const rows = await db
    .select({ admin: admins, role: staffRoles })
    .from(admins)
    .leftJoin(staffRoles, eq(admins.staffRoleId, staffRoles.id))
    .orderBy(desc(admins.createdAt));

  return NextResponse.json({
    members: rows.map(({ admin, role }) => ({
      ...admin,
      passwordHash: undefined,
      twoFactorSecret: undefined,
      staffRole: role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());
  const db = getDb();

  const [role] = await db.select().from(staffRoles).where(eq(staffRoles.id, body.staffRoleId)).limit(1);
  if (!role) {
    return NextResponse.json({ error: "Rôle introuvable" }, { status: 400 });
  }

  const [emailTaken] = await db.select().from(admins).where(eq(admins.email, body.email)).limit(1);
  if (emailTaken) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const [created] = await db
    .insert(admins)
    .values({
      name: body.name,
      email: body.email,
      passwordHash,
      role: role.adminRole,
      staffRoleId: role.id,
      avatarBase64: body.avatarBase64 ?? undefined,
      status: body.status,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_member_created",
    payload: { memberId: created.id, email: created.email },
  });

  return NextResponse.json({
    member: {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      staffRoleId: created.staffRoleId,
      avatarBase64: created.avatarBase64,
      status: created.status,
      twoFactorEnabled: created.twoFactorEnabled,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  });
}
