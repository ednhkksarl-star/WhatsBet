import { NextRequest, NextResponse } from "next/server";
import { getSession, canManageStaff } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { staffRoles, admins, auditLogs } from "@whatsbet/database";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ALL_STAFF_PERMISSIONS } from "@/lib/staff-permissions";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9_]+$/).optional(),
  description: z.string().max(500).optional(),
  adminRole: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "SUPPORT", "BETIKA"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = updateSchema.parse(await req.json());
  const db = getDb();

  const [existing] = await db.select().from(staffRoles).where(eq(staffRoles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
  }

  const updates: Partial<typeof staffRoles.$inferInsert> = { updatedAt: new Date() };
  if (body.name) updates.name = body.name;
  if (body.slug && !existing.isSystem) updates.slug = body.slug;
  if (body.description !== undefined) updates.description = body.description;
  if (body.adminRole && !existing.isSystem) updates.adminRole = body.adminRole;
  if (body.permissions) {
    updates.permissions = body.permissions.filter((p) =>
      ALL_STAFF_PERMISSIONS.includes(p as typeof ALL_STAFF_PERMISSIONS[number])
    );
  }

  const [updated] = await db.update(staffRoles).set(updates).where(eq(staffRoles.id, id)).returning();

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_role_updated",
    payload: { roleId: id },
  });

  return NextResponse.json({ role: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canManageStaff(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const [existing] = await db.select().from(staffRoles).where(eq(staffRoles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Rôle introuvable" }, { status: 404 });
  }
  if (existing.isSystem) {
    return NextResponse.json({ error: "Les rôles système ne peuvent pas être supprimés" }, { status: 400 });
  }

  const [inUse] = await db.select().from(admins).where(eq(admins.staffRoleId, id)).limit(1);
  if (inUse) {
    return NextResponse.json({ error: "Ce rôle est assigné à un membre de l'équipe" }, { status: 400 });
  }

  await db.delete(staffRoles).where(eq(staffRoles.id, id));

  await db.insert(auditLogs).values({
    actorType: "admin",
    actorId: session.adminId,
    action: "staff_role_deleted",
    payload: { roleId: id, slug: existing.slug },
  });

  return NextResponse.json({ success: true });
}
